/**
 * @file main.js
 * @description Entry point -- photo overlay construction, simulation start sequence,
 *   share functionality, and DOM-ready event binding.
 *   Loaded last; wires up all UI buttons and kicks off the scene chain.
 * @requires i18n.js           - t() for all UI text, applyI18n() for initial DOM translation
 * @requires audio.js          - initAudio(), simPaused, simTimers, togglePause(), bgMusic
 * @requires helpers.js        - mkPhoto-internal helpers (setLayer), toast()
 * @requires timer.js          - sec, tmr, tick(), startClock()
 * @requires firebase-counter.js - incrementCounters() (optional, checked with typeof)
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
        '<div class="e e2 e2-emoji-top">' + t('photo.emoji1') + '</div>' +
        '<div class="e e2 e2-text-look">' + t('photo.lookText') + '</div>' +
        '<div class="e e2 e2-poop">' + t('photo.poop') + '</div>' +
        '<div class="e e2 e2-ugly">' + t('photo.ugly') + '</div>' +
        '<div class="e e2 e2-never">' + t('photo.never') + '</div>' +
        // Layer 3: TikTok - Meme-Style, TikTok-typische Texte
        '<div class="e e3 e3-exposed">' + t('photo.exposed') + '</div>' +
        '<div class="e e3 e3-pov">' + t('photo.pov') + '</div>' +
        '<div class="e e3 e3-tags">' + t('photo.tags') + '</div>' +
        '<div class="e e3 e3-emoji-bot">' + t('photo.emojiBot') + '</div>' +
        '<div class="e e3 e3-bozo">' + t('photo.bozo') + '</div>' +
      '</div>' +
      '<div class="igfr" data-user="' + t('photo.igUser') + '" data-likes="' + t('photo.igLikes') + '"></div>' +
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
  document.getElementById('pauseBtn').textContent = t('ui.pause');
  document.getElementById('pauseOverlay').classList.add('hidden');
  document.getElementById('phone').classList.remove('hidden');
  mkPhoto(document.getElementById('igPh'));
  mkPhoto(document.getElementById('tkBg'));
  setLayer(1);
  initClock();
  setTimeout(function () {
    sec = 0;
    tmr = setInterval(tick, 100);
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
  var url = window.location.href;
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    navigator.share({
      title: t('share.title'),
      text: t('share.text'),
      url: url
    }).catch(function () {});
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
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // Show confirmation
  var toastEl = document.getElementById('toast');
  toastEl.classList.remove('hidden');
  toastEl.textContent = t('ui.linkCopied');
  toastEl.classList.add('show');
  simTimeout(function () { toastEl.classList.remove('show'); }, 2500);
}

// ========== DOM READY ==========
/**
 * DOMContentLoaded handler -- wires up all interactive elements:
 *   - Start button -> go()
 *   - Share buttons -> shareSimulation()
 *   - Replay button -> page reload
 *   - Pause button + overlay -> togglePause()
 *   - Impressum modal (open/close/backdrop/Escape)
 *   - Applies i18n translations to the initial DOM
 */
document.addEventListener('DOMContentLoaded', function () {
  bgMusic = document.getElementById('bgm');
  var impModal = document.getElementById('impModal');
  applyI18n();
  document.title = t('ui.title') + ' \u2013 ' + t('ui.subtitle');
  if (impModal) impModal.setAttribute('aria-label', t('imp.title'));

  // Append helpline logo disclaimer if a logo is configured
  var cfg = (typeof helplineConfig !== 'undefined') ? helplineConfig : {};
  if (cfg.logo) {
    var discEl = document.querySelector('.disclaimer');
    if (discEl) discEl.textContent += ' ' + t('disclaimer.helplineLogo');
  }

  function openImpressum() { impModal.classList.add('show'); }
  function closeImpressum() { impModal.classList.remove('show'); }

  // Start button
  var startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (bgMusic) {
        bgMusic.loop = true;
        bgMusic.volume = 0.4;
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

  // Replay button
  var replayBtn = document.getElementById('footerReplayBtn');
  if (replayBtn) replayBtn.addEventListener('click', function () { window.location.reload(); });

  // Pause
  var pauseBtn = document.getElementById('pauseBtn');
  var pauseOverlay = document.getElementById('pauseOverlay');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (pauseOverlay) pauseOverlay.addEventListener('click', togglePause);

  // Impressum links
  var impLinkGlobal = document.getElementById('impLinkGlobal');
  var impCloseBtn = document.getElementById('impCloseBtn');
  if (impLinkGlobal) impLinkGlobal.addEventListener('click', openImpressum);
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
