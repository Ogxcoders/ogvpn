import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, shell } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { AegisApi, DEFAULT_API_BASE_URL } from './api/AegisApi';
import { TokenStore } from './api/TokenStore';
import { SettingsStore } from './lib/SettingsStore';
import { VpnController } from './vpn/VpnController';
import { UpdateService } from './update/UpdateService';
import { IPC_CHANNELS, IPC_EVENT_CHANNEL, IPC_NAVIGATE_CHANNEL } from '../../../shared/ipc';
import type { AppEvent, SettingsMap } from '../../../shared/ipc';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let controller: VpnController;
let settingsStore: SettingsStore;
let quitting = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

/* ---------- device identity ---------- */

const DEVICE_UID_FILE = 'device-uid';

function deviceUid(): string {
  const file = path.join(app.getPath('userData'), DEVICE_UID_FILE);
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing) return existing;
  } catch {
    // generate below
  }
  const uid = crypto.randomUUID();
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(file, uid, { encoding: 'utf8', mode: 0o600 });
  return uid;
}

function deviceName(): string {
  return `${os.hostname()} · AegisVPN Desktop`;
}

/* ---------- event fan-out ---------- */

function emitEvent(e: AppEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC_EVENT_CHANNEL, e);
  }
  updateTray();
}

function updateTray(): void {
  if (!tray) return;
  const state = controller.getSnapshot().state;
  const label =
    state === 'CONNECTED' ? 'AegisVPN — Connected' :
    state === 'CONNECTING' || state === 'HANDSHAKING' ? 'AegisVPN — Connecting…' :
    state === 'RECONNECTING' ? 'AegisVPN — Reconnecting…' :
    state === 'DISCONNECTING' ? 'AegisVPN — Disconnecting…' :
    'AegisVPN — Disconnected';
  tray.setToolTip(label);
}

/* ---------- tray ---------- */

function buildTray(): void {
  // Template icon ships with packaged resources; an empty image keeps dev runs
  // working on Linux where tray icon formats vary.
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip('AegisVPN');
  const menu = Menu.buildFromTemplate([
    { label: 'Open AegisVPN', click: () => showWindow() },
    {
      label: controller.getSnapshot().state === 'CONNECTED' ? 'Disconnect' : 'Quick connect',
      click: () => {
        const snap = controller.getSnapshot();
        void (snap.state === 'CONNECTED' ? controller.disconnect() : controller.connectToBestServer());
      },
    },
    { type: 'separator' },
    { label: 'Quit AegisVPN', click: () => { quitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
  // Keep tray label fresh; click-through menu rebuilt on demand only.
  setInterval(updateTray, 5000).unref();
}

function showWindow(): void {
  if (!mainWindow) createWindow();
  mainWindow?.show();
  mainWindow?.focus();
}

/* ---------- window ---------- */

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 420,
    minHeight: 560,
    show: false,
    backgroundColor: '#0B1220',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    // __dirname = <app>/dist/electron/src/main at runtime; the vite renderer
    // bundle lives at <app>/dist/renderer, so climb three levels.
    void mainWindow.loadFile(path.join(__dirname, '../../../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Close-to-tray: closing the window hides it; Quit lives in tray + menu.
  mainWindow.on('close', (e) => {
    if (!quitting && controller.getSettings().closeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

/* ---------- menu ---------- */

function navigate(route: string): void {
  showWindow();
  mainWindow?.webContents.send(IPC_NAVIGATE_CHANNEL, route);
}

function buildMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'AegisVPN',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => navigate('/') },
        { label: 'Servers', accelerator: 'CmdOrCtrl+2', click: () => navigate('/servers') },
        { label: 'Devices', accelerator: 'CmdOrCtrl+3', click: () => navigate('/devices') },
        { label: 'Diagnostics', accelerator: 'CmdOrCtrl+4', click: () => navigate('/diagnostics') },
        { type: 'separator' },
        { label: 'Check for updates…', click: () => {
          const status = new UpdateService().getStatus();
          showWindow();
          mainWindow?.webContents.send(IPC_EVENT_CHANNEL, {
            type: 'notice', level: 'info', message: status.instructions,
          } satisfies AppEvent);
        } },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
  ]));
}

/* ---------- IPC ---------- */

function registerIpc(): void {
  ipcMain.handle(IPC_CHANNELS.authLogin, (_e, req: { email: string; password: string }) =>
    controller.login(req.email, req.password));
  ipcMain.handle(IPC_CHANNELS.authRegister, (_e, req: { email: string; password: string; name: string }) =>
    controller.register(req.email, req.password, req.name));
  ipcMain.handle(IPC_CHANNELS.authLogout, () => controller.logout());
  ipcMain.handle(IPC_CHANNELS.authMe, () => controller.me());
  ipcMain.handle(IPC_CHANNELS.serversList, () => controller.api.listServers());
  ipcMain.handle(IPC_CHANNELS.vpnConnect, (_e, serverId: string) => controller.connect(serverId));
  ipcMain.handle(IPC_CHANNELS.vpnDisconnect, () => controller.disconnect());
  ipcMain.handle(IPC_CHANNELS.vpnStatus, () => controller.getSnapshot());
  ipcMain.handle(IPC_CHANNELS.vpnResetError, () => controller.resetError());
  ipcMain.handle(IPC_CHANNELS.devicesList, () => controller.api.listDevices());
  ipcMain.handle(IPC_CHANNELS.devicesRename, (_e, id: string, name: string) => controller.api.renameDevice(id, name));
  ipcMain.handle(IPC_CHANNELS.devicesRevoke, (_e, id: string) => controller.api.revokeDevice(id));
  ipcMain.handle(IPC_CHANNELS.subscriptionGet, () => controller.api.getSubscription());
  ipcMain.handle(IPC_CHANNELS.subscriptionCheckout, (_e, planCode: 'free' | 'premium') => controller.api.checkout(planCode));
  ipcMain.handle(IPC_CHANNELS.settingsSet, (_e, key: keyof SettingsMap, value: boolean | string) => controller.setSetting(key, value));
  ipcMain.handle(IPC_CHANNELS.settingsAll, () => controller.getSettings());
  ipcMain.handle(IPC_CHANNELS.diagnosticsGet, () => controller.diagnostics());
}

/* ---------- app lifecycle ---------- */

app.whenReady().then(() => {
  const tokens = new TokenStore();
  tokens.load();
  const defaults: SettingsMap = {
    killSwitch: true,
    autoLaunch: false,
    autoConnect: false,
    closeToTray: true,
    apiBaseUrl: DEFAULT_API_BASE_URL,
  };
  settingsStore = new SettingsStore(defaults);
  const api = new AegisApi(tokens, { deviceName, deviceUid });
  api.setBaseUrlProvider(() => controller.getSettings().apiBaseUrl);
  controller = new VpnController(api, tokens, { emit: emitEvent }, settingsStore);

  void controller.init();
  registerIpc();
  buildMenu();
  createWindow();
  buildTray();

  app.on('second-instance', () => showWindow());
});

app.on('before-quit', () => {
  quitting = true;
});

app.on('window-all-closed', () => {
  // Tray-resident app: only quit when explicitly quitting.
  if (quitting) app.quit();
});

app.on('activate', () => showWindow());
