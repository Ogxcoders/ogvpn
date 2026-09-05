/*
 * Client-side validation mirroring the backend exactly
 * (backend/src/lib/passwords.ts passwordPolicyErrors + zod email rule),
 * so users get instant feedback before a request is even sent.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Must match backend passwordPolicyErrors: ≥10 chars, ≥1 letter, ≥1 digit. */
export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10) errors.push('at least 10 characters');
  if (!/[a-zA-Z]/.test(password)) errors.push('at least one letter');
  if (!/[0-9]/.test(password)) errors.push('at least one digit');
  return errors;
}

export function emailError(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (email.length > 254) return 'Email is too long';
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address';
  return null;
}
