export function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }} role="status">
      <svg
        className="spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" opacity="0.25" />
        <path d="M21 12a9 9 0 00-9-9" />
      </svg>
      <span className="sr-only">{label ?? 'Loading'}</span>
    </span>
  );
}
