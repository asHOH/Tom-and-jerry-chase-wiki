import 'server-only';

import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function createPasswordCredentials(password: string) {
  const salt = randomBytes(16).toString('hex');
  return { password_hash: hashPassword(password, salt), salt };
}

export function verifyPasswordCredentials(
  password: string,
  credentials: { password_hash: string; salt: string }
): boolean {
  const provided = Buffer.from(hashPassword(password, credentials.salt), 'utf16le');
  const stored = Buffer.from(credentials.password_hash, 'utf16le');
  return provided.length === stored.length && timingSafeEqual(provided, stored);
}
