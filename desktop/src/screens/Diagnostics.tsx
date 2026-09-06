import { useEffect, useState } from 'react';
import { aegis } from '../lib/bridge';

interface DiagnosticsReport {
  appVersion: string;
  platform: string;
  apiBaseUrl: string;
  state: string;
  wg: { available: boolean; interfaceName: string; dumpSanitized: string | null };
  killSwitchActive: boolean;
  recentErrors: { at: string; message: string }[];
}

export function Diagnostics(): React.ReactElement {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);

  useEffect(() => {
    void aegis().getDiagnostics().then(setReport);
  }, []);

  return (
    <div>
      <h1>Diagnostics</h1>
      <p className="page-sub">Honest runtime state — nothing here is decorative.</p>

      {!report ? (
        <div className="list-gap" aria-label="Loading diagnostics">
          <div className="skeleton" style={{ height: 180 }} />
          <div className="skeleton" style={{ height: 140 }} />
        </div>
      ) : (
        <>
          <div className="section-label">Application</div>
          <div className="card">
            <table className="table">
              <tbody>
                <tr><td style={{ width: 200 }} className="muted">Version</td><td>{report.appVersion}</td></tr>
                <tr><td className="muted">Platform</td><td>{report.platform}</td></tr>
                <tr><td className="muted">API base URL</td><td className="mono">{report.apiBaseUrl}</td></tr>
                <tr>
                  <td className="muted">VPN state</td>
                  <td>
                    <span className={`badge ${report.state === 'CONNECTED' ? 'success' : ''}`}>
                      <span className="dot" />
                      {report.state}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="muted">Kill switch</td>
                  <td>
                    <span className={`badge ${report.killSwitchActive ? 'success' : ''}`}>
                      <span className="dot" />
                      {report.killSwitchActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="section-label">WireGuard</div>
          <div className="card">
            <p>
              Tooling {report.wg.available ? (
                <span className="badge success"><span className="dot" />detected</span>
              ) : (
                <span className="badge danger"><span className="dot" />NOT detected</span>
              )}{' '}· interface <span className="mono">{report.wg.interfaceName}</span>
            </p>
            {!report.wg.available ? (
              <p className="muted">
                Install WireGuard to enable tunneling: Windows — wireguard.exe from wireguard.com/install;
                macOS/Linux — wireguard-tools package. See desktop/README.md.
              </p>
            ) : null}
            {report.wg.dumpSanitized ? <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>{report.wg.dumpSanitized}</pre> : null}
          </div>

          <div className="section-label">Recent errors</div>
          <div className="card">
            {report.recentErrors.length === 0 ? (
              <p className="muted">None recorded.</p>
            ) : (
              <table className="table">
                <tbody>
                  {report.recentErrors.map((e, i) => (
                    <tr key={`${e.at}-${i}`}>
                      <td className="muted" style={{ width: 180 }}>{new Date(e.at).toLocaleString()}</td>
                      <td>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
