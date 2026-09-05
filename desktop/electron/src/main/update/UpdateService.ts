import { app } from 'electron';

/**
 * Update service — honest interface.
 *
 * INTENT (documented in desktop/README.md): ship updates via electron-updater
 * with a generic (self-hosted static) provider. This build deliberately does
 * NOT bundle the electron-updater runtime, because enabling it without a
 * configured update feed would silently check a nonexistent endpoint and
 * confuse local builds. Wire it in three steps when a feed exists:
 *
 *   1. npm i electron-updater
 *   2. add publish config to electron-builder.yml (provider: generic, url)
 *   3. call `autoUpdater.checkForUpdatesAndNotify()` on an interval here
 *      and surface `update-downloaded` through the AppEvent notice channel.
 *
 * The current implementation reports "manual" updates honestly instead of
 * pretending to be a working updater.
 */
export interface UpdateStatus {
  mechanism: 'disabled-manual';
  currentVersion: string;
  instructions: string;
}

export class UpdateService {
  getStatus(): UpdateStatus {
    return {
      mechanism: 'disabled-manual',
      currentVersion: app.getVersion(),
      instructions:
        'Updates are manual in this build. To enable auto-update, add electron-updater ' +
        'and a publish feed — see desktop/README.md ("Auto-update") for exact steps.',
    };
  }
}
