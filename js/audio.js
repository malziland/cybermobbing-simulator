/**
 * @file audio.js
 * @description Web Audio API sound engine and pausable timeout system.
 *   Provides synthesized notification sounds for each platform (WhatsApp, Instagram,
 *   TikTok, iMessage), a camera shutter effect, typing indicator audio, and background
 *   music control. Also implements a custom pausable timer system ({@link simTimeout})
 *   that replaces native setTimeout so the entire simulation can be paused/resumed
 *   without losing timer state.
 * @requires i18n.js - t() for UI label translation (pause/resume button text)
 */

// ========== AUDIO ENGINE ==========

/** @type {AudioContext} Shared Web Audio context used by all sound functions */
var ax;

/**
 * Initializes the shared AudioContext. Must be called from a user gesture (click)
 * to satisfy browser autoplay policies.
 */
function initAudio() {
  ax = new (window.AudioContext || window.webkitAudioContext)();
  ax.resume();
}

/**
 * Core oscillator builder. Creates a single tone with an attack-decay envelope.
 * Silently returns if the AudioContext is missing or the simulation is paused.
 * @param {number} freq    - Frequency in Hz
 * @param {number} start   - AudioContext time to begin playback
 * @param {number} dur     - Duration in seconds
 * @param {number} [vol=0.1]  - Peak gain (0-1)
 * @param {string} [type='sine'] - OscillatorNode waveform type
 */
function tone(freq, start, dur, vol, type) {
  if (!ax || simPaused) return;
  var o = ax.createOscillator();
  var g = ax.createGain();
  o.connect(g);
  g.connect(ax.destination);
  o.frequency.setValueAtTime(freq, start);
  o.type = type || 'sine';
  // Quick 5ms attack ramp to avoid click artifacts, then exponential decay
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol || 0.1, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.start(start);
  o.stop(start + dur);
}

/**
 * WhatsApp-style notification: two-note rising chime (A5 -> D6).
 */
function sndWa() {
  if (!ax || simPaused) return;
  var t = ax.currentTime;
  tone(880, t, 0.12, 0.1);
  tone(1175, t + 0.12, 0.15, 0.1);
}

/**
 * Instagram-style notification: three-note ascending arpeggio (C6 -> E6 -> G6).
 */
function sndIg() {
  if (!ax || simPaused) return;
  var t = ax.currentTime;
  tone(1047, t, 0.06, 0.06);
  tone(1319, t + 0.07, 0.06, 0.06);
  tone(1568, t + 0.14, 0.08, 0.05);
}

/**
 * TikTok-style notification: descending pitch sweep (1200 Hz -> 800 Hz)
 * giving a short "bloop" effect.
 */
function sndTk() {
  if (!ax || simPaused) return;
  var t = ax.currentTime;
  var o = ax.createOscillator();
  var g = ax.createGain();
  o.connect(g);
  g.connect(ax.destination);
  // Rapid frequency sweep downward creates the characteristic bloop
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(800, t + 0.08);
  o.type = 'sine';
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.start(t);
  o.stop(t + 0.1);
}

/**
 * iMessage-style notification: three-note ascending chime (C6 -> E6 -> G6),
 * slightly longer and louder than the Instagram sound.
 */
function sndIm() {
  if (!ax || simPaused) return;
  var t = ax.currentTime;
  tone(1047, t, 0.1, 0.08);
  tone(1319, t + 0.12, 0.1, 0.08);
  tone(1568, t + 0.24, 0.15, 0.07);
}

/**
 * Camera shutter sound: synthesized from a short burst of white noise
 * shaped with an exponential decay envelope and high-pass filtered at 2 kHz
 * to simulate the mechanical "click" of a camera.
 */
function sndShutter() {
  if (!ax || simPaused) return;
  var t = ax.currentTime;
  // Generate 80ms of white noise with exponential decay
  var b = ax.createBuffer(1, ax.sampleRate * 0.08, ax.sampleRate);
  var d = b.getChannelData(0);
  for (var i = 0; i < d.length; i++) {
    var env = Math.exp(-i / (d.length * 0.08));
    d[i] = (Math.random() * 2 - 1) * env * 0.4;
  }
  var s = ax.createBufferSource();
  var g = ax.createGain();
  var f = ax.createBiquadFilter();
  s.buffer = b;
  // High-pass filter removes rumble, keeping only the sharp click
  f.type = 'highpass';
  f.frequency.value = 2000;
  s.connect(f);
  f.connect(g);
  g.connect(ax.destination);
  g.gain.setValueAtTime(0.2, t);
  s.start(t);
}

/**
 * Phone vibration buzz: low-frequency sawtooth wave (150 Hz) that mimics
 * the haptic buzz of a phone notification.
 */
function sndBuzz() {
  if (!ax || simPaused) return;
  var t = ax.currentTime;
  var o = ax.createOscillator();
  var g = ax.createGain();
  o.connect(g);
  g.connect(ax.destination);
  o.frequency.setValueAtTime(150, t);
  o.type = 'sawtooth';
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.start(t);
  o.stop(t + 0.15);
}


/**
 * Starts a rapid stream of faint, randomized high-pitched ticks (2500-3300 Hz)
 * to simulate the sound of someone typing on a phone keyboard.
 */
var typActive = false;
function typStart() {
  if (!ax) return;
  typActive = true;
  function typTick() {
    if (!typActive) return;
    tone(2500 + Math.random() * 800, ax.currentTime, 0.015, 0.01, 'sine');
    simTimeout(typTick, 60 + Math.random() * 40);
  }
  simTimeout(typTick, 60);
}

/**
 * Stops the typing indicator sound loop.
 */
function typStop() {
  typActive = false;
}

// ========== BACKGROUND MUSIC ==========

/** @type {HTMLAudioElement|null} Reference to the <audio id="bgm"> element */
var bgMusic;

/**
 * Starts the background music track at 40% volume.
 * Silently catches play() rejections (e.g. if autoplay is blocked).
 */
function startMusic() {
  bgMusic = document.getElementById('bgm');
  if (bgMusic) {
    bgMusic.volume = 0.4;
    bgMusic.play().catch(function () {});
  }
}

// ========== PAUSABLE TIMEOUT SYSTEM ==========
//
// Architecture: Every scene uses simTimeout() instead of native setTimeout().
// Each timer stores its remaining time. On pause, all native timeouts are cleared
// and elapsed time is subtracted from `remaining`. On resume, each timer is
// rescheduled with its remaining duration. This lets the entire simulation
// freeze and resume seamlessly without drifting or losing callbacks.

/** @type {boolean} Global pause flag checked by all sounds and intervals */
var simPaused = false;

/**
 * @type {Array<{id: number, fn: Function, remaining: number, startedAt: number, nativeId: number, schedule: Function}>}
 * Active pausable timers. Each entry tracks the callback, how many ms remain,
 * when it was last (re-)started, and a schedule() function to arm it.
 */
var simTimers = [];

/** @type {number} Monotonically increasing counter for timer IDs */
var simTimerIdCounter = 0;

/**
 * Pausable replacement for setTimeout. Registers a callback that survives
 * pause/resume cycles by tracking remaining time.
 *
 * Flow: schedule() arms a native setTimeout for `remaining` ms. When it fires,
 * the timer removes itself from the list and calls fn(). If togglePause() is
 * called before it fires, the native timeout is cleared, elapsed time is
 * subtracted from `remaining`, and schedule() is called again on resume.
 *
 * @param {Function} fn    - Callback to execute after delay
 * @param {number}   delay - Delay in milliseconds
 * @returns {number} Unique timer ID (not the native setTimeout ID)
 */
function simTimeout(fn, delay) {
  var id = ++simTimerIdCounter;
  var timer = {id: id, fn: fn, remaining: delay, startedAt: Date.now()};

  function schedule() {
    timer.startedAt = Date.now();
    timer.nativeId = setTimeout(function () {
      // Timer has fired -- remove from active list, then execute callback
      simTimers = simTimers.filter(function (t) { return t.id !== id; });
      fn();
    }, timer.remaining);
  }

  timer.schedule = schedule;
  simTimers.push(timer);
  schedule();
  return id;
}

/**
 * Toggles the simulation between paused and running states.
 *
 * Pause coordination (all five systems are frozen/resumed together):
 *   1. simTimers  -- clear native timeouts, snapshot remaining time
 *   2. bgMusic    -- pause/resume the <audio> element
 *   3. clockInt   -- stop/restart the phone clock display interval
 *   4. tmr        -- stop/restart the progress bar tick interval
 *   5. UI         -- swap button label, show/hide pause overlay
 *
 * On resume, clockStart is recalculated so the phone clock picks up where
 * it left off without jumping forward.
 */
function togglePause() {
  simPaused = !simPaused;
  var btn = document.getElementById('pauseBtn');
  var overlay = document.getElementById('pauseOverlay');

  if (simPaused) {
    // -- PAUSE: freeze everything --
    simTimers.forEach(function (t) {
      clearTimeout(t.nativeId);
      // Calculate how much time has already elapsed and subtract it
      t.remaining -= (Date.now() - t.startedAt);
      if (t.remaining < 0) t.remaining = 0;
    });
    if (bgMusic) bgMusic.pause();
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    btn.textContent = t('ui.resume');
    overlay.classList.remove('hidden');
  } else {
    // -- RESUME: restart everything with corrected offsets --
    simTimers.forEach(function (t) { t.schedule(); });
    if (bgMusic) bgMusic.play().catch(function () {});
    // Recompute clockStart so elapsed time stays consistent after the pause gap
    clockStart = Date.now() - (sec * 1000);
    if (typeof startClock === 'function') startClock();
    tmr = setInterval(tick, 100);
    btn.textContent = t('ui.pause');
    overlay.classList.add('hidden');
  }
}
