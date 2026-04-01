import { initBlob } from "./blob.js";

// ── Init blob ──
const canvas = document.querySelector("canvas.webgl");
const blob = initBlob(canvas);

// ── Sound Engine (Web Audio API) ──
let audioCtx = null;
let soundEnabled = false;
let activeOscillators = [];

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function stopAllSound() {
  activeOscillators.forEach(({ osc, gain }) => {
    try {
      gain.gain.cancelScheduledValues(audioCtx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      setTimeout(() => { try { osc.stop(); } catch(e) {} }, 400);
    } catch(e) {}
  });
  activeOscillators = [];
}

function createOsc(freq, type, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  activeOscillators.push({ osc, gain });
  return { osc, gain };
}

function playPhaseSound(phaseIndex) {
  if (!soundEnabled || !audioCtx) return;
  stopAllSound();

  const now = audioCtx.currentTime;

  if (phaseIndex === 0) {
    // Inhale: gentle rising tone 174 -> 285 Hz, 4s
    const { osc, gain } = createOsc(174, "sine", 0);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.5);
    osc.frequency.setValueAtTime(174, now);
    osc.frequency.linearRampToValueAtTime(285, now + 4);
    // Soft harmonic layer
    const h = createOsc(348, "sine", 0);
    h.gain.gain.setValueAtTime(0, now);
    h.gain.gain.linearRampToValueAtTime(0.04, now + 1);
    h.osc.frequency.setValueAtTime(348, now);
    h.osc.frequency.linearRampToValueAtTime(570, now + 4);
  } else if (phaseIndex === 1) {
    // Hold: steady 285 Hz with subtle LFO pulse, 2s
    const { osc, gain } = createOsc(285, "sine", 0);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
    // Subtle amplitude modulation
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.5;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    activeOscillators.push({ osc: lfo, gain: lfoGain });
  } else {
    // Exhale: descending 285 -> 136.1 Hz (OM frequency), 6s, fade out
    const { osc, gain } = createOsc(285, "sine", 0);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.02, now + 5.5);
    gain.gain.linearRampToValueAtTime(0, now + 6);
    osc.frequency.setValueAtTime(285, now);
    osc.frequency.exponentialRampToValueAtTime(136.1, now + 6);
    // Low harmonic
    const h = createOsc(142, "triangle", 0);
    h.gain.gain.setValueAtTime(0, now);
    h.gain.gain.linearRampToValueAtTime(0.03, now + 0.5);
    h.gain.gain.linearRampToValueAtTime(0, now + 5.5);
  }
}

// ── Visual Themes ──
const THEMES = [
  {
    name: "Sage",
    light: { first: "#F5F2ED", second: "#C8C3B8", accent: "#8A9A8F", bg: "#F5F2ED" },
    dark:  { first: "#2A2A28", second: "#3A3835", accent: "#4A5A4F", bg: "#1A1A18" },
    swatchA: "#8A9A8F", swatchB: "#C8C3B8",
  },
  {
    name: "Ocean",
    light: { first: "#EDF2F5", second: "#B8C5D0", accent: "#6B8FA3", bg: "#EDF2F5" },
    dark:  { first: "#1C2530", second: "#2A3A48", accent: "#3A5A6F", bg: "#141C24" },
    swatchA: "#6B8FA3", swatchB: "#B8C5D0",
  },
  {
    name: "Sand",
    light: { first: "#F5F0E6", second: "#D4C8B0", accent: "#A89878", bg: "#F5F0E6" },
    dark:  { first: "#2C2820", second: "#3E3828", accent: "#5A4E38", bg: "#1C1A15" },
    swatchA: "#A89878", swatchB: "#D4C8B0",
  },
  {
    name: "Dusk",
    light: { first: "#F2EEF5", second: "#C8BED0", accent: "#8A7FA0", bg: "#F2EEF5" },
    dark:  { first: "#252028", second: "#382E42", accent: "#4E3E62", bg: "#1A171E" },
    swatchA: "#8A7FA0", swatchB: "#C8BED0",
  },
  {
    name: "Moss",
    light: { first: "#EEF2EC", second: "#B8C4B0", accent: "#6A8A62", bg: "#EEF2EC" },
    dark:  { first: "#1E2520", second: "#2A3828", accent: "#3A5238", bg: "#151C14" },
    swatchA: "#6A8A62", swatchB: "#B8C4B0",
  },
  {
    name: "Ember",
    light: { first: "#F5F0ED", second: "#D0C0B8", accent: "#A07868", bg: "#F5F0ED" },
    dark:  { first: "#2C2422", second: "#42322C", accent: "#5E4238", bg: "#1C1614" },
    swatchA: "#A07868", swatchB: "#D0C0B8",
  },
];

let currentThemeIndex = 0;
let pickerVisible = false;
let isPlainMode = false;

// Build swatches
const picker = document.getElementById("theme-picker");
THEMES.forEach((t, i) => {
  const el = document.createElement("div");
  el.className = "swatch" + (i === 0 ? " active" : "");
  el.style.setProperty("--sw-a", t.swatchA);
  el.style.setProperty("--sw-b", t.swatchB);
  el.title = t.name;
  el.addEventListener("click", () => selectTheme(i));
  picker.appendChild(el);
});
const plainSwatch = document.createElement("div");
plainSwatch.className = "swatch swatch-plain";
plainSwatch.title = "Plain";
plainSwatch.addEventListener("click", () => selectPlain());
picker.appendChild(plainSwatch);

function selectTheme(index) {
  currentThemeIndex = index;
  isPlainMode = false;
  canvas.classList.remove("no-blob");
  picker.querySelectorAll(".swatch").forEach((s, i) => {
    s.classList.toggle("active", i === index);
  });
  applyTheme();
}

function selectPlain() {
  isPlainMode = true;
  canvas.classList.add("no-blob");
  picker.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
  plainSwatch.classList.add("active");
}

// ── Breathing state ──
const PHASES = [
  { name: "Inhale", duration: 4 },
  { name: "Hold", duration: 2 },
  { name: "Exhale", duration: 6 },
];
const TOTAL_ROUNDS = 10;
const CYCLE = PHASES.reduce((s, p) => s + p.duration, 0);
const CIRC = 2 * Math.PI * 15.5;

const state = {
  running: false,
  paused: false,
  completed: false,
  round: 1,
  phaseIndex: 0,
  phaseElapsed: 0,
  lastTimestamp: null,
};

// ── DOM ──
const elIdle = document.getElementById("idle");
const elSession = document.getElementById("session");
const elPhase = document.getElementById("phase");
const elMeta = document.getElementById("meta");
const elTimer = document.getElementById("timer");
const elProtocol = document.getElementById("protocol");
const elControls = document.getElementById("bottom-controls");
const elCompletion = document.getElementById("completion");
const progressRing = document.getElementById("progress-ring");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const pauseIcon = document.getElementById("pause-icon");
const btnStop = document.getElementById("btn-stop");
const btnTheme = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const btnFs = document.getElementById("fs-toggle");
const btnPalette = document.getElementById("palette-toggle");
const btnSound = document.getElementById("sound-toggle");
const soundIcon = btnSound.querySelector("svg");

// ── Dark mode ──
let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (isDark) document.documentElement.classList.add("dark");
applyTheme();

function applyTheme() {
  themeIcon.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

  const t = THEMES[currentThemeIndex];
  const c = isDark ? t.dark : t.light;
  blob.setColors(c.first, c.second, c.accent, c.bg);
}

btnTheme.addEventListener("click", () => {
  isDark = !isDark;
  document.documentElement.classList.toggle("dark", isDark);
  applyTheme();
});

btnFs.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
});

// ── Sound toggle ──
btnSound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  btnSound.classList.toggle("active", soundEnabled);
  // Update icon: volume-2 when on, volume-x when off
  soundIcon.innerHTML = soundEnabled
    ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'
    : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
  if (soundEnabled) {
    ensureAudioCtx();
    // If running, start sound for current phase
    if (state.running && !state.paused && !state.completed) {
      playPhaseSound(state.phaseIndex);
    }
  } else {
    stopAllSound();
  }
});

// ── Palette toggle ──
btnPalette.addEventListener("click", () => {
  pickerVisible = !pickerVisible;
  picker.classList.toggle("show", pickerVisible);
});
document.addEventListener("click", (e) => {
  if (pickerVisible && !picker.contains(e.target) && e.target !== btnPalette && !btnPalette.contains(e.target)) {
    pickerVisible = false;
    picker.classList.remove("show");
  }
});

// ── UI transitions ──
function showSession() {
  elIdle.classList.add("hide");
  elCompletion.classList.remove("show");
  setTimeout(() => {
    elSession.classList.add("show");
    elProtocol.classList.add("show");
    elControls.classList.add("show");
  }, 300);
}

function showIdle() {
  elSession.classList.remove("show");
  elProtocol.classList.remove("show");
  elControls.classList.remove("show");
  elCompletion.classList.remove("show");
  setTimeout(() => elIdle.classList.remove("hide"), 300);
}

function showCompletion() {
  elSession.classList.remove("show");
  elControls.classList.remove("show");
  stopAllSound();
  setTimeout(() => elCompletion.classList.add("show"), 500);
}

// ── Protocol highlighting ──
function updateProtocol(activeIndex) {
  for (let i = 0; i < 3; i++) {
    document.getElementById("pn-" + i).classList.toggle("active", i === activeIndex);
    document.getElementById("pl-" + i).classList.toggle("active", i === activeIndex);
  }
}

// ── Tick ──
let prevPhase = -1;

function tick(dt) {
  if (!state.running || state.paused || state.completed) return;

  state.phaseElapsed += dt;
  const phase = PHASES[state.phaseIndex];

  if (state.phaseElapsed >= phase.duration) {
    state.phaseElapsed -= phase.duration;
    state.phaseIndex++;
    if (state.phaseIndex >= PHASES.length) {
      state.phaseIndex = 0;
      state.round++;
      if (state.round > TOTAL_ROUNDS) {
        state.completed = true;
        return;
      }
    }
  }
}

function updateUI() {
  if (!state.running) return;

  if (state.completed) {
    showCompletion();
    state.running = false;
    updateProtocol(-1);
    progressRing.style.strokeDashoffset = "0";
    return;
  }

  const phase = PHASES[state.phaseIndex];

  if (state.phaseIndex !== prevPhase) {
    elPhase.style.opacity = "0";
    setTimeout(() => {
      elPhase.textContent = phase.name;
      elPhase.style.opacity = "1";
    }, 180);
    prevPhase = state.phaseIndex;
    updateProtocol(state.phaseIndex);
    playPhaseSound(state.phaseIndex);
  }

  const phaseNum = String(state.phaseIndex + 1).padStart(2, "0");
  elMeta.textContent = `Phase ${phaseNum} \u2014 ${state.round} of ${TOTAL_ROUNDS}`;

  // No leading zero on timer
  const remaining = Math.ceil(phase.duration - state.phaseElapsed);
  elTimer.textContent = String(remaining);

  const totalElapsed =
    (state.round - 1) * CYCLE +
    PHASES.slice(0, state.phaseIndex).reduce((s, p) => s + p.duration, 0) +
    state.phaseElapsed;
  const progress = totalElapsed / (TOTAL_ROUNDS * CYCLE);
  progressRing.style.strokeDashoffset = CIRC * (1 - progress);
}

function resetState() {
  state.running = false;
  state.paused = false;
  state.completed = false;
  state.round = 1;
  state.phaseIndex = 0;
  state.phaseElapsed = 0;
  state.lastTimestamp = null;
  prevPhase = -1;
  stopAllSound();
}

// ── Events ──
btnStart.addEventListener("click", () => {
  if (soundEnabled) ensureAudioCtx();
  resetState();
  state.running = true;
  showSession();
});

btnPause.addEventListener("click", () => {
  state.paused = !state.paused;
  if (state.paused) {
    pauseIcon.innerHTML = '<polygon points="8,5 19,12 8,19"/>';
    btnPause.title = "Resume";
    stopAllSound();
  } else {
    pauseIcon.innerHTML =
      '<rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/>';
    btnPause.title = "Pause";
    state.lastTimestamp = null;
    playPhaseSound(state.phaseIndex);
  }
});

btnStop.addEventListener("click", () => {
  resetState();
  showIdle();
  pauseIcon.innerHTML =
    '<rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/>';
});

elCompletion.addEventListener("click", () => {
  if (soundEnabled) ensureAudioCtx();
  resetState();
  state.running = true;
  elCompletion.classList.remove("show");
  setTimeout(() => showSession(), 400);
});

// ── Animation frame ──
function frame(timestamp) {
  if (state.running && !state.paused && !state.completed) {
    const dt = state.lastTimestamp ? (timestamp - state.lastTimestamp) / 1000 : 0;
    state.lastTimestamp = timestamp;
    tick(dt);
  }
  updateUI();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
