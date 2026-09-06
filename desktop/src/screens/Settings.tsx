import { useEffect, useState } from 'react';
import { aegis, type SettingsMap } from '../lib/bridge';
import { GearIcon, ShieldIcon } from '../lib/icons';

export function Settings(): React.ReactElement {
  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [saving, setSaving] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    void aegis().getAllSettings().then(setSettings);
    void aegis().demoStatus().then(setDemo);
  }, []);

  const exitDemo = async (): Promise<void> => {
    await aegis().demoDisable();
    setDemo(false);
    // Full reload re-resolves auth: the demo session is cleared, the app
    // returns to the real login screen.
    window.location.reload();
  };

  const set = async (key: keyof SettingsMap, value: boolean | string): Promise<void> => {
    setSaving(true);
    try {
      setSettings(await aegis().setSetting(key, value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      <p className="page-sub">Protection first; everything else is secondary.</p>

      {demo ? (
        <div className="demo-banner" role="status">
          <span className="demo-chip">DEMO</span>
          <span className="grow">
            Offline sample data. The VPN tunnel is <strong>simulated</strong> — no traffic is routed or protected.
          </span>
          <button className="btn" onClick={() => void exitDemo()}>Exit demo mode</button>
        </div>
      ) : null}

      <div className="section-label">VPN behavior</div>
      <div className="card">
        {!settings ? (
          <div className="list-gap" aria-label="Loading settings">
            <div className="skeleton" style={{ height: 40 }} />
            <div className="skeleton" style={{ height: 40 }} />
            <div className="skeleton" style={{ height: 40 }} />
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        ) : (
          <>
            <Toggle
              label="Kill switch"
              hint="Blocks all non-VPN traffic while enforced (requires elevation; OS-dependent — see README)."
              checked={settings.killSwitch}
              disabled={saving}
              onChange={(v) => void set('killSwitch', v)}
            />
            <Toggle
              label="Connect on launch"
              hint="Connects to the least-loaded active server when the app starts."
              checked={settings.autoConnect}
              disabled={saving}
              onChange={(v) => void set('autoConnect', v)}
            />
            <Toggle
              label="Close to tray"
              hint="Closing the window keeps the app and the VPN session alive in the system tray; quit from the tray menu."
              checked={settings.closeToTray}
              disabled={saving}
              onChange={(v) => void set('closeToTray', v)}
            />
            <Toggle
              label="Launch at system start"
              hint="Registers the app as a login item."
              checked={settings.autoLaunch}
              disabled={saving}
              onChange={(v) => void set('autoLaunch', v)}
              last
            />
          </>
        )}
      </div>

      <div className="section-label">Connection</div>
      <div className="card">
        <div className="field">
          <label htmlFor="api-base">Backend API base URL</label>
          <input
            id="api-base"
            className="input"
            value={settings?.apiBaseUrl ?? ''}
            onChange={(e) => settings && setSettings({ ...settings, apiBaseUrl: e.target.value })}
            onBlur={(e) => void set('apiBaseUrl', e.target.value)}
          />
        </div>
        <p className="muted">
          Protocol: WireGuard (official platform implementations — wireguard-nt on Windows, wg-quick on macOS/Linux).
        </p>
      </div>

      <div className="section-label">About</div>
      <div className="card">
        <div className="row">
          <ShieldIcon size={16} className="muted" />
          <span className="muted">Auto-update is disabled in this build (manual). See desktop/README.md for enabling electron-updater with a feed.</span>
        </div>
        <div className="row mt-8">
          <GearIcon size={16} className="muted" />
          <span className="muted">Shortcuts: <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>1–5</kbd> switches sections.</span>
        </div>
      </div>
    </div>
  );
}

/** Real switch control (role=switch) with 48px hit area. */
function Toggle({ label, hint, checked, disabled, onChange, last }: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}): React.ReactElement {
  return (
    <div className="row spread" style={{ padding: '12px 0', borderBottom: last ? 'none' : '1px solid var(--border-soft)' }}>
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div className="muted" style={{ fontSize: 12.5 }}>{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </div>
  );
}
