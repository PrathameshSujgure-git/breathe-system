# Breathe System

A minimal nervous system reset tool. 4-2-6 breathing pattern with a shader blob background.

**[breathe-system.vercel.app](https://breathe-system.vercel.app)**

## What

3-minute guided breathing exercise based on vagal tone activation. Longer exhale tells your body the danger has passed.

- **Inhale** 4s — **Hold** 2s — **Exhale** 6s
- 10 rounds
- Optional soothing frequencies (Web Audio API — 174Hz to 285Hz solfeggio range)
- 6 visual themes + plain mode
- Light / dark mode
- Fullscreen support

## Stack

- Vite
- Three.js + custom GLSL shaders ([shader-blob](https://github.com/Valentin667/shader-blob))
- Web Audio API (no audio files — pure oscillators)
- Zero frameworks

## Run locally

```
npm install
npm run dev
```

## Credits

Shader blob adapted from [Valentin667/shader-blob](https://github.com/Valentin667/shader-blob)
