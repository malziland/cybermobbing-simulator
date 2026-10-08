/**
 * @file stage.js
 * @description Projector view ("Beamer-Ansicht", see docs/adr/ADR-0007).
 *   A second, large rendering of the running simulation for projectors and
 *   big rooms. The phone stays the single source of truth: this file only
 *   watches what the scenes put into the phone and mirrors it at reading
 *   size. Scenes and their timing are not touched, so both views always show
 *   the same run and can be switched at any time without a jump.
 *   The stage is kept up to date even while it is not shown; switching views
 *   is therefore a pure CSS change (body classes set in stageSync()).
 *   In the projector view the phone itself stays visible at the left edge.
 * @requires main.js - mkPhoto() (only called at init time, defined by then)
 */

// ========== STATE ==========

/** @type {number} Messages shown large at the same time (inclusive) */
var STAGE_MAX_ITEMS = 2;

/** @type {number} Homescreen notifications shown at the same time (inclusive) */
var STAGE_MAX_NOTIFS = 3;

/** @type {number} Height of the phone next to the stage, in stage units (1% of stage width) */
var STAGE_PHONE_H = 49;

/** @type {number} Height of the phone frame in CSS pixels (must match .phone in styles.css) */
var STAGE_PHONE_PX = 852;

/** @type {boolean} True while the projector view is selected */
var stageWanted = false;

// ========== SWITCHING ==========

/**
 * Reads the projector switch from a query string. Only the exact value
 * `beamer=1` switches it on; the value itself is never written to the DOM.
 * @param {string} search - Query string, e.g. window.location.search
 * @returns {boolean} True if the projector view is requested
 */
function stageFromUrl(search) {
  return /[?&]beamer=1(&|$)/.test(search || '');
}

/**
 * Returns `href` with the projector parameter added or removed. All other
 * parameters and the hash are kept. Used to remember the choice in the
 * address bar (no localStorage) and to share the link without it.
 * @param {string}  href - Full URL
 * @param {boolean} on   - Whether the result should carry `beamer=1`
 * @returns {string} The adjusted URL
 */
function stageUrl(href, on) {
  var hashAt = href.indexOf('#');
  var hash = hashAt === -1 ? '' : href.slice(hashAt);
  var base = hashAt === -1 ? href : href.slice(0, hashAt);
  var queryAt = base.indexOf('?');
  var path = queryAt === -1 ? base : base.slice(0, queryAt);
  var params = (queryAt === -1 ? '' : base.slice(queryAt + 1)).split('&').filter(function (p) {
    return p && p.split('=')[0] !== 'beamer';
  });
  if (on) params.push('beamer=1');
  return path + (params.length ? '?' + params.join('&') : '') + hash;
}

/**
 * Writes the current choice to the address bar so that "replay" (a reload)
 * and bookmarks keep it. Fails silently where history is unavailable.
 */
function stageRemember() {
  try {
    history.replaceState(null, '', stageUrl(window.location.href, stageWanted));
  } catch (e) {}
}

/**
 * Fits the phone next to the stage. The phone keeps its fixed pixel size and
 * is scaled to STAGE_PHONE_H stage units. CSS cannot divide one length by
 * another, so the factor is computed here from the same formula the CSS uses
 * for --u and handed over as a custom property.
 */
function stageFit() {
  var unit = Math.min(window.innerWidth / 100, window.innerHeight / 56.25);
  document.documentElement.style.setProperty(
    '--st-phone-k',
    String((STAGE_PHONE_H * unit) / STAGE_PHONE_PX)
  );
}

/**
 * Applies the current state to the page: body classes for the CSS and the
 * pressed state of every view button (elements with data-view="phone" or
 * data-view="beamer"). The stage is "live" (visible) only while the
 * projector view is selected AND the phone phase is running, i.e. not on the
 * start screen and not on the final help screen.
 */
function stageSync() {
  var phone = document.getElementById('phone');
  var running = !!phone && !phone.classList.contains('hidden');
  document.body.classList.toggle('beamer', stageWanted);
  document.body.classList.toggle('stage-live', stageWanted && running);
  var buttons = document.querySelectorAll('[data-view]');
  for (var i = 0; i < buttons.length; i++) {
    var isBeamer = buttons[i].getAttribute('data-view') === 'beamer';
    buttons[i].setAttribute('aria-pressed', isBeamer === stageWanted ? 'true' : 'false');
  }
  stageFit();
}

/**
 * Selects or deselects the projector view.
 * @param {boolean} on - True for the projector view, false for the phone view
 */
function stageSet(on) {
  stageWanted = !!on;
  stageSync();
}

/** Switches between projector view and phone view. */
function stageToggle() {
  stageSet(!stageWanted);
}

// ========== BUILDING BLOCKS ==========

/**
 * Returns the inner HTML of a phone element without the given child
 * elements (time stamps, avatars ...). The source is always markup the
 * scenes built from the app's own i18n strings.
 * @param {Element}  node - Element in the phone
 * @param {string[]} drop - Selectors of children to leave out
 * @returns {string} Trimmed inner HTML
 */
function stageInner(node, drop) {
  var copy = node.cloneNode(true);
  drop.forEach(function (sel) {
    var hits = copy.querySelectorAll(sel);
    for (var i = 0; i < hits.length; i++) hits[i].parentNode.removeChild(hits[i]);
  });
  return copy.innerHTML.replace(/^\s+|\s+$/g, '');
}

/**
 * Builds a large message bubble.
 * @param {string} cls       - App-specific CSS class(es), e.g. 'st-wa-b'
 * @param {string} name      - Sender as HTML ('' for none)
 * @param {string} body      - Message as HTML
 * @param {string} [nameCls] - Extra class(es) for the name (colour)
 * @returns {HTMLElement} The bubble, ready for stagePush()
 */
function stageBubble(cls, name, body, nameCls) {
  var d = document.createElement('div');
  d.className = 'st-item st-b ' + cls;
  d.innerHTML =
    (name ? '<div class="st-name' + (nameCls ? ' ' + nameCls : '') + '">' + name + '</div>' : '') +
    '<div class="st-text">' +
    body +
    '</div>';
  return d;
}

/**
 * Adds an item to a stage list. Earlier items are dimmed; when more than
 * `max` are live, the oldest fades out. A faded item stays in the DOM until
 * the next push (it sits invisibly above the live ones), so no timer is
 * needed and pausing cannot leave the list in a wrong state.
 * @param {Element} list - Stage list (.st-list)
 * @param {Element} item - New item (carries class st-item)
 * @param {number}  max  - Live items allowed at the same time (inclusive)
 */
function stagePush(list, item, max) {
  var i;
  var faded = list.querySelectorAll('.st-item.out');
  for (i = 0; i < faded.length; i++) list.removeChild(faded[i]);
  var items = list.querySelectorAll('.st-item');
  for (i = 0; i < items.length; i++) items[i].classList.add('old');
  // A typing indicator, if present, always stays below the newest message
  list.insertBefore(item, list.querySelector('.st-typing'));
  items = list.querySelectorAll('.st-item');
  for (i = 0; i < items.length - max; i++) items[i].classList.add('out');
}

/**
 * Shows or removes the typing indicator (three dots) at the end of a list.
 * It is not a message and does not use up a slot.
 * @param {Element} list - Stage list
 * @param {boolean} on   - True to show, false to remove
 * @param {string}  cls  - App-specific CSS class
 */
function stageTyping(list, on, cls) {
  var current = list.querySelector('.st-typing');
  if (current) list.removeChild(current);
  if (!on) return;
  var d = document.createElement('div');
  d.className = 'st-typing ' + cls;
  d.innerHTML = '<i></i><i></i><i></i>';
  list.appendChild(d);
}

/**
 * Copies the text of a phone element (counter, clock ...) to the stage.
 * @param {string} srcId - Element ID in the phone
 * @param {string} dstId - Element ID on the stage
 */
function stageMirror(srcId, dstId) {
  var src = document.getElementById(srcId);
  var dst = document.getElementById(dstId);
  if (src && dst) dst.textContent = src.textContent;
}

/**
 * Copies only the first number of a phone element's text to the stage, so
 * counters look the same in every app ("191 likes" becomes "191").
 * @param {string} srcId - Element ID in the phone
 * @param {string} dstId - Element ID on the stage
 */
function stageMirrorNumber(srcId, dstId) {
  var src = document.getElementById(srcId);
  var dst = document.getElementById(dstId);
  if (!src || !dst) return;
  var match = /\d[\d.,]*k?/.exec(src.textContent);
  dst.textContent = match ? match[0] : '0';
}

/**
 * Shows the stage panel that belongs to the active phone app.
 * @param {string} appId - ID of the active .app element, e.g. 'aIg'
 */
function stageShowApp(appId) {
  var panels = document.querySelectorAll('#stage .st-scene');
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.toggle('on', panels[i].getAttribute('data-app') === appId);
  }
}

// ========== ONE HANDLER PER SOURCE ==========

/**
 * WhatsApp chat: photo message, text messages, sticker, typing indicator
 * and the "left the group" system line.
 * @param {Node}    node  - Node added to or removed from #wC
 * @param {boolean} added - True if added, false if removed
 */
function stageOnWa(node, added) {
  if (!node.classList) return;
  var list = document.getElementById('stWaList');
  if (node.classList.contains('wa-typ')) {
    stageTyping(list, added, 'st-wa-b');
    return;
  }
  if (!added) return;
  var who = node.querySelector('.who');
  if (node.classList.contains('wm-photo')) {
    document.getElementById('stWaMedia').classList.add('on');
    stagePush(
      list,
      stageBubble(
        'st-wa-b',
        who.innerHTML,
        stageInner(node.querySelector('.cap'), ['.meta']),
        who.className
      ),
      STAGE_MAX_ITEMS
    );
  } else if (node.classList.contains('wm-sticker')) {
    var sticker = document.createElement('div');
    sticker.className = 'st-item st-sticker';
    sticker.innerHTML = stageInner(node, ['.meta']);
    stagePush(list, sticker, STAGE_MAX_ITEMS);
  } else if (node.classList.contains('wm')) {
    stagePush(
      list,
      stageBubble(
        'st-wa-b',
        who ? who.innerHTML : '',
        stageInner(node, ['.who', '.meta']),
        who ? who.className : ''
      ),
      STAGE_MAX_ITEMS
    );
  } else if (node.classList.contains('wa-sys')) {
    // Own row below the list: must not push a message out
    var sys = document.getElementById('stWaSys');
    sys.textContent = node.textContent;
    sys.classList.add('show');
  }
}

/**
 * Instagram comments.
 * @param {Node} node - Node added to #igCm
 */
function stageOnIg(node) {
  if (!node.classList || !node.classList.contains('ig-c')) return;
  var avatar = node.querySelector('.av-circle');
  var user = node.querySelector('b');
  stagePush(
    document.getElementById('stIgList'),
    stageBubble(
      'st-ig-b' + (node.classList.contains('vic') ? ' vic' : ''),
      (avatar ? avatar.outerHTML : '') + (user ? user.innerHTML : ''),
      stageInner(node, ['.ig-av-inline', 'b'])
    ),
    STAGE_MAX_ITEMS
  );
}

/** Instagram heart: turns red as soon as the phone's heart is filled. */
function stageOnHeart() {
  var src = document.getElementById('igH');
  var dst = document.getElementById('stIgHeart');
  if (!src || !dst) return;
  var fill = src.getAttribute('fill');
  dst.classList.toggle('on', !!fill && fill !== 'none');
}

/**
 * TikTok comments, including the sticker comment.
 * @param {Node} node - Node added to #tkCl
 */
function stageOnTk(node) {
  if (!node.classList || !node.classList.contains('tc')) return;
  var avatar = node.querySelector('.av-circle');
  var user = node.querySelector('.nm');
  var text = node.querySelector('.tx');
  var sticker = node.querySelector('.tk-sticker-wrap');
  stagePush(
    document.getElementById('stTkList'),
    stageBubble(
      'st-tk-b' + (node.classList.contains('vic') ? ' vic' : ''),
      (avatar ? avatar.outerHTML : '') + (user ? user.innerHTML : ''),
      text ? text.innerHTML : sticker ? sticker.outerHTML : ''
    ),
    STAGE_MAX_ITEMS
  );
}

/**
 * TikTok "your report is being reviewed" notice.
 * @param {Node} node - Node added to the TikTok app layer
 */
function stageOnTkReport(node) {
  if (!node.classList || !node.classList.contains('tk-rpt')) return;
  var dst = document.getElementById('stTkRpt');
  dst.textContent = node.textContent;
  dst.classList.add('show');
}

/**
 * Homescreen push notifications.
 * @param {Node} node - Node added to #hsN
 */
function stageOnHs(node) {
  if (!node.classList || !node.classList.contains('hs-n')) return;
  var item = document.createElement('div');
  item.className = 'st-item st-notif';
  item.innerHTML = node.innerHTML;
  stagePush(document.getElementById('stHsList'), item, STAGE_MAX_NOTIFS);
}

/**
 * Messages app: bubbles and Tom's hesitating typing indicator.
 * @param {Node}    node  - Node added to or removed from #imC
 * @param {boolean} added - True if added, false if removed
 */
function stageOnIm(node, added) {
  if (!node.classList) return;
  var list = document.getElementById('stImList');
  if (node.classList.contains('im-typ')) {
    stageTyping(list, added, 'st-im-typ');
    return;
  }
  if (!added || !node.classList.contains('im-bub')) return;
  var kind = node.classList.contains('received')
    ? 'received'
    : node.classList.contains('vic')
      ? 'vic'
      : 'sent';
  stagePush(list, stageBubble('st-im-b ' + kind, '', node.innerHTML), STAGE_MAX_ITEMS);
}

/**
 * Notices ("... took a screenshot"): shown in their own row for as long as
 * the phone's toast is shown.
 */
function stageOnToast() {
  var src = document.getElementById('toast');
  var dst = document.getElementById('stNote');
  if (!src || !dst) return;
  if (src.classList.contains('show') && !src.classList.contains('hidden')) {
    dst.textContent = src.textContent;
    dst.classList.add('show');
  } else {
    dst.classList.remove('show');
  }
}

/** Finale: each line appears on the stage when it appears in the phone. */
function stageOnFinale() {
  [
    ['fA', 'stFA'],
    ['fB', 'stFB'],
    ['fC', 'stFC'],
    ['fC2', 'stFC2'],
    ['fE', 'stFE'],
  ].forEach(function (pair) {
    var src = document.getElementById(pair[0]);
    var dst = document.getElementById(pair[1]);
    if (src && dst) dst.classList.toggle('show', src.classList.contains('show'));
  });
}

/** Follows the phone's scene switches (sw() in helpers.js). */
function stageOnApp() {
  var active = document.querySelector('#phone .app.on');
  if (active) stageShowApp(active.id);
}

// ========== WIRING ==========

/**
 * Calls `fn(node, added)` for every node added to or removed from the
 * element, in the order the changes happened.
 * @param {string}   id - Element ID to watch
 * @param {Function} fn - Handler
 */
function stageWatchNodes(id, fn) {
  var el = document.getElementById(id);
  if (!el) return;
  new MutationObserver(function (records) {
    records.forEach(function (r) {
      var i;
      for (i = 0; i < r.removedNodes.length; i++) fn(r.removedNodes[i], false);
      for (i = 0; i < r.addedNodes.length; i++) fn(r.addedNodes[i], true);
    });
  }).observe(el, { childList: true });
}

/**
 * Keeps a stage element in step with the text of a phone element.
 * @param {string}   srcId  - Element ID in the phone
 * @param {string}   dstId  - Element ID on the stage
 * @param {Function} [copy] - stageMirror (default) or stageMirrorNumber
 */
function stageWatchText(srcId, dstId, copy) {
  var src = document.getElementById(srcId);
  if (!src) return;
  var fn = copy || stageMirror;
  fn(srcId, dstId);
  new MutationObserver(function () {
    fn(srcId, dstId);
  }).observe(src, { childList: true, characterData: true, subtree: true });
}

/**
 * Builds the stage photos and connects every phone element the stage
 * mirrors. Called once after the DOM is ready (main.js). Does nothing if
 * the page has no stage.
 */
function stageInit() {
  if (!document.getElementById('stage') || typeof MutationObserver === 'undefined') return;

  // Same layered photo as in the phone; setLayer() switches all copies at once
  ['stWaPh', 'stIgPh', 'stTkPh'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) mkPhoto(el);
  });

  stageWatchNodes('wC', stageOnWa);
  stageWatchNodes('igCm', function (node, added) {
    if (added) stageOnIg(node);
  });
  stageWatchNodes('tkCl', function (node, added) {
    if (added) stageOnTk(node);
  });
  stageWatchNodes('aTk', function (node, added) {
    if (added) stageOnTkReport(node);
  });
  stageWatchNodes('hsN', function (node, added) {
    if (added) stageOnHs(node);
  });
  stageWatchNodes('imC', stageOnIm);

  // Counters in the head row show the bare number, the same way in every app
  stageWatchText('igLk', 'stIgLk', stageMirrorNumber);
  stageWatchText('igCc', 'stIgCn', stageMirrorNumber);

  [
    ['igCc', 'stIgCc'],
    ['igVw', 'stIgVw'],
    ['tkLk', 'stTkLk'],
    ['tkCm', 'stTkCm'],
    ['tkSh', 'stTkSh'],
    ['hsClock', 'stHsClock'],
    ['hsDate', 'stHsDate'],
    ['xW', 'stXW'],
    ['xI', 'stXI'],
    ['xT', 'stXT'],
    ['xN', 'stXN'],
    ['xS', 'stXS'],
  ].forEach(function (pair) {
    stageWatchText(pair[0], pair[1]);
  });

  var classChange = { attributes: true, attributeFilter: ['class'] };

  var heart = document.getElementById('igH');
  if (heart) {
    new MutationObserver(stageOnHeart).observe(heart, {
      attributes: true,
      attributeFilter: ['fill'],
    });
  }

  var toastEl = document.getElementById('toast');
  if (toastEl) {
    new MutationObserver(stageOnToast).observe(toastEl, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  var finale = document.getElementById('aFn');
  if (finale) {
    new MutationObserver(stageOnFinale).observe(finale, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
  }

  var apps = document.querySelectorAll('#phone .app');
  for (var i = 0; i < apps.length; i++) {
    new MutationObserver(stageOnApp).observe(apps[i], classChange);
  }

  // Start and end of the phone phase decide whether the stage is visible
  var phone = document.getElementById('phone');
  if (phone) new MutationObserver(stageSync).observe(phone, classChange);

  // The phone beside the stage is scaled by script, so follow window changes
  window.addEventListener('resize', stageFit);
}
