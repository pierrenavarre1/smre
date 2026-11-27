import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const COOKIE_NAME = 'smre_fub_contact';

function encryptionKey() {
  const secret = process.env.FUB_API_KEY;
  const systemKey = process.env.FUB_SYSTEM_KEY;
  if (!secret || !systemKey) throw new Error('FUB credentials are not configured');
  return createHash('sha256').update(`${secret}:${systemKey}:smre-fub-identity-v1`).digest();
}

export function encryptFubPersonId(personId: number | string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(personId), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function decryptFubPersonId(value?: string | null): number | null {
  if (!value) return null;
  try {
    const data = Buffer.from(value, 'base64url');
    if (data.length < 29) return null;
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const id = Number(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export const FUB_IDENTITY_COOKIE = COOKIE_NAME;
