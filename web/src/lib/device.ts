/*
 * Web device identity helpers.
 * The backend login/register schema requires a UUID `deviceUid`; the SPA
 * persists one in localStorage so repeat sign-ins map to the same device row.
 */

const DEVICE_UID_KEY = 'aegis.deviceUid';

function uuidFallback(): string {
  // RFC 4122 v4-shaped UUID without depending on crypto.randomUUID support.
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[8 + ((Math.random() * 4) | 0)];
    else out += hex[(Math.random() * 16) | 0];
  }
  return out;
}

export function deviceUid(): string {
  try {
    const existing = localStorage.getItem(DEVICE_UID_KEY);
    if (existing) return existing;
    const uid =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : uuidFallback();
    localStorage.setItem(DEVICE_UID_KEY, uid);
    return uid;
  } catch {
    return uuidFallback();
  }
}

/** Human-friendly device name derived from the browser, e.g. "Web · Chrome". */
export function webDeviceName(): string {
  try {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua)
      ? 'Edge'
      : /OPR\//.test(ua)
        ? 'Opera'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Web';
    return `Web · ${browser}`;
  } catch {
    return 'Web';
  }
}
