import { safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

/**
 * Encrypted-at-rest token storage for the desktop client.
 *
 * Tokens live ONLY in the main process (the renderer never sees them):
 * access/refresh tokens are encrypted with Chromium's safeStorage (OS
 * keychain-backed where available: DPAPI on Windows, Keychain on macOS,
 * libsecret on Linux) and persisted to a single file in userData.
 *
 * When safeStorage is unavailable (rare Linux setups without a secret
 * service) we fall back to plaintext with a hard-coded warning marker so
 * users can detect it, and document the risk. Private WireGuard keys are
 * NEVER persisted here — they are regenerated per tunnel lifetime in
 * memory only (see VpnController).
 */
interface PersistedTokens {
  version: 1;
  encrypted: boolean;
  accessToken: string;
  refreshToken: string;
}

const STORE_FILE = 'tokens.bin';

export class TokenStore {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(private dir: string = app.getPath('userData')) {}

  private get file(): string {
    return path.join(this.dir, STORE_FILE);
  }

  get fallbackPlaintext(): boolean {
    return !safeStorage.isEncryptionAvailable();
  }

  load(): void {
    try {
      if (!fs.existsSync(this.file)) return;
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8')) as PersistedTokens;
      if (parsed.version !== 1) return;
      if (parsed.encrypted) {
        this.accessToken = safeStorage.decryptString(Buffer.from(parsed.accessToken, 'base64'));
        this.refreshToken = safeStorage.decryptString(Buffer.from(parsed.refreshToken, 'base64'));
      } else {
        this.accessToken = parsed.accessToken;
        this.refreshToken = parsed.refreshToken;
      }
    } catch {
      // Corrupt store: start clean rather than crash the app.
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  save(tokens: { accessToken: string; refreshToken: string }): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      const encrypted = !this.fallbackPlaintext;
      const payload: PersistedTokens = encrypted
        ? {
            version: 1,
            encrypted: true,
            accessToken: safeStorage.encryptString(tokens.accessToken).toString('base64'),
            refreshToken: safeStorage.encryptString(tokens.refreshToken).toString('base64'),
          }
        : {
            version: 1,
            encrypted: false,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          };
      fs.writeFileSync(this.file, JSON.stringify(payload), { mode: 0o600 });
    } catch {
      // In-memory tokens still work for this session.
    }
  }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      if (fs.existsSync(this.file)) fs.rmSync(this.file);
    } catch {
      // best effort
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}
