/**
 * @file helpers.js
 * @description Character avatar system and shared UI helper functions.
 *   Provides avatar rendering for all simulation characters, scene transitions,
 *   visual effects (flash, toast), chat message builders, and photo layer control.
 * @requires i18n.js  - t() for localized strings (not directly used here, but callers pass translated text)
 * @requires audio.js - typStart(), typStop(), sndWa() used by waType()
 */

// ========== CHARACTER AVATARS ==========

/**
 * Lookup table mapping usernames to [initials, CSS class] pairs.
 * Multiple usernames can map to the same character (e.g. 'marco' and 'marco_2012').
 * @type {Object<string, [string, string]>}
 */
var avatars = {
  'marco': ['MA','av-marco'], 'marco_2012': ['MA','av-marco'],
  'sara': ['SA','av-sara'], 'sara.xoxo': ['SA','av-sara'], 'sara_2012': ['SA','av-sara'],
  'tim': ['TI','av-tim'], 'tim_0711': ['TI','av-tim'],
  'leon': ['LE','av-leon'], 'leon_fcb': ['LE','av-leon'],
  'tom': ['TO','av-tom'], 'tom.m': ['TO','av-tom'],
  'lukas': ['LU','av-lukas'], 'lukas.der.echte': ['LU','av-lukas'], 'xxl.lukas': ['LU','av-xxl'],
  'noah.x': ['NO','av-noah'],
  'anon99': ['AN','av-anon'],
  'aggro.44': ['AG','av-aggro'],
  'troll.page': ['TR','av-troll'],
  'hype.page': ['HP','av-hype']
};

/**
 * Returns an HTML string for a character's circular avatar badge.
 * Falls back to a generic anonymous avatar ('??') for unknown usernames.
 * @param {string}  username - Key into the avatars lookup table
 * @param {boolean} [big]    - If truthy, adds 'av-big' class for larger display
 * @returns {string} HTML div with initials and character-specific CSS class
 */
function getAvatar(username, big) {
  var a = avatars[username] || ['??','av-anon'];
  return '<div class="av-circle ' + a[1] + (big ? ' av-big' : '') + '">' + a[0] + '</div>';
}

// ========== UI HELPERS ==========

/**
 * Scene switcher with CSS transitions. Fades out the current scene and fades
 * in the next one. The outgoing element gets 'off' for 500ms (exit animation)
 * before being fully removed from view.
 * @param {string} a - ID of the element to hide (outgoing scene)
 * @param {string} b - ID of the element to show (incoming scene)
 */
function sw(a, b) {
  var ea = document.getElementById(a);
  var eb = document.getElementById(b);
  ea.classList.add('off');
  ea.classList.remove('on');
  eb.classList.add('on');
  // Remove 'off' class after the CSS transition completes
  setTimeout(function () { ea.classList.remove('off'); }, 500);
}

/**
 * Triggers a full-screen camera flash effect (white overlay that fades out).
 * Uses the reflow trick (void offsetWidth) to restart the CSS animation
 * even if it was already playing.
 */
function flash() {
  var f = document.getElementById('fl');
  f.classList.remove('go');
  void f.offsetWidth;           // Force reflow to restart animation
  f.classList.add('go');
}

/**
 * Shows a brief notification toast at the top of the phone screen.
 * @param {string} txt     - Message text to display
 * @param {number} [dur=2500] - Duration in ms before auto-hiding
 */
function toast(txt, dur) {
  var t = document.getElementById('toast');
  t.textContent = txt;
  t.classList.add('show');
  simTimeout(function () { t.classList.remove('show'); }, dur || 2500);
}

/**
 * Appends a chat message bubble to a container and auto-scrolls to bottom.
 * @param {HTMLElement} c     - Chat container element
 * @param {string}      html  - Inner HTML for the message bubble
 * @param {string}      [cls='wm other'] - CSS class(es) for the bubble div
 * @param {Function}    [sound] - Optional sound function to play (e.g. sndWa)
 */
function addMsg(c, html, cls, sound) {
  var d = document.createElement('div');
  d.className = cls || 'wm other';
  d.innerHTML = html;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
  if (sound) sound();
}

/**
 * Shows a WhatsApp-style "typing..." indicator (three animated dots) for a
 * short delay, then replaces it with the actual message bubble.
 * @param {HTMLElement} c     - Chat container element
 * @param {string}      html  - Message HTML to show after typing animation
 * @param {number}      [delay=1200] - How long the typing indicator is visible (ms)
 */
function waType(c, html, delay) {
  var tp = document.createElement('div');
  tp.className = 'wa-typ';
  tp.innerHTML = '<i></i><i></i><i></i>';
  c.appendChild(tp);
  c.scrollTop = c.scrollHeight;
  typStart();
  simTimeout(function () {
    tp.remove();
    typStop();
    addMsg(c, html, null, sndWa);
  }, delay || 1200);
}

/**
 * Controls the visibility of photo overlay layers on the shared photo.
 *   Layer 1 (base): real photo only -- always visible when photo exists
 *   Layer 2 (.e2):  Instagram-style edits (emojis, mean text overlays)
 *   Layer 3 (.e3, .igfr, .grain): TikTok-style additions (meme text, filter grain, IG frame)
 * Layers are cumulative: layer 3 shows layers 2+3, layer 2 shows only layer 2.
 * @param {number} n - Highest visible layer (1, 2, or 3)
 */
function setLayer(n) {
  document.querySelectorAll('.e2').forEach(function (e) {
    e.classList.toggle('on', n >= 2);
  });
  document.querySelectorAll('.e3,.igfr,.grain').forEach(function (e) {
    e.classList.toggle('on', n >= 3);
  });
}
