import { safeStorage, app } from 'electron';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import type { CredentialKey } from '@dash/shared';

function credentialsPath(): string {
  return path.join(app.getPath('userData'), 'credentials.json');
}

export function readCredentials(): Partial<Record<CredentialKey, string>> {
  const file = credentialsPath();
  if (!existsSync(file)) return {};

  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
    const result: Partial<Record<CredentialKey, string>> = {};

    for (const [key, val] of Object.entries(raw)) {
      if (typeof val !== 'string') continue;
      try {
        result[key as CredentialKey] = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(Buffer.from(val, 'base64'))
          : val; // fallback: plaintext (safeStorage unavailable on some Linux setups)
      } catch {
        // corrupted entry — skip silently
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function writeCredentials(creds: Partial<Record<CredentialKey, string>>): void {
  const dir = path.dirname(credentialsPath());
  mkdirSync(dir, { recursive: true });

  const stored: Record<string, string> = {};
  for (const [key, val] of Object.entries(creds)) {
    if (!val) continue;
    stored[key] = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(val).toString('base64')
      : val;
  }
  writeFileSync(credentialsPath(), JSON.stringify(stored, null, 2), 'utf8');
}
