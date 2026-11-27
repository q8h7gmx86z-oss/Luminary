# Emma, Aura's voice

The on-device voice engine from Sandra's Health & Social Care app, copied unchanged so Aura sounds
the same in every app: Kokoro TTS with the bf_emma voice, espeak-ng phonemes and ONNX Runtime Web
(processor and WebGPU builds). The model weights are split into 14 MB parts (`model/`), and the
engine resolves every file relative to `aura-voice2.mjs`, so keep this folder together.

Used by `src/aura/emma.web.ts`. Downloaded once by the browser (about 115 MB), then cached.
