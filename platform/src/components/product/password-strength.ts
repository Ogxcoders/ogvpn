"use client";

// Live password validation (E 94 / S 442): instant feedback, no submission surprises.
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  messages: string[];
}

export function validatePasswordStrength(pw: string): PasswordStrength {
  const messages: string[] = [];
  let score = 0;
  if (pw.length < 10) messages.push("Use at least 10 characters");
  else score += 1;
  if (!/[a-z]/.test(pw)) messages.push("Add a lowercase letter");
  else score += 1;
  if (!/[A-Z]/.test(pw)) messages.push("Add an uppercase letter");
  else score += 1;
  if (!/\d/.test(pw)) messages.push("Add a digit");
  else score += 1;
  if (pw.length >= 14 || (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10)) score += 1;
  if (messages.length === 0 && pw.length >= 10) messages.push("");
  return { score: Math.min(5, score) as PasswordStrength["score"], messages: messages.length ? messages : [""] };
}
