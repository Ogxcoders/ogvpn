import { useEffect, useState } from 'react';
import { aegis, type SettingsMap } from '../lib/bridge';

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

  if (!settings) return <div className="skeleton" style={{ height: 220 }} />;

  return (
    <div>
      {demo ? (
        <div className="card" role="status" style={{ borderColor: 'var(--primary)' }}>
          <h2>Mode: DEMO (offline)</h2>
          <p className="muted">
            The UI runs against in-memory sample data. The VPN tunnel is
            <strong> simulated</strong> — no traffic is routed or protected.
            Exit demo mode to sign in to a real control plane.
          </p>
          <button className="btn btn-primary" type="button" onClick={() => void exitDemo()}>
            Exit demo mode
          </button>
        </div>
      ) : null}
      <div className="card">
        <h2>VPN behavior</h2>
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
          hint="Closing the window keeps the app and the VPN running in the tray."
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
        />
      </div>

      <div className="card">
        <h2>Connection</h2>
        <div className="field">
          <label htmlFor="api-base">Backend API base URL</label>
          <input
            id="api-base"
            className="input"
            value={settings.apiBaseUrl}
            onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
            onBlur={(e) => void set('apiBaseUrl', e.target.value)}
          />
        </div>
        <p className="muted">Protocol: WireGuard (official platform implementations — wireguard-nt on Windows, wg-quick on macOS/Linux).</p>
      </div>

      <div className="card">
        <h2>Updates</h2>
        <p className="muted">Auto-update is disabled in this build (manual). See desktop/README.md for enabling electron-updater with a feed.</p>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, disabled, onChange }: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}): React.ReactElement {
  return (
    <div className="row spread" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div>{label}</div>
        <div className="muted" style={{ fontSize: 12.5 }}>{hint}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="btn"
        style={{ width: 64, justifyContent: 'center', background: checked ? 'var(--primary)' : 'var(--surface-2)', color: checked ? '#04222b' : 'var(--text)' }}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        {checked ? 'On' : 'Off'}
      </button>
    </div>
  );
}
