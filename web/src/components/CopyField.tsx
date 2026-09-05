import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Read-only field with a copy button. Used for values like the WireGuard
 * server public key and the one-time agent token.
 */
export function CopyField({
  value,
  label,
  describedBy,
}: {
  value: string;
  label?: string;
  describedBy?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="stack" style={{ gap: 6 }}>
      {label ? (
        <label className="small muted" style={{ fontWeight: 600 }} htmlFor={`copy-${label.replace(/\s+/g, '-').toLowerCase()}`}>
          {label}
        </label>
      ) : null}
      <div className="copy-field">
        <input
          id={label ? `copy-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined}
          className="input"
          type="text"
          readOnly
          value={value}
          aria-describedby={describedBy}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button type="button" className="copy-btn" onClick={() => void onCopy()} aria-label={`Copy ${label ?? 'value'}`}>
          <Icon name={copied ? 'check' : 'copy'} size={15} />
          <span aria-live="polite">{copied ? 'Copied' : ''}</span>
        </button>
      </div>
    </div>
  );
}
