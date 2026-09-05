/**
 * Demo-mode flag for the desktop app (Electron MAIN process).
 *
 * When enabled, AegisApi routes every control-plane call to DemoBackend and
 * VpnController simulates the connect/disconnect sequence — the full UI runs
 * without any backend or WireGuard tooling.
 *
 * Honest scope (mirrors the Android + web demo modes):
 *  - the UI is real; there is NO backend, NO tunnel, NO traffic protection;
 *  - the flag is persisted in userData/demo-mode.json and shown in Settings;
 *  - exiting demo mode requires an explicit user action.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE_NAME = 'demo-mode.json';

let enabled = false;
let storageDir: string | null = null;

export function isDemoMode(): boolean {
  return enabled;
}

/** Call once from the main process with app.getPath('userData'). */
export function loadDemoMode(userDataDir: string): void {
  try {
    storageDir = userDataDir;
    const raw = fs.readFileSync(path.join(userDataDir, FILE_NAME), 'utf8');
    enabled = JSON.parse(raw).enabled === true;
  } catch {
    enabled = false;
  }
}

export function setDemoMode(value: boolean): void {
  enabled = value;
  if (!storageDir) return;
  try {
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(
      path.join(storageDir, FILE_NAME),
      JSON.stringify({ enabled: value }),
      'utf8',
    );
  } catch {
    // Persistence is best-effort; the in-memory flag still governs behavior.
  }
}
