import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Share, Text, TextInput, View } from 'react-native';

import { Body, Button, Card, Field, Heading, Screen, Title } from '@/components/ui';
import { BackupError, decryptBackup, describeState, encryptBackup, MIN_PASSPHRASE } from '@/lib/backup';
import { dayKey } from '@/lib/logic';
import { State, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const random = (n: number) => Crypto.getRandomBytes(n);

function download(text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `luminary-backup-${dayKey()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pickFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      f.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

/** Encrypted backup, restore and moving to a new device. No account and no cloud. */
export default function Backup() {
  const t = useTheme();
  const { state, restoreAll } = useStore();
  const web = Platform.OS === 'web';

  // Make a backup
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [made, setMade] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [makeErr, setMakeErr] = useState('');
  const [copied, setCopied] = useState(false);

  // Restore
  const [text, setText] = useState('');
  const [rpass, setRpass] = useState('');
  const [pending, setPending] = useState<Partial<State> | null>(null);
  const [restoreErr, setRestoreErr] = useState('');
  const [restored, setRestored] = useState(false);

  const make = async () => {
    setMakeErr('');
    if (pass.length < MIN_PASSPHRASE)
      return setMakeErr(`Use at least ${MIN_PASSPHRASE} characters. A short sentence is easy to remember and hard to guess.`);
    if (pass !== pass2) return setMakeErr('The two passphrases do not match.');
    setBusy(true);
    try {
      setMade(await encryptBackup(JSON.stringify({ app: 'luminary', at: Date.now(), state }), pass, random));
      setPass('');
      setPass2('');
    } catch (e) {
      setMakeErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    setRestoreErr('');
    setBusy(true);
    try {
      const parsed = JSON.parse(await decryptBackup(text, rpass));
      if (parsed?.app !== 'luminary' || typeof parsed.state !== 'object') throw new BackupError('This backup could not be read.');
      setPending(parsed.state);
    } catch (e) {
      setRestoreErr(e instanceof BackupError ? e.message : 'This backup could not be read.');
    } finally {
      setBusy(false);
    }
  };

  const here = describeState(state);
  const incoming = pending ? describeState(pending) : null;

  return (
    <Screen>
      <Title>Backup and move</Title>
      <Body muted>
        Your data lives only on this device. A backup is a locked copy you keep yourself: in your files, your email to yourself or a
        password manager. Luminary never sees it, and without your passphrase nobody can open it, including us.
      </Body>

      <Card>
        <Heading>Make a backup</Heading>
        {made ? (
          <>
            <Body>
              Your backup is ready. Save it somewhere safe, and keep your passphrase separately. If you lose the passphrase, the backup
              cannot be opened.
            </Body>
            <TextInput
              value={made}
              editable={false}
              multiline
              selectTextOnFocus
              accessibilityLabel="Your encrypted backup"
              style={{
                color: t.muted,
                fontSize: 11,
                maxHeight: 110,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: 10,
                padding: 8,
                backgroundColor: t.bg,
              }}
            />
            {web ? (
              <Button label="Download backup file" onPress={() => download(made)} />
            ) : (
              <Button label="Save or send backup" onPress={() => Share.share({ message: made })} />
            )}
            <Button
              kind="secondary"
              label={copied ? 'Copied' : 'Copy backup'}
              onPress={async () => {
                await Clipboard.setStringAsync(made);
                setCopied(true);
              }}
            />
            <Button
              kind="secondary"
              label="Done"
              onPress={() => {
                setMade(null);
                setCopied(false);
              }}
            />
          </>
        ) : (
          <>
            <Body muted>
              Includes your training history, levels, check-ins, plans and settings: {here.rounds} rounds, {here.workouts} workouts,{' '}
              {here.checkIns} check-ins.
            </Body>
            <Field
              label="Choose a passphrase"
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <Field
              label="Type it again"
              value={pass2}
              onChangeText={setPass2}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            {makeErr ? <Text style={{ color: t.help, fontWeight: '700' }}>{makeErr}</Text> : null}
            <Button label={busy ? 'Locking your backup…' : 'Create encrypted backup'} onPress={make} disabled={busy} />
          </>
        )}
      </Card>

      <Card>
        <Heading>Restore or move to this device</Heading>
        {restored ? (
          <>
            <Body>Restored. Your history, levels and settings are back.</Body>
            <Button label="Go to Today" onPress={() => router.replace('/')} />
          </>
        ) : pending && incoming ? (
          <>
            <Body>
              This backup holds {incoming.rounds} rounds, {incoming.workouts} workouts and {incoming.checkIns} check-ins.
            </Body>
            <Body>
              Restoring replaces everything on this device ({here.rounds} rounds, {here.workouts} workouts, {here.checkIns} check-ins). That
              cannot be undone, so make a backup of this device first if you might want it.
            </Body>
            <Button
              kind="help"
              label="Yes, replace my data"
              onPress={() => {
                restoreAll(pending);
                setPending(null);
                setText('');
                setRpass('');
                setRestored(true);
              }}
            />
            <Button kind="secondary" label="Cancel" onPress={() => setPending(null)} />
          </>
        ) : (
          <>
            <Body muted>
              On your new phone or browser, paste the backup here{web ? ' or choose the file' : ''}, then enter its passphrase.
            </Body>
            {web ? (
              <Button
                kind="secondary"
                label="Choose backup file"
                onPress={async () => {
                  const f = await pickFile();
                  if (f) setText(f);
                }}
              />
            ) : null}
            <Field
              label="Backup"
              value={text}
              onChangeText={setText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <Field label="Passphrase" value={rpass} onChangeText={setRpass} secureTextEntry autoCapitalize="none" />
            {restoreErr ? <Text style={{ color: t.help, fontWeight: '700' }}>{restoreErr}</Text> : null}
            <Button label={busy ? 'Unlocking…' : 'Unlock backup'} onPress={unlock} disabled={busy || !text.trim() || !rpass} />
          </>
        )}
      </Card>

      <View style={{ gap: 6 }}>
        <Body muted>
          How it works: your passphrase is stretched with PBKDF2 (310,000 rounds of SHA-256) into a key, and the data is locked with
          AES-256-GCM, which also detects any tampering. All of this happens on your device.
        </Body>
      </View>
    </Screen>
  );
}
