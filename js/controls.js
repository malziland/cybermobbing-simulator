/**
 * @file controls.js
 * @description Control bar and timeline (see docs/adr/ADR-0008).
 *   One bar holds pause, the name of the scene, the timeline with scene marks, sound, the
 *   view picker and the legal notice link, in the same order and size in
 *   phone view and projector view.
 *   Jumping on the timeline does not rewind anything: the simulation is a
 *   chain of timed steps that only know how to go forward. A jump therefore
 *   restarts the scenes from zero and runs their steps, silently and without
 *   waiting, up to the target time (simSeek). The result is the state the
 *   simulation has at that second in a normal run, and the projector view
 *   follows by itself because it only mirrors the phone.
 * @requires i18n.js   - t() for labels
 * @requires audio.js  - simTimers, simFreezeTimers(), simAdvance(), simPaused, typStop(), bgMusic
 * @requires timer.js  - sec, tmr, clockInt, clockStart, tick(), startClock()
 * @requires helpers.js - setLayer()
 * @requires stage.js  - stageReset()
 * @requires main.js   - mkPhoto(), simStarted (only used at run time)
 * @requires scenes/p1-whatsapp.js - p1()
 */

// ========== TIMELINE ==========

/**
 * @type {number} Length of the timeline in simulation seconds: the whole run
 * up to the moment the help page replaces the phone (p6 in p5-finale.js).
 * The bar shows no times, only this share. The E2E run checks that the help
 * page appears exactly at this second.
 */
var CTL_TOTAL = 134;

/**
 * @type {number} Last second a jump may land on: one second before the end,
 * so that jumping or dragging never calls up the help page by itself. It
 * follows a second later when the simulation runs on.
 */
var CTL_SEEK_END = CTL_TOTAL - 1;

/**
 * Scenes on the timeline: label key, the phone app layer that is active and
 * the second the scene starts at. The start seconds repeat the durations in
 * js/scenes/; the E2E run checks every mark against the real scene switch.
 * @type {Array<{key: string, app: string, at: number}>}
 */
var CTL_SCENES = [
  { key: 'ctl.wa', app: 'aWa', at: 0 },
  { key: 'ctl.ig', app: 'aIg', at: 28 },
  { key: 'ctl.tk', app: 'aTk', at: 56 },
  { key: 'ctl.hs', app: 'aHs', at: 80 },
  { key: 'ctl.im', app: 'aIm', at: 95 },
  { key: 'ctl.fin', app: 'aFn', at: 114 },
];

/** @type {string} Pristine markup of the phone screen, restored by simRestart() */
var ctlInitialScreen = '';

/** @type {boolean} True while the pointer is held down on the timeline */
var ctlDragging = false;

/** @type {boolean} True while the knob is dragged and the picture follows it live */
var ctlScrubbing = false;

/**
 * @type {number} A click this close to a scene mark, in seconds, lands on the
 * mark itself, so a scene can easily be started from its first moment.
 * Everywhere else a click goes exactly where it was made.
 */
var CTL_SNAP = 1.5;

/**
 * Returns the scene that is running at a given second.
 * @param {number} t - Simulation second
 * @returns {{key: string, app: string, at: number}} Scene entry
 */
function ctlSceneAt(t) {
  var scene = CTL_SCENES[0];
  CTL_SCENES.forEach(function (s) {
    if (t >= s.at) scene = s;
  });
  return scene;
}

/**
 * Returns the scene start if `t` is within CTL_SNAP seconds of one, else `t`.
 * @param {number} t - Second on the timeline
 * @returns {number} Second to jump to
 */
function ctlSnap(t) {
  var target = t;
  CTL_SCENES.forEach(function (s) {
    if (Math.abs(t - s.at) <= CTL_SNAP) target = s.at;
  });
  return target;
}

/**
 * Jumping is offered on wide windows only. Up to and including 500 CSS
 * pixels of width (the same limit the phone styles use) the timeline just
 * shows the progress, so the 120 seconds cannot be skipped on a phone.
 * @returns {boolean} True if the timeline may be used to jump
 */
function ctlSeekAllowed() {
  return !(window.matchMedia && window.matchMedia('(max-width:500px)').matches);
}

// ========== RESTART AND JUMP ==========

/**
 * Starts the scenes again from zero without reloading the page: stops every
 * timer, restores the pristine phone screen and stage, and calls p1().
 * The view counter is not touched (it only counts in go()).
 */
function simRestart() {
  simFreezeTimers();
  simTimers = [];
  if (typeof tmr !== 'undefined') clearInterval(tmr);
  if (typeof clockInt !== 'undefined') clearInterval(clockInt);
  typStop();

  var screen = document.querySelector('#phone .scr');
  var date = document.getElementById('hsDate');
  var dateText = date ? date.textContent : '';
  if (screen && ctlInitialScreen) screen.innerHTML = ctlInitialScreen;

  var toastEl = document.getElementById('toast');
  if (toastEl) {
    toastEl.className = 'toast';
    toastEl.textContent = '';
  }
  // Clock and date live inside the rebuilt screen; the status bar clock does not
  var clock = document.getElementById('hsClock');
  var statusClock = document.getElementById('sbTime');
  if (clock && statusClock) clock.textContent = statusClock.textContent;
  date = document.getElementById('hsDate');
  if (date) date.textContent = dateText;

  ['igPh', 'tkBg'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) mkPhoto(el);
  });
  // The stage must be wired before the scenes run, so it sees every step
  stageReset();
  setLayer(1);
  sec = 0;
  p1();
}

/**
 * Brings every fade inside the phone and the stage to its end state, so the
 * result of a jump is there at once. Phone entries start invisible and only
 * become visible through their fade-in; without this the phone would stay
 * empty for a moment after every jump. Runs as a microtask, i.e. after the
 * stage has mirrored the jump (its observers were queued before).
 */
function ctlSettle() {
  if (!document.getAnimations) return;
  Promise.resolve().then(function () {
    var phone = document.getElementById('phone');
    var stage = document.getElementById('stage');
    // Read a layout value first: only then every new fade exists (Safari)
    void document.body.offsetHeight;
    document.getAnimations().forEach(function (animation) {
      var target = animation.effect && animation.effect.target;
      if (!target) return;
      if (!(phone && phone.contains(target)) && !(stage && stage.contains(target))) return;
      try {
        animation.finish();
      } catch (e) {
        // Endless animations (typing dots) cannot be finished; they keep running
      }
    });
  });
}

/**
 * Jumps to a second on the timeline, forwards or backwards. Works while
 * running and while paused (it then stays paused). Does nothing outside the
 * phone phase (start screen, final help screen).
 * @param {number}  t      - Target second, clamped to 0..CTL_SEEK_END
 * @param {boolean} [hold] - True while the knob is being dragged: show the
 *   state of that second but keep the simulation frozen and the music alone
 */
function simSeek(t, hold) {
  var phone = document.getElementById('phone');
  if (!simStarted || !phone || phone.classList.contains('hidden')) return;
  var n = Number(t);
  var target = isNaN(n) ? 0 : Math.min(Math.max(n, 0), CTL_SEEK_END);

  // Timers created during the restart must not be armed: simAdvance() runs them
  simSeeking = true;
  try {
    simRestart();
  } finally {
    simSeeking = false;
  }
  simAdvance((target * 1000) / SIM_SPEED);

  sec = target;
  clockStart = Date.now() - sec * 1000;
  if (!hold && bgMusic && bgMusic.duration) {
    try {
      bgMusic.currentTime = target % bgMusic.duration;
    } catch (e) {}
  }
  if (!simPaused && !hold) {
    simTimers.forEach(function (timer) {
      timer.schedule();
    });
    tmr = setInterval(tick, 100 / SIM_SPEED);
    startClock();
  }
  ctlUpdate();
  ctlSettle();
}

// ========== THE BAR ==========

/**
 * Brings the bar in line with the simulation: time, scene name (or
 * "paused"), fill of the timeline and the state of the pause button.
 * Called on every clock tick, after pausing and after a jump.
 */
function ctlUpdate() {
  var seek = document.getElementById('ctlSeek');
  if (!seek) return;
  var now = Math.min(Math.max(sec, 0), CTL_TOTAL);
  if (!ctlDragging) seek.style.setProperty('--pos', ((now / CTL_TOTAL) * 100).toFixed(2) + '%');

  var active = document.querySelector('#phone .app.on');
  var scene = null;
  CTL_SCENES.forEach(function (s) {
    if (active && s.app === active.id) scene = s;
  });
  var sceneEl = document.getElementById('ctlScene');
  if (sceneEl) {
    sceneEl.textContent = simPaused ? t('ctl.paused') : scene ? t(scene.key) : '';
    sceneEl.classList.toggle('paused', simPaused);
  }
  var btn = document.getElementById('pauseBtn');
  if (btn) {
    btn.classList.toggle('paused', simPaused);
    btn.setAttribute('aria-label', t(simPaused ? 'ctl.resume' : 'ctl.pause'));
  }
  seek.setAttribute('aria-valuenow', String(Math.floor(now)));
  // Read out as the name of the scene, not as a number of seconds
  if (scene) seek.setAttribute('aria-valuetext', t(scene.key));
  else seek.removeAttribute('aria-valuetext');
}

/**
 * Converts a pointer position into a second on the timeline.
 * @param {number} clientX - Pointer x position
 * @returns {number} Second between 0 and CTL_TOTAL
 */
function ctlTimeAt(clientX) {
  var rect = document.getElementById('ctlTrack').getBoundingClientRect();
  if (!rect.width) return 0;
  var share = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  return share * CTL_TOTAL;
}

/**
 * Shows the small label above the timeline, or hides it.
 * @param {number|null} at   - Second the label points to, null to hide
 * @param {string}      text - Label text
 */
function ctlTip(at, text) {
  var tip = document.getElementById('ctlTip');
  if (!tip) return;
  if (at === null) {
    tip.classList.remove('show');
    return;
  }
  tip.textContent = text;
  tip.style.left = ((at / CTL_TOTAL) * 100).toFixed(2) + '%';
  tip.classList.add('show');
}

/**
 * Builds the scene marks, saves the pristine phone screen and connects
 * pointer and keyboard. Called once after the DOM is ready (main.js).
 */
function ctlInit() {
  var seek = document.getElementById('ctlSeek');
  var track = document.getElementById('ctlTrack');
  var screen = document.querySelector('#phone .scr');
  if (screen) ctlInitialScreen = screen.innerHTML;
  if (!seek || !track) return;

  CTL_SCENES.slice(1).forEach(function (s) {
    var mark = document.createElement('i');
    mark.className = 'ctl-mark';
    mark.style.left = ((s.at / CTL_TOTAL) * 100).toFixed(2) + '%';
    track.appendChild(mark);
  });
  var bar = document.getElementById('ctlBar');
  if (bar) bar.setAttribute('aria-label', t('ctl.label'));
  seek.setAttribute('aria-label', t('ctl.timeline'));
  seek.setAttribute('aria-valuemin', '0');
  seek.setAttribute('aria-valuemax', String(CTL_TOTAL));

  var downX = 0;
  var moved = false;
  var pendingAt = 0;
  var frame = 0;

  /** Ends a drag: the simulation continues from `at` unless it is paused. */
  function scrubEnd(at) {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    ctlScrubbing = false;
    document.body.classList.remove('scrubbing');
    simSeek(at);
    if (bgMusic && !simPaused) bgMusic.play().catch(function () {});
  }

  seek.addEventListener('pointerdown', function (e) {
    if (!ctlSeekAllowed()) return;
    ctlDragging = true;
    moved = false;
    downX = e.clientX;
    if (seek.setPointerCapture) seek.setPointerCapture(e.pointerId);
  });
  seek.addEventListener('pointermove', function (e) {
    if (!ctlSeekAllowed()) return;
    var at = ctlTimeAt(e.clientX);
    if (ctlDragging) {
      if (Math.abs(e.clientX - downX) > 4) moved = true;
      if (moved) {
        // Dragging: the picture follows the knob at once. The simulation is
        // held meanwhile; at most one jump per frame, the newest position wins.
        if (!ctlScrubbing) {
          ctlScrubbing = true;
          document.body.classList.add('scrubbing');
          if (bgMusic && !simPaused) bgMusic.pause();
        }
        pendingAt = at;
        if (!frame) {
          frame = requestAnimationFrame(function () {
            frame = 0;
            simSeek(pendingAt, true);
          });
        }
        seek.style.setProperty('--pos', ((at / CTL_TOTAL) * 100).toFixed(2) + '%');
        ctlTip(at, t(ctlSceneAt(at).key));
        return;
      }
    }
    // Pointing: show where a click would go
    var target = ctlSnap(at);
    ctlTip(target, t(ctlSceneAt(target).key));
  });
  seek.addEventListener('pointerup', function (e) {
    if (!ctlDragging) return;
    ctlDragging = false;
    var at = ctlTimeAt(e.clientX);
    // A click goes where it was made (next to a mark: onto the mark)
    if (ctlScrubbing) scrubEnd(at);
    else simSeek(ctlSnap(at));
    ctlTip(null, '');
  });
  // The drag can also end without a pointerup (pointer taken away, window change)
  function dragLost() {
    if (!ctlDragging) return;
    ctlDragging = false;
    ctlTip(null, '');
    if (ctlScrubbing) scrubEnd(sec);
    else ctlUpdate();
  }
  seek.addEventListener('pointercancel', dragLost);
  seek.addEventListener('lostpointercapture', dragLost);
  seek.addEventListener('pointerleave', function () {
    if (!ctlDragging) ctlTip(null, '');
  });

  // Keyboard on the focused timeline: standard slider keys
  seek.addEventListener('keydown', function (e) {
    if (!ctlSeekAllowed()) return;
    var now = Math.min(sec, CTL_TOTAL);
    var index = CTL_SCENES.indexOf(ctlSceneAt(now));
    var target = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target = now + 5;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target = now - 5;
    else if (e.key === 'PageUp') target = CTL_SCENES[Math.min(index + 1, CTL_SCENES.length - 1)].at;
    else if (e.key === 'PageDown') target = CTL_SCENES[Math.max(index - 1, 0)].at;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = CTL_SCENES[CTL_SCENES.length - 1].at;
    if (target === null) return;
    e.preventDefault();
    simSeek(target);
  });

  // On narrow windows the timeline is a plain progress display
  function applyMode() {
    var allowed = ctlSeekAllowed();
    seek.setAttribute('role', allowed ? 'slider' : 'progressbar');
    seek.tabIndex = allowed ? 0 : -1;
  }
  applyMode();
  window.addEventListener('resize', applyMode);
  ctlUpdate();
}
