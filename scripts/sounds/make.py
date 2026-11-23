"""Synthesises Luminary's sound effects from scratch, so they are original and free to use.
Run: python3 scripts/sounds/make.py  (needs numpy). Writes assets/sounds/*.wav."""
import wave
import numpy as np

SR = 22050

def bell(freq, dur, amp=1.0):
    """A soft bell: sine plus a quiet octave, quick attack, smooth exponential decay."""
    t = np.arange(int(SR * dur)) / SR
    tone = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * freq * 2 * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 7 / dur)
    return amp * tone * env

def place(buf, sig, at):
    i = int(SR * at)
    buf[i:i + len(sig)] += sig[: len(buf) - i]

def pad(freq_from, freq_to, dur, amp=1.0):
    """A breathy swell for breathing cues: slow fade in and out, gentle pitch glide."""
    t = np.arange(int(SR * dur)) / SR
    f = np.linspace(freq_from, freq_to, len(t))
    phase = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(phase) + 0.12 * np.sin(2 * phase)
    env = np.sin(np.pi * t / dur) ** 2
    return amp * tone * env

def save(name, sig, peak):
    sig = sig / max(1e-9, np.max(np.abs(sig))) * peak
    fade = min(len(sig), int(SR * 0.02))
    sig[-fade:] *= np.linspace(1, 0, fade)
    data = (sig * 32767).astype('<i2').tobytes()
    with wave.open(f'assets/sounds/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)

# Right answer: two soft rising notes (E5, B5).
b = np.zeros(int(SR * 0.42)); place(b, bell(659.3, 0.3), 0); place(b, bell(987.8, 0.32, 0.8), 0.07)
save('right', b, 0.35)

# Wrong answer: one low, muted note (A3). Informative, never harsh.
t = np.arange(int(SR * 0.26)) / SR
w = np.sin(2 * np.pi * 220 * t) * np.minimum(1, t / 0.01) * np.exp(-t * 14)
save('wrong', w, 0.3)

# Round complete: a slow C major arpeggio.
c = np.zeros(int(SR * 1.3))
for i, f in enumerate([523.3, 659.3, 784.0, 1046.5]):
    place(c, bell(f, 0.7, 1 - i * 0.12), i * 0.12)
save('complete', c, 0.35)

# Breathing cues: a rising swell to breathe in, a falling one to breathe out.
save('breathe-in', pad(262, 330, 1.6), 0.22)
save('breathe-out', pad(330, 262, 1.6), 0.22)
