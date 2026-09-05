import { useEffect, useState } from 'react';
import { aegis, type DeviceSummary } from '../lib/bridge';

export function Devices(): React.ReactElement {
  const [devices, setDevices] = useState<DeviceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<DeviceSummary | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [revoking, setRevoking] = useState<DeviceSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const load = (): void => {
    setError(null);
    void aegis()
      .listDevices()
      .then(setDevices)
      .catch((e) => setError((e as Error).message));
  };

  useEffect(load, []);

  const doRename = async (): Promise<void> => {
    if (!renaming) return;
    setBusy(true);
    try {
      await aegis().renameDevice(renaming.id, renameValue.trim());
      setRenaming(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doRevoke = async (): Promise<void> => {
    if (!revoking) return;
    setBusy(true);
    try {
      await aegis().revokeDevice(revoking.id);
      setRevoking(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !devices) {
    return (
      <div className="error-state">
        <h3>Could not load devices</h3>
        <p>{error}</p>
        <button className="btn" onClick={load}>Retry</button>
      </div>
    );
  }
  if (!devices) return <div className="skeleton" style={{ height: 180 }} />;

  return (
    <div className="card">
      <h2>Your devices</h2>
      {error ? <div className="banner" role="alert">{error}</div> : null}
      {devices.length === 0 ? (
        <div className="empty">No devices registered yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Platform</th>
              <th>Session</th>
              <th>Transfer</th>
              <th>Last active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td>{d.platform}</td>
                <td>
                  {d.session ? (
                    <span className={`badge ${d.session.state === 'connected' ? 'success' : 'warn'}`}>
                      <span className="dot" />
                      {d.session.state}
                    </span>
                  ) : (
                    <span className="muted">offline</span>
                  )}
                </td>
                <td>
                  {d.session ? (
                    d.session.connectedAt ? new Date(d.session.connectedAt).toLocaleTimeString() : '—'
                  ) : '—'}
                </td>
                <td className="muted">{d.lastActiveAt ? new Date(d.lastActiveAt).toLocaleString() : '—'}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-sm" onClick={() => { setRenaming(d); setRenameValue(d.name); }}>Rename</button>{' '}
                  <button className="btn btn-danger btn-sm" onClick={() => setRevoking(d)}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {renaming ? (
        <Modal title={`Rename "${renaming.name}"`} onClose={() => setRenaming(null)}>
          <div className="field">
            <label htmlFor="rename-input">Device name</label>
            <input id="rename-input" className="input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setRenaming(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={busy || !renameValue.trim()} onClick={() => void doRename()}>Save</button>
          </div>
        </Modal>
      ) : null}

      {revoking ? (
        <Modal title={`Revoke "${revoking.name}"?`} onClose={() => setRevoking(null)}>
          <p>The device will be disconnected immediately, its VPN peer removed and its sessions closed. This cannot be undone.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setRevoking(null)}>Cancel</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => void doRevoke()}>Revoke device</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }): React.ReactElement {
  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={onClose}>
      <div className="card" style={{ minWidth: 340, maxWidth: 440, margin: 0 }} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
