import { useEffect, useRef, useState } from 'react';
import { aegis, type DeviceSummary } from '../lib/bridge';
import { AlertIcon, DevicesIcon, EditIcon, RefreshIcon, TrashIcon } from '../lib/icons';

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

  return (
    <div>
      <h1>Devices</h1>
      <p className="page-sub">Revoke anything you don't recognize — it disconnects immediately.</p>

      {error && !devices ? (
        <div className="error-panel" role="alert">
          <div className="title"><AlertIcon size={18} /> Could not load devices</div>
          <div>{error}</div>
          <div className="hint">Check your connection, then reload.</div>
          <button className="btn mt-12" onClick={load}><RefreshIcon size={15} /> Retry</button>
        </div>
      ) : (
        <div className="card">
          {error ? <div className="banner" role="alert">{error}</div> : null}
          {!devices ? (
            <div className="list-gap" aria-label="Loading devices">
              {[0, 1].map((i) => (
                <div className="skeleton-card" key={i} style={{ margin: 0 }}>
                  <div className="rowline">
                    <div className="skeleton" style={{ width: 44, height: 44 }} />
                    <div className="grow">
                      <div className="skeleton" style={{ width: 140, height: 14 }} />
                      <div className="skeleton mt-8" style={{ width: 200, height: 11 }} />
                    </div>
                    <div className="skeleton" style={{ width: 140, height: 30 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="empty">
              <h3>No devices yet</h3>
              <p>This device appears here automatically after your first connection.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Session</th>
                  <th>Last active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="row">
                        <div className="avatar" aria-hidden="true"><DevicesIcon size={18} /></div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{d.name}</div>
                          <div className="muted" style={{ fontSize: 12.5 }}>
                            {d.platform}{d.session?.connectedAt ? ` · connected ${new Date(d.session.connectedAt).toLocaleTimeString()}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {d.session ? (
                        <span className={`badge ${d.session.state === 'connected' ? 'success' : 'warn'}`}>
                          <span className="dot" />
                          {d.session.state}
                        </span>
                      ) : (
                        <span className="badge"><span className="dot" />offline</span>
                      )}
                    </td>
                    <td className="muted">{d.lastActiveAt ? new Date(d.lastActiveAt).toLocaleString() : '—'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn" onClick={() => { setRenaming(d); setRenameValue(d.name); }}>
                        <EditIcon size={14} /> Rename
                      </button>{' '}
                      <button className="btn btn-danger" onClick={() => setRevoking(d)}>
                        <TrashIcon size={14} /> Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {renaming ? (
        <Modal title={`Rename "${renaming.name}"`} onClose={() => setRenaming(null)}>
          <div className="field">
            <label htmlFor="rename-input">Device name</label>
            <input
              id="rename-input"
              className="input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
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

/**
 * Focus-trapped-ish modal: Escape closes, initial focus moves inside, the
 * overlay click closes without stranding scroll or focus.
 */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }): React.ReactElement {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    boxRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);
  return (
    <div
      className="modal-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}
      onClick={onClose}
    >
      <div
        ref={boxRef}
        className="card"
        style={{ minWidth: 340, maxWidth: 440, margin: 0, outline: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
