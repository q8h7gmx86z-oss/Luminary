// Encrypted backups. Pure, so it runs in Node tests as well as the app.
// AES-256-GCM with a key from PBKDF2-SHA256. Nothing leaves the device unless the person moves the file.
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToUtf8, utf8ToBytes } from '@noble/ciphers/utils.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

export const BACKUP_PREFIX = 'LUMINARY-BACKUP-1:';
/** PBKDF2 rounds. Stored in each backup so it can be raised later without breaking old files. */
export const DEFAULT_ROUNDS = 310_000;
export const MIN_PASSPHRASE = 8;

type Envelope = { v: 1; kdf: 'pbkdf2-sha256'; c: number; salt: string; iv: string; ct: string };

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b = 0, c = 0] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    const n = (a << 16) | (b << 8) | c;
    out +=
      B64[(n >> 18) & 63] +
      B64[(n >> 12) & 63] +
      (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? B64[n & 63] : '=');
  }
  return out;
}

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n = [0, 1, 2, 3].map((k) => (i + k < clean.length ? B64.indexOf(clean[i + k]) : 0));
    const v = (n[0] << 18) | (n[1] << 12) | (n[2] << 6) | n[3];
    out.push((v >> 16) & 255);
    if (i + 2 < clean.length) out.push((v >> 8) & 255);
    if (i + 3 < clean.length) out.push(v & 255);
  }
  return new Uint8Array(out);
}

export async function encryptBackup(
  plain: string,
  passphrase: string,
  randomBytes: (n: number) => Uint8Array,
  rounds = DEFAULT_ROUNDS,
): Promise<string> {
  if (passphrase.length < MIN_PASSPHRASE) throw new Error(`Use a passphrase of at least ${MIN_PASSPHRASE} characters.`);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await pbkdf2Async(sha256, utf8ToBytes(passphrase), salt, { c: rounds, dkLen: 32 });
  const ct = gcm(key, iv).encrypt(utf8ToBytes(plain));
  const env: Envelope = { v: 1, kdf: 'pbkdf2-sha256', c: rounds, salt: toBase64(salt), iv: toBase64(iv), ct: toBase64(ct) };
  return BACKUP_PREFIX + toBase64(utf8ToBytes(JSON.stringify(env)));
}

export class BackupError extends Error {}

export async function decryptBackup(text: string, passphrase: string): Promise<string> {
  const at = text.indexOf(BACKUP_PREFIX);
  if (at < 0) throw new BackupError('This does not look like a Luminary backup. Check you copied all of it.');
  let env: Envelope;
  try {
    env = JSON.parse(bytesToUtf8(fromBase64(text.slice(at + BACKUP_PREFIX.length).trim())));
  } catch {
    throw new BackupError('This backup is incomplete or damaged. Check you copied all of it.');
  }
  if (env.v !== 1 || env.kdf !== 'pbkdf2-sha256')
    throw new BackupError('This backup was made by a newer version of Luminary. Update the app and try again.');
  const key = await pbkdf2Async(sha256, utf8ToBytes(passphrase), fromBase64(env.salt), { c: env.c, dkLen: 32 });
  try {
    return bytesToUtf8(gcm(key, fromBase64(env.iv)).decrypt(fromBase64(env.ct)));
  } catch {
    throw new BackupError('Wrong passphrase, or the backup has been changed.');
  }
}

/** Short summary of what a backup holds, shown before restoring over existing data. */
export function describeState(s: { training?: { results?: unknown[]; workouts?: unknown[] }; moods?: object; sleeps?: object }) {
  return {
    rounds: s.training?.results?.length ?? 0,
    workouts: s.training?.workouts?.length ?? 0,
    checkIns: Object.keys(s.moods ?? {}).length + Object.keys(s.sleeps ?? {}).length,
  };
}
