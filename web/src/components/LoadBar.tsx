export function LoadBar({ pct }: { pct: number | null }) {
  if (pct === null || !Number.isFinite(pct)) {
    return (
      <div className="stack" style={{ gap: 4 }}>
        <div className="loadbar" aria-hidden="true">
          <span style={{ width: 0 }} />
        </div>
        <span className="small muted">No load data</span>
      </div>
    );
  }
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const level = clamped < 60 ? 'low' : clamped < 85 ? 'medium' : 'high';
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div
        className="loadbar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={`Server load ${clamped}%`}
      >
        <span data-level={level} style={{ width: `${clamped}%` }} />
      </div>
      <span className="small muted">{clamped}% load</span>
    </div>
  );
}
