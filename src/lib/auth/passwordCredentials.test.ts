/** @jest-environment node */

import { createPasswordCredentials, verifyPasswordCredentials } from './passwordCredentials';

const legacyCredentials = {
  salt: '00112233445566778899aabbccddeeff',
  password_hash:
    '9896ef844dbd4aa7695588ee824e2940816c6325db9945b4a3c36b11560898bd3a183af2fd5c9f1284aaa40c0e8ee70d62c3916aba5e7a57cce135e0f997108e',
};

it('verifies the existing PBKDF2 format and rejects incorrect passwords', () => {
  expect(verifyPasswordCredentials('LegacyPassw0rd!', legacyCredentials)).toBe(true);
  expect(verifyPasswordCredentials('WrongPassw0rd!', legacyCredentials)).toBe(false);
  expect(
    verifyPasswordCredentials('LegacyPassw0rd!', { ...legacyCredentials, password_hash: '' })
  ).toBe(false);
});

it('generates a fresh 16-byte hex salt and a compatible hash for each password', () => {
  const first = createPasswordCredentials('NewPassw0rd!');
  const second = createPasswordCredentials('NewPassw0rd!');
  expect(first.salt).toMatch(/^[0-9a-f]{32}$/);
  expect(first.password_hash).toMatch(/^[0-9a-f]{128}$/);
  expect(second.salt).not.toBe(first.salt);
  expect(second.password_hash).not.toBe(first.password_hash);
  expect(verifyPasswordCredentials('NewPassw0rd!', first)).toBe(true);
  expect(verifyPasswordCredentials('NewPassw0rd!', second)).toBe(true);
});
