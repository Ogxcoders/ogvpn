import { contextBridge, ipcRenderer } from 'electron';
import { BRIDGE_NAME, IPC_CHANNELS, IPC_EVENT_CHANNEL, IPC_NAVIGATE_CHANNEL } from '../../../shared/ipc';
import type { AegisBridge } from '../../../shared/ipc';

/**
 * Preload: exposes the AegisBridge to the sandboxed renderer. This is the
 * ONLY channel between renderer and main; no tokens, private keys or shell
 * commands ever cross it in either direction.
 */
const bridge: AegisBridge = {
  login: (req) => ipcRenderer.invoke(IPC_CHANNELS.authLogin, req),
  register: (req) => ipcRenderer.invoke(IPC_CHANNELS.authRegister, req),
  logout: () => ipcRenderer.invoke(IPC_CHANNELS.authLogout),
  me: () => ipcRenderer.invoke(IPC_CHANNELS.authMe),
  listServers: () => ipcRenderer.invoke(IPC_CHANNELS.serversList),
  createPeer: (serverId) => ipcRenderer.invoke(IPC_CHANNELS.vpnCreatePeer, serverId),
  connect: (serverId) => ipcRenderer.invoke(IPC_CHANNELS.vpnConnect, serverId),
  disconnect: () => ipcRenderer.invoke(IPC_CHANNELS.vpnDisconnect),
  status: () => ipcRenderer.invoke(IPC_CHANNELS.vpnStatus),
  resetError: () => ipcRenderer.invoke(IPC_CHANNELS.vpnResetError),
  onEvent: (cb) => {
    const listener = (_e: unknown, payload: unknown) => cb(payload as Parameters<typeof cb>[0]);
    ipcRenderer.on(IPC_EVENT_CHANNEL, listener);
    return () => ipcRenderer.removeListener(IPC_EVENT_CHANNEL, listener);
  },
  onNavigate: (cb) => {
    const listener = (_e: unknown, route: string) => cb(route);
    ipcRenderer.on(IPC_NAVIGATE_CHANNEL, listener);
    return () => ipcRenderer.removeListener(IPC_NAVIGATE_CHANNEL, listener);
  },
  listDevices: () => ipcRenderer.invoke(IPC_CHANNELS.devicesList),
  renameDevice: (deviceId, name) => ipcRenderer.invoke(IPC_CHANNELS.devicesRename, deviceId, name),
  revokeDevice: (deviceId) => ipcRenderer.invoke(IPC_CHANNELS.devicesRevoke, deviceId),
  getSubscription: () => ipcRenderer.invoke(IPC_CHANNELS.subscriptionGet),
  checkout: (planCode) => ipcRenderer.invoke(IPC_CHANNELS.subscriptionCheckout, planCode),
  setSetting: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.settingsSet, key, value),
  getSetting: (key) => ipcRenderer.invoke(IPC_CHANNELS.settingsGet, key),
  getAllSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settingsAll),
  demoEnable: () => ipcRenderer.invoke(IPC_CHANNELS.demoEnable),
  demoDisable: () => ipcRenderer.invoke(IPC_CHANNELS.demoDisable),
  demoStatus: () => ipcRenderer.invoke(IPC_CHANNELS.demoStatus),
  getDiagnostics: () => ipcRenderer.invoke(IPC_CHANNELS.diagnosticsGet),
};

contextBridge.exposeInMainWorld(BRIDGE_NAME, bridge);
