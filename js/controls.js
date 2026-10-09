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
 *   follows by itself because it only mirrors the phone. The help page at
 *   the end is the last part of the timeline; the bar stays on it, so one
 *   can go back into the run from there.
 * @requires i18n.js   - t() for labels
 * @requires audio.js  - simTimers, simFreezeTimers(), simAdvance(), simPaused, typStop(), bgMusic
 * @requires timer.js  - sec, tmr, clockInt, clockStart, tick(), startClock()
 * @requires helpers.js - setLayer()
 * @requires stage.js  - stageReset()
 * @requires main.js   - mkPhoto(), simStarted (only used at run time)
 * @requires scenes/p1-whatsapp.js - p1()
 * @requires scenes/p5-finale.js - p6Reset()
 */

// ========== TIMELINE ==========

/**
 * @type {number} Length of the timeline in simulation seconds. It covers the
 * whole run and a last part for the help page that replaces the phone at the
 * end (see CTL_SCENES). The bar shows no times, only this share.
 */
var CTL_TOTAL = 140;

/**
 * Scenes on the timeline: label key, the phone app layer that is active and
 * the second the scene starts at. The start seconds repeat the durations in
 * js/scenes/; the E2E run checks every mark against the real scene switch.
 * The last entry is the help page (p6 in p5-finale.js): not an app inside the
 * phone but a page of its own that replaces it.
 * @type {Array<{key: string, app: string, at: number}>}
 */
var CTL_SCENES = [
  { key: 'ctl.wa', app: 'aWa', at: 0 },
  { key: 'ctl.ig', app: 'aIg', at: 28 },
  { key: 'ctl.tk', app: 'aTk', at: 56 },
  { key: 'ctl.hs', app: 'aHs', at: 80 },
  { key: 'ctl.im', app: 'aIm', at: 95 },
  { key: 'ctl.fin', app: 'aFn', at: 114 },
  { key: 'ctl.help', app: 'aCta', at: 134 },
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
 * Tells whether the help page at the end is showing instead of the phone.
 * @returns {boolean} True on the help page
 */
function ctlEnded() {
  var cta = document.getElementById('aCta');
  return !!cta && !cta.classList.contains('hidden');
}

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
 * Jumping is not offered on a phone: there the timeline just shows the
 * progress. A phone is a window up to and including 500 CSS pixels wide, or a
 * device operated by finger whose window is up to and including 500 pixels
 * high (a phone held sideways). Tablets and computers may jump, whatever the
 * size of their window. The phone styles in css/styles.css use the same rule.
 * @returns {boolean} True if the timeline may be used to jump
 */
function ctlSeekAllowed() {
  if (!window.matchMedia) return true;
  return !window.matchMedia('(max-width:500px),(pointer:coarse) and (max-height:500px)').matches;
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
  // Coming back from the help page: the phone returns
  p6Reset();

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
 * Brings every fade inside the phone, the stage, the help page and the toast to its end state, so the
 * result of a jump is there at once. Phone entries start invisible and only
 * become visible through their fade-in; without this the phone would stay
 * empty for a moment after every jump. Runs as a microtask, i.e. after the
 * stage has mirrored the jump (its observers were queued before).
 */
function ctlSettle() {
  Promise.resolve().then(function () {
    stageJumping = false;
    if (document.getAnimations) {
      var roots = ['phone', 'stage', 'aCta', 'toast'].map(function (id) {
        return document.getElementById(id);
      });
      // Read a layout value first: only then every new fade exists (Safari)
      void document.body.offsetHeight;
      document.getAnimations().forEach(function (animation) {
        var target = animation.effect && animation.effect.target;
        if (!target) return;
        var inside = roots.some(function (root) {
          return !!root && root.contains(target);
        });
        if (!inside) return;
        try {
          animation.finish();
        } catch (e) {
          // Endless animations (typing dots) cannot be finished; they keep running
        }
      });
    }
    // Everything has its final height now: make sure no message is cut off
    stageFitLists();
    // The final state is laid out: from here on transitions may run again.
    // Safari would otherwise dim and fold the older messages for 0.4 s after
    // every jump, although they already belong to the past.
    void document.body.offsetHeight;
    document.body.classList.remove('jumping');
  });
}

/**
 * Jumps to a second on the timeline, forwards or backwards. Works while
 * running and while paused (it then stays paused), and also from the help
 * page back into the run. Does nothing before the simulation was started.
 * @param {number}  t      - Target second, clamped to 0..CTL_TOTAL
 * @param {boolean} [hold] - True while the knob is being dragged: show the
 *   state of that second but keep the simulation frozen and the music alone
 */
function simSeek(t, hold) {
  if (!simStarted) return;
  // Tells the stage that what follows is a jump (cleared in ctlSettle())
  stageJumping = true;
  // Until then the large messages take their state without transitions (css/styles.css)
  document.body.classList.add('jumping');
  var n = Number(t);
  var target = isNaN(n) ? 0 : Math.min(Math.max(n, 0), CTL_TOTAL);
  // The help page has no pause and nothing left to wait for: a jump into its
  // part runs it to the end, so it is complete even while paused or dragging
  var help = CTL_SCENES[CTL_SCENES.length - 1];
  var until = target >= help.at ? CTL_TOTAL : target;

  // Timers created during the restart must not be armed: simAdvance() runs them
  simSeeking = true;
  try {
    simRestart();
  } finally {
    simSeeking = false;
  }
  simAdvance((until * 1000) / SIM_SPEED);

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

  var ended = ctlEnded();
  var active = document.querySelector('#phone .app.on');
  var activeId = ended ? 'aCta' : active ? active.id : '';
  var scene = null;
  CTL_SCENES.forEach(function (s) {
    if (s.app === activeId) scene = s;
  });
  // The help page has no pause button, so it never reads "paused"
  var paused = simPaused && !ended;
  var sceneEl = document.getElementById('ctlScene');
  if (sceneEl) {
    sceneEl.textContent = paused ? t('ctl.paused') : scene ? t(scene.key) : '';
    sceneEl.classList.toggle('paused', paused);
  }
  var btn = document.getElementById('pauseBtn');
  if (btn) {
    // Nothing to pause on the help page: the button stays in place, switched off.
    // A keyboard focus on it moves on to the timeline instead of getting lost.
    if (ended && !btn.disabled && document.activeElement === btn) seek.focus();
    btn.disabled = ended;
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
    // Left button, finger or pen only: a right or middle click must not jump
    if (e.button) return;
    ctlDragging = true;
    moved = false;
    downX = e.clientX;
    if (seek.setPointerCapture) seek.setPointerCapture(e.pointerId);
  });
  seek.addEventListener('pointermove', function (e) {
    if (!ctlSeekAllowed()) return;
    // The button was released where the page could not see it
    if (ctlDragging && e.buttons === 0) {
      dragLost();
      return;
    }
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
  // Leaving the window or the tab in the middle of a drag: the release may
  // never arrive, and a held simulation with a pause button that does nothing
  // would be a dead end
  window.addEventListener('blur', dragLost);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) dragLost();
  });
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
