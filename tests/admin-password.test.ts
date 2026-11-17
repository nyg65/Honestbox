import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.HB_DB_PATH = join(mkdtempSync(join(tmpdir(), 'hb-admin-')), 'a.db');
process.env.HB_ADMIN_PASSWORD = 'first-password-123';
const { db, ensureAdmin } = await import('../lib/db.ts');
const { checkCredentials, issueToken, userByToken } = await import('../lib/accounts.ts');

test('changing HB_ADMIN_PASSWORD resets the admin password and signs admin out', () => {
  const admin = checkCredentials('admin@honestbox.test', 'first-password-123');
  const { token } = issueToken(admin);
  assert.ok(userByToken(token));
  process.env.HB_ADMIN_PASSWORD = 'second-password-456';
  ensureAdmin(db());
  assert.throws(() => checkCredentials('admin@honestbox.test', 'first-password-123'), /do not match/, 'old password no longer works');
  assert.ok(checkCredentials('admin@honestbox.test', 'second-password-456'), 'new password works');
  assert.equal(userByToken(token), null, 'existing admin sessions are signed out');
  ensureAdmin(db());
  assert.ok(checkCredentials('admin@honestbox.test', 'second-password-456'), 'unchanged setting leaves it alone');
});

test('a too-short setting never replaces the password', () => {
  process.env.HB_ADMIN_PASSWORD = 'short';
  ensureAdmin(db());
  assert.ok(checkCredentials('admin@honestbox.test', 'second-password-456'));
});
