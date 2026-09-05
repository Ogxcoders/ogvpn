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

  if (!report) return <div className="skeleton" style={{ height: 220 }} />;

  return (
    <div>
      <div className="card">
        <h2>Application</h2>
        <table className="table">
          <tbody>
            <tr><td>Version</td><td>{report.appVersion}</td></tr>
            <tr><td>Platform</td><td>{report.platform}</td></tr>
            <tr><td>API base URL</td><td className="mono">{report.apiBaseUrl}</td></tr>
            <tr><td>VPN state</td><td>{report.state}</td></tr>
            <tr><td>Kill switch</td><td>{report.killSwitchActive ? 'active' : 'inactive'}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>WireGuard</h2>
        <p>
          Tooling {report.wg.available ? 'detected' : 'NOT detected'} · interface{' '}
          <span className="mono">{report.wg.interfaceName}</span>
        </p>
        {!report.wg.available ? (
          <p className="muted">
            Install WireGuard to enable tunneling: Windows — wireguard.exe from wireguard.com/install;
            macOS/Linux — wireguard-tools package. See desktop/README.md.
          </p>
        ) : null}
        {report.wg.dumpSanitized ? <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>{report.wg.dumpSanitized}</pre> : null}
      </div>

      <div className="card">
        <h2>Recent errors</h2>
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
    </div>
  );
}
