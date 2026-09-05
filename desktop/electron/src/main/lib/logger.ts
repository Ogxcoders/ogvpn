/**
 * Redacting logger. Private keys (44-char WireGuard base64), JWTs and generic
 * long base64 secrets are scrubbed before anything reaches the console.
 */

const WG_KEY_RE = /[A-Za-z0-9+/]{43}=/g;
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

export function redactSecrets(input: string): string {
  return input.replace(WG_KEY_RE, '[REDACTED-KEY]').replace(JWT_RE, '[REDACTED-JWT]');
}

function redactArg(arg: unknown): string {
  if (typeof arg === 'string') {
    return redactSecrets(arg);
  }
  try {
    return redactSecrets(JSON.stringify(arg) ?? String(arg));
  } catch {
    return String(arg);
  }
}

function emit(level: 'info' | 'warn' | 'error' | 'debug', parts: unknown[]): void {
  const text = parts.map(redactArg).join(' ');
  const line = `[aegisvpn] ${text}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else if (level === 'debug') {
    console.debug(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (...parts: unknown[]) => emit('info', parts),
  warn: (...parts: unknown[]) => emit('warn', parts),
  error: (...parts: unknown[]) => emit('error', parts),
  debug: (...parts: unknown[]) => emit('debug', parts)
};
