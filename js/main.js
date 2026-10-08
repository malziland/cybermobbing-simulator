/**
 * @file main.js
 * @description Entry point -- photo overlay construction, simulation start sequence,
 *   share functionality, and DOM-ready event binding.
 *   Loaded last; wires up all UI buttons and kicks off the scene chain.
 * @requires i18n.js           - t() for all UI text, applyI18n() for initial DOM translation
 * @requires audio.js          - initAudio(), simPaused, simTimers, togglePause(), bgMusic,
 *                               applyVolume(), setVolume(), toggleMute()
 * @requires helpers.js        - mkPhoto-internal helpers (setLayer), toast()
 * @requires timer.js          - sec, tmr, tick(), startClock()
 * @requires firebase-counter.js - incrementCounters() (optional, checked with typeof)
 * @requires stage.js          - projector view: stageInit(), stageSet(), stageToggle(), stageUrl()
 * @requires scenes/p1-whatsapp.js - p1() scene entry
 */

// ========== PHOTO OVERLAY ==========

/**
 * Builds a 3-layer photo overlay inside the given element.
 * The layers represent progressive defacement of Tom's photo:
 *   - Layer 1 (real-photo): the original unedited photo (always visible)
 *   - Layer 2 (.e2): Instagram-style edits -- mean emojis, hurtful text overlays
 *   - Layer 3 (.e3 + .igfr + .grain): TikTok-style additions -- meme captions,
 *     Instagram frame, and film grain filter
 * Layer visibility is controlled separately by setLayer().
 * @param {HTMLElement} el - Container element to populate
 * @param {string} [h='100%'] - CSS height for the container
 */
function mkPhoto(el, h) {
  el.style.height = h || '100%';
  el.innerHTML =
    '<div class="photo-wrap">' +
    '<div class="real-photo"></div>' +
    '<div class="edits">' +
    // Layer 2: Instagram - typische Insta-Story Bearbeitungen
    '<div class="e e2 e2-emoji-top">' +
    t('photo.emoji1') +
    '</div>' +
    '<div class="e e2 e2-text-look">' +
    t('photo.lookText') +
    '</div>' +
    '<div class="e e2 e2-poop">' +
    t('photo.poop') +
    '</div>' +
    '<div class="e e2 e2-ugly">' +
    t('photo.ugly') +
    '</div>' +
    '<div class="e e2 e2-never">' +
    t('photo.never') +
    '</div>' +
    // Layer 3: TikTok - Meme-Style, TikTok-typische Texte
    '<div class="e e3 e3-exposed">' +
    t('photo.exposed') +
    '</div>' +
    '<div class="e e3 e3-pov">' +
    t('photo.pov') +
    '</div>' +
    '<div class="e e3 e3-tags">' +
    t('photo.tags') +
    '</div>' +
    '<div class="e e3 e3-emoji-bot">' +
    t('photo.emojiBot') +
    '</div>' +
    '<div class="e e3 e3-bozo">' +
    t('photo.bozo') +
    '</div>' +
    '</div>' +
    '<div class="igfr" data-user="' +
    t('photo.igUser') +
    '" data-likes="' +
    t('photo.igLikes') +
    '"></div>' +
    '<div class="grain"></div>' +
    '</div>';
}

// ========== START ==========

/**
 * Simulation initialization sequence. Called when the user clicks the start button.
 * Resets pause state and timers, increments the Firebase view counter (if available),
 * hides the start screen, shows the phone UI, builds the photo overlays for
 * Instagram and TikTok scenes, then after a brief delay starts the progress bar,
 * phone clock, and the first scene (p1 WhatsApp).
 */
var simStarted = false;
function go() {
  if (simStarted) return; // Guard against double-click
  simStarted = true;
  initAudio();
  simPaused = false;
  simTimers = [];
  if (typeof incrementCounters === 'function') incrementCounters();
  document.getElementById('start').classList.add('gone');
  var disc = document.querySelector('.disclaimer');
  if (disc) disc.classList.add('hidden');
  document.getElementById('pauseBtn').classList.remove('hidden');
  document.getElementById('phone').classList.remove('hidden');
  mkPhoto(document.getElementById('igPh'));
  mkPhoto(document.getElementById('tkBg'));
  setLayer(1);
  initClock();
  // simTimeout (not native setTimeout) so the start delay is pausable and
  // clearable via simTimers like every other scheduled scene step
  simTimeout(function () {
    sec = 0;
    // A pause and resume during this start delay has already started both
    // intervals (togglePause); without clearing them the clock would run twice
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
    tmr = setInterval(tick, 100 / SIM_SPEED);
    startClock();
    p1();
  }, 500);
}

// ========== SHARE ==========

/**
 * Shares the simulation URL. On mobile devices with Web Share API support,
 * opens the native share sheet. On desktop, copies the URL to the clipboard
 * (with a textarea fallback for HTTP contexts where navigator.clipboard is unavailable)
 * and shows a confirmation toast.
 */
function shareSimulation() {
  // Never pass on the projector switch: a shared link should open the phone view
  var url = stageUrl(window.location.href, false);
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    navigator
      .share({
        title: t('share.title'),
        text: t('share.text'),
        url: url,
      })
      .catch(function () {});
    return;
  }

  // Desktop: Clipboard API with textarea fallback for HTTP
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).catch(function () {});
  } else {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.className = 'sr-only-input';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
  }

  // Show confirmation
  var toastEl = document.getElementById('toast');
  toastEl.classList.remove('hidden');
  toastEl.textContent = t('ui.linkCopied');
  toastEl.classList.add('show');
  simTimeout(function () {
    toastEl.classList.remove('show');
  }, 2500);
}

// ========== DOM READY ==========
/**
 * DOMContentLoaded handler -- wires up all interactive elements:
 *   - Start button -> go()
 *   - Share buttons -> shareSimulation()
 *   - Replay button -> page reload
 *   - Pause button -> togglePause()
 *   - Projector view pickers (start screen, in-run) and B key -> stageSet() / stageToggle()
 *   - Sound control (mute button, volume slider, M key) -> toggleMute() / setVolume()
 *   - Impressum modal (open/close/backdrop/Escape)
 *   - Applies i18n translations to the initial DOM
 */
document.addEventListener('DOMContentLoaded', function () {
  bgMusic = document.getElementById('bgm');
  var impModal = document.getElementById('impModal');
  applyI18n();
  // Keep the brand suffix from the static SEO title (index.html) when
  // swapping in the localized runtime title (BIZ-01)
  document.title = t('ui.title') + ' \u2013 ' + t('ui.subtitle') + ' | malziland';
  if (impModal) impModal.setAttribute('aria-label', t('imp.title'));

  // Append helpline logo disclaimer if a logo is configured
  var cfg = typeof helplineConfig !== 'undefined' ? helplineConfig : {};
  if (cfg.logo) {
    var discEl = document.querySelector('.disclaimer');
    if (discEl) discEl.textContent += ' ' + t('disclaimer.helplineLogo');
  }

  // During the run the legal notice pauses the simulation and lets it continue
  // when it is closed -- unless the simulation was already paused before.
  var impPausedSim = false;
  function openImpressum() {
    var phone = document.getElementById('phone');
    var running = simStarted && !!phone && !phone.classList.contains('hidden');
    if (running && !simPaused && !impModal.classList.contains('show')) {
      togglePause();
      impPausedSim = simPaused;
    }
    // The legal notice is drawn as a phone too. Its status bar shows the time
    // of the phone in the simulation, or the real time outside the run.
    var impTime = document.getElementById('impTime');
    var simTime = document.getElementById('sbTime');
    if (impTime) {
      var now = new Date();
      impTime.textContent =
        running && simTime && simTime.textContent
          ? simTime.textContent
          : formatTime(now.getHours(), now.getMinutes());
    }
    impModal.classList.add('show');
  }
  function closeImpressum() {
    impModal.classList.remove('show');
    if (impPausedSim) {
      impPausedSim = false;
      if (simPaused) togglePause();
    }
  }

  // Start button
  var startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (bgMusic) {
        bgMusic.loop = true;
        applyVolume();
        bgMusic.play().catch(function () {});
      }
      go();
    });
  }

  // Share buttons
  var startShareBtn = document.getElementById('startShareBtn');
  var footerShareBtn = document.getElementById('footerShareBtn');
  if (startShareBtn) startShareBtn.addEventListener('click', shareSimulation);
  if (footerShareBtn) footerShareBtn.addEventListener('click', shareSimulation);

  // The disclaimer at the bottom wraps onto up to five lines in narrow windows.
  // Start screen and help page keep exactly its measured height free
  // (--disc-h in css/styles.css), so nothing slides underneath it.
  var discEl = document.querySelector('.disclaimer');
  function discRoom() {
    var h = discEl ? discEl.offsetHeight : 0;
    if (h > 0) document.documentElement.style.setProperty('--disc-h', h + 'px');
  }
  discRoom();
  window.addEventListener('resize', discRoom);
  if (discEl && typeof ResizeObserver !== 'undefined') new ResizeObserver(discRoom).observe(discEl);

  // Replay button
  var replayBtn = document.getElementById('footerReplayBtn');
  if (replayBtn)
    replayBtn.addEventListener('click', function () {
      window.location.reload();
    });

  // Projector view (ADR-0007): the two view pickers (start screen and in-run),
  // the B key and the link suffix ?beamer=1. The choice is kept in the address
  // bar only. Every picker button carries data-view="phone" or "beamer".
  ctlInit();
  stageInit();
  stageSet(stageFromUrl(window.location.search));
  var viewLabels = { phone: t('ui.viewPhoneLong'), beamer: t('ui.viewBeamerLong') };
  var viewGroups = document.querySelectorAll('.view-pick, .ctl-view');
  for (var g = 0; g < viewGroups.length; g++) {
    viewGroups[g].setAttribute('aria-label', t('ui.viewLabel'));
  }
  var viewButtons = document.querySelectorAll('[data-view]');
  for (var v = 0; v < viewButtons.length; v++) {
    viewButtons[v].setAttribute('aria-label', viewLabels[viewButtons[v].getAttribute('data-view')]);
    viewButtons[v].addEventListener('click', function () {
      stageSet(this.getAttribute('data-view') === 'beamer');
      stageRemember();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'b' && e.key !== 'B') return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (impModal && impModal.classList.contains('show')) return;
    // No projector view in a narrow window, so nothing to switch
    if (!stageFits()) return;
    stageToggle();
    stageRemember();
  });

  // Sound control: mute button, volume slider and the M key
  var soundGroup = document.querySelector('.ctl-sound');
  var soundBtn = document.getElementById('soundBtn');
  var volSlider = document.getElementById('volSlider');
  if (soundGroup) soundGroup.setAttribute('aria-label', t('ui.sound'));
  if (soundBtn) soundBtn.addEventListener('click', toggleMute);
  if (volSlider) {
    volSlider.setAttribute('aria-label', t('ui.volume'));
    volSlider.addEventListener('input', function () {
      setVolume(this.value / 100);
    });
  }
  applyVolume();
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (impModal && impModal.classList.contains('show')) return;
    toggleMute();
  });

  // Pause
  var pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

  // Impressum links
  var impCloseBtn = document.getElementById('impCloseBtn');
  // Two links open the legal notice: the one below start and help screen,
  // and the one inside the control bar during the run
  ['impLinkGlobal', 'impLinkRun'].forEach(function (id) {
    var link = document.getElementById(id);
    if (!link) return;
    link.addEventListener('click', openImpressum);
    // span[role=button] gets no synthetic click on Enter/Space like a real
    // <button> does -- required for keyboard operability (WCAG 2.1.1)
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openImpressum();
      }
    });
  });
  if (impCloseBtn) impCloseBtn.addEventListener('click', closeImpressum);

  // Impressum modal: close on backdrop click and Escape key
  if (impModal) {
    impModal.addEventListener('click', function (e) {
      if (e.target === impModal) closeImpressum();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && impModal.classList.contains('show')) closeImpressum();
    });
  }
});
