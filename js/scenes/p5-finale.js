/**
 * @file p5-finale.js
 * @description Scene 5+6: Finale in two parts.
 *   P5: Dramatic text reveal on black screen -- statements appear one at a time.
 *   P6: Help call-to-action with share/replay buttons and view counter.
 * @requires audio.js   - simTimeout()
 * @requires helpers.js  - sw()
 * @requires i18n.js     - text content is in the HTML, not injected here
 */

// ===== P5: DRAMATIC TEXT (112-130s) =====

/**
 * Runs the dramatic text sequence. Each statement fades in after a deliberate
 * pause to let the previous line sink in. After all lines are shown,
 * transitions to the CTA page (p6).
 */
function p5() {
  document.getElementById('toast').classList.add('hidden');

  // 2s of black silence before any text appears
  simTimeout(function () {
    document.getElementById('fA').classList.add('show');
  }, 2000);

  // Each subsequent line appears after a multi-second pause
  simTimeout(function () {
    document.getElementById('fB').classList.add('show');
  }, 5500);

  simTimeout(function () {
    document.getElementById('fC').classList.add('show');
  }, 8500);

  // "Auch nachts." lands separately for emphasis
  simTimeout(function () {
    document.getElementById('fC2').classList.add('show');
  }, 11500);

  simTimeout(function () {
    document.getElementById('fE').classList.add('show');
  }, 15500);

  // Transition to fullscreen CTA page
  simTimeout(function () {
    p6();
  }, 20000);
}

// ===== P6: HELP CTA + BUTTONS =====

/**
 * Runs the call-to-action page with help message, share/replay buttons
 * and the view counter. Fades in the help text after a brief pause.
 */
function p6() {
  // Hide phone frame and pause button — CTA page is fullscreen
  document.getElementById('phone').classList.add('hidden');
  document.getElementById('pauseBtn').classList.add('hidden');

  // Show disclaimer again on CTA page
  var disc = document.querySelector('.disclaimer');
  if (disc) disc.classList.remove('hidden');

  // Populate helpline from config (logo, slogan, link)
  var cfg = (typeof helplineConfig !== 'undefined') ? helplineConfig : {};
  var logoEl = document.getElementById('ctaLogo');
  var helplineEl = document.getElementById('ctaHelpline');

  // Link icon SVG is a static constant — the only innerHTML sink here.
  // All operator-controlled strings (logo, labels, hrefs) go through
  // DOM APIs (textContent / setAttribute) so a fork with quotes or
  // angle brackets in helplineConfig cannot break or inject markup.
  var linkIconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  if (cfg.logo && logoEl) {
    logoEl.href = cfg.link || '#';
    var img = document.createElement('img');
    img.src = cfg.logo;
    img.alt = cfg.logoAlt || '';
    logoEl.appendChild(img);
    logoEl.classList.remove('hidden');
  }

  function buildCtaLink(href, label) {
    var a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    var icon = document.createElement('span');
    icon.innerHTML = linkIconSvg;
    a.appendChild(icon);
    a.appendChild(document.createTextNode(' ' + label));
    return a;
  }

  var linksEl = document.getElementById('ctaLinks');
  if (linksEl) {
    if (cfg.linkLabel && cfg.link) {
      linksEl.appendChild(buildCtaLink(cfg.link, cfg.linkLabel));
    }
    if (cfg.infoLink) {
      var label = (currentLang === 'en' && cfg.infoLabelEn) ? cfg.infoLabelEn : (cfg.infoLabel || '');
      linksEl.appendChild(buildCtaLink(cfg.infoLink, label));
    }
  }

  if (cfg.slogan && helplineEl) {
    helplineEl.textContent = (currentLang === 'en' && cfg.sloganEn) ? cfg.sloganEn : cfg.slogan;
  }

  // Show CTA fullscreen
  document.getElementById('aCta').classList.remove('hidden');

  // Staggered fade-in (CSS transition-delay handles timing)
  simTimeout(function () {
    if (cfg.logo) logoEl.classList.add('show');
    if (linksEl) linksEl.classList.add('show');
    helplineEl.classList.add('show');
    document.getElementById('ctaMsg').classList.add('show');
  }, 500);
}
