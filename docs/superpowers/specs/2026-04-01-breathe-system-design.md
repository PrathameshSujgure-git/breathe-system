# Breathe System -- Design Spec

## Context

A 3-minute nervous system reset app for when brain fog or tension starts. Based on vagal tone breathing: inhale 4s, hold 2s, exhale 6s. Longer exhale signals safety to the autonomic nervous system. The app needs to be dead simple -- open it, press start, follow the blob.

## Core Concept

Single HTML file with a WebGL shader blob that breathes with you. Minimal UI overlay. Light/dark mode. Fullscreen support.

## Breathing Protocol

| Phase   | Duration | Blob behavior            |
|---------|----------|--------------------------|
| Inhale  | 4s       | Expands, morph increases |
| Hold    | 2s       | Holds expanded, gentle morph |
| Exhale  | 6s       | Contracts, morph calms   |

- **Cycle:** 12s per round
- **Rounds:** 10 (total ~2 minutes)
- **Total session:** ~2 minutes

## Tech Stack

- Single self-contained HTML file
- Inline CSS, JS, GLSL
- WebGL for shader blob (no Three.js -- raw WebGL to keep it zero-dependency)
- System font stack

## Visual Design

### Shader Blob

Inspired by [HermanTk's glowing blob](https://codepen.io/HermanTk/pen/VweBgom) but implemented as a pure fragment shader (no Three.js dependency).

**Approach:** Full-screen quad fragment shader with:
- SDF circle base, distorted with layered sine waves keyed to angle + time
- `u_breath` uniform (0..1) controls radius and distortion intensity
- Soft edge via smoothstep + additive glow falloff
- Subtle background grain for texture
- Color shifts between cool blue-gray (exhale) and teal-green (inhale)

**Uniforms:**
| Uniform        | Type  | Purpose                          |
|----------------|-------|----------------------------------|
| `u_time`       | float | Wall clock for organic animation |
| `u_breath`     | float | 0..1 breath expansion            |
| `u_resolution` | vec2  | Canvas size                      |
| `u_darkMode`   | float | 0.0 or 1.0                      |

### Color Palette

**Light mode:**
- Background: `#f4f1eb` (warm off-white)
- Text: `#2a2a2a`
- Muted text: `#888`
- Accent: `#5a8a7a` (sage green)
- Blob core: teal-green to blue-gray gradient

**Dark mode:**
- Background: `#111`
- Text: `#e8e8e8`
- Muted text: `#666`
- Accent: `#7abfa8`
- Blob core: same gradient, richer against dark bg

### Layout

```
+---------------------------------------+
| [theme toggle]        [fullscreen]    |
|                                       |
|                                       |
|            [ shader blob ]            |
|                                       |
|              Inhale                   |
|               3                       |
|             2 / 10                    |
|                                       |
|        [Pause]  [Reset]              |
+---------------------------------------+
```

- Canvas: `position: fixed`, fills viewport
- UI: Centered flex column overlay, `pointer-events: none` container with `pointer-events: auto` on interactive elements
- Phase text: Large, fluid type (`clamp(1.5rem, 5vw, 3rem)`)
- Buttons: Translucent, rounded, `backdrop-filter: blur(4px)`

## JavaScript Architecture

### State Machine

```js
const PHASES = [
  { name: 'Inhale',  duration: 4 },
  { name: 'Hold',    duration: 2 },
  { name: 'Exhale',  duration: 6 },
];
const TOTAL_ROUNDS = 10;
```

Single state object tracks: `running`, `paused`, `completed`, `round`, `phaseIndex`, `phaseElapsed`, `breathT`.

### breathT Mapping

`breathT` is a normalized 0..1 value representing breath expansion:
- Inhale: ease 0 -> 1
- Hold: stay at 1
- Exhale: ease 1 -> 0

Uses smoothstep easing for natural feel. This value is passed to the shader as `u_breath`.

### Animation Loop

`requestAnimationFrame`-based. On pause, `u_time` continues (blob stays alive) but `u_breath` freezes.

## UX Flow

1. **Load:** Blob animates gently at rest (`u_breath = 0`). Shows title "Nervous System Reset" + "Begin" button.
2. **Start:** Title fades out, phase indicator + round counter fade in. "Begin" becomes "Pause" + "Reset".
3. **During:** Phase text transitions smoothly. Timer shows seconds remaining in current phase.
4. **Pause:** Blob keeps gently morphing, breath position freezes.
5. **Complete:** Phase text shows "Complete". Blob eases to rest. After 1s: "Session complete. Take a moment." + "Restart" button.

## File Structure

```
breathe-system/
  index.html          # The entire app (~350 lines)
  README.md           # Brief description
  docs/superpowers/specs/
    2026-04-01-breathe-system-design.md  # This file
```

## Verification

1. Open `index.html` in browser -- blob should animate at rest
2. Click "Begin" -- breathing cycle starts, blob expands/contracts
3. Verify phase text and timer update correctly
4. Complete full session -- verify 10 rounds complete and completion screen shows
5. Test pause/resume mid-session
6. Toggle dark mode -- verify colors and blob adapt
7. Test fullscreen mode
8. Test on mobile viewport (responsive)
9. Create GitHub repo `breathe-system` and push
