/*
 * Inline SVG icon set — consistent 24px optical grid, 2px stroke, round caps.
 * Icons never carry meaning alone: they always sit beside a text label or an
 * aria-label. Mirrors the Android glyph usage.
 */

interface IconProps {
  size?: number;
  className?: string;
}

function base(size?: number): { width: number; height: number; viewBox: string; fill: string; stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round' } {
  const s = size ?? 24;
  return {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
}

/** Brand shield with check. */
export function ShieldIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function HomeIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M4 11l8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  );
}

export function GlobeIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.1-3.9-8.5s1.3-6.2 3.9-8.5z" />
    </svg>
  );
}

export function DevicesIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <rect x="3" y="5" width="13" height="10" rx="1.5" />
      <path d="M7 19h6" />
      <rect x="17" y="10" width="4" height="9" rx="1.2" />
    </svg>
  );
}

export function GearIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
    </svg>
  );
}

export function PulseIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />
    </svg>
  );
}

export function PowerIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M12 3v8" />
      <path d="M6.3 6.3a8 8 0 1 0 11.4 0" />
    </svg>
  );
}

export function CheckCircleIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </svg>
  );
}

export function AlertIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M12 4L2.8 19.5h18.4L12 4z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function SearchIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

export function StarIcon({ size, className, filled }: IconProps & { filled?: boolean }): React.ReactElement {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M12 3.6l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8L12 3.6z" />
    </svg>
  );
}

export function LogoutIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M14 4h4.5v16H14" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h9" />
    </svg>
  );
}

export function TrashIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 13h9l1-13" />
    </svg>
  );
}

export function EditIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function RefreshIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 3v4h-4" />
    </svg>
  );
}

export function CloudOffIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M6 15a4 4 0 0 1 .6-7.9M9 5.3A6.5 6.5 0 0 1 19 9.5 4.2 4.2 0 0 1 18.5 15H7.5A3.5 3.5 0 0 1 6 15z" />
    </svg>
  );
}

/** Star glyph used inside the loading skeleton avatar block. */
export function DotIcon({ size, className }: IconProps): React.ReactElement {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}
