import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { SettingsMap } from '../../../../shared/ipc';

/** Settings persisted to userData/settings.json (non-sensitive only). */
export class SettingsStore {
  private file: string;

  constructor(private defaults: SettingsMap) {
    this.file = path.join(app.getPath('userData'), 'settings.json');
  }

  async load(): Promise<Partial<SettingsMap>> {
    try {
      if (!fs.existsSync(this.file)) return {};
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<SettingsMap>;
      // Only accept known keys to keep the file shape stable.
      const out: Partial<SettingsMap> = {};
      for (const k of Object.keys(this.defaults) as (keyof SettingsMap)[]) {
        if (parsed[k] !== undefined) (out as Record<string, unknown>)[k] = parsed[k];
      }
      return out;
    } catch {
      return {};
    }
  }

  async save(map: SettingsMap): Promise<void> {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(map, null, 2), { mode: 0o600 });
    } catch {
      // settings stay in-memory if disk write fails
    }
  }
}
