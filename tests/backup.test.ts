import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';

import { BACKUP_PREFIX, decryptBackup, encryptBackup, fromBase64, toBase64 } from '../src/lib/backup.ts';

const rnd = (n: number) => new Uint8Array(randomBytes(n));

test('base64 round trip at every padding length', () => {
  for (const len of [0, 1, 2, 3, 4, 5, 31, 100]) {
    const b = rnd(len);
    assert.deepEqual(fromBase64(toBase64(b)), b);
    assert.equal(toBase64(b), Buffer.from(b).toString('base64'));
  }
});

test('backup encrypts, restores, and rejects the wrong passphrase', async () => {
  const plain = JSON.stringify({ training: { results: [{ game: 'speed', score: 120 }] }, note: 'émoji 🧠' });
  const enc = await encryptBackup(plain, 'correct horse', rnd, 1000);
  assert.ok(enc.startsWith(BACKUP_PREFIX));
  assert.ok(!enc.includes('speed'));
  assert.equal(await decryptBackup(enc, 'correct horse'), plain);
  // Surrounding whitespace and text from a pasted message are fine.
  assert.equal(await decryptBackup(`Here it is:\n${enc}\n`, 'correct horse'), plain);
  await assert.rejects(decryptBackup(enc, 'wrong horse'), /Wrong passphrase/);
  await assert.rejects(decryptBackup('hello', 'correct horse'), /does not look like/);
  await assert.rejects(encryptBackup(plain, 'short', rnd), /at least 8/);
  // Two backups of the same data differ, because salt and nonce are random.
  assert.notEqual(await encryptBackup(plain, 'correct horse', rnd, 1000), enc);
});
