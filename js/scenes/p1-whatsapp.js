/**
 * @file p1-whatsapp.js
 * @description Scene 1: WhatsApp group chat (0-28s).
 *   The group mocks Tom's photo. Marco posts the image, others pile on,
 *   Leon screenshots it, and Tom silently leaves the group. The photo
 *   is then edited (Layer 2) and forwarded to Instagram.
 * @requires audio.js   - simTimeout(), sndWa(), sndShutter(), flash()
 * @requires helpers.js  - waType(), mkPhoto(), setLayer(), sw(), toast()
 * @requires i18n.js     - t() for all message text
 */

// ===== P1: WHATSAPP (0-28s) =====
// Character speech patterns:
// Marco: aggressiv, alles klein, "alter/ey", kurz
// Sara: CAPS-mix, viele Emojis, dehnt Buchstaben, Ausrufezeichen
// Tim: klein, tippfehler, lässig gemein, Wörter weglassen
// Leon: sachlicher, plant, etwas korrekter

/**
 * Runs the WhatsApp group chat scene. Messages appear on a timed schedule
 * using simTimeout. Ends by switching to the Instagram scene (p2).
 */
function p1() {
  document.getElementById('aWa').classList.add('on');
  var c = document.getElementById('wC');

  var dt = document.createElement('div');
  dt.className = 'wa-date';
  dt.textContent = t('wa.dateLabel');
  c.appendChild(dt);

  // Marco
  simTimeout(function () {
    var d = document.createElement('div');
    d.className = 'wm-photo';
    d.innerHTML = '<span class="who who-marco">Marco</span>' +
      '<div class="img" id="waP"></div>' +
      '<div class="cap">' + t('wa.marco1') + ' <span class="meta">' + formatTime(clockBaseH, clockBaseM) + ' <span class="wa-check">\u2713\u2713</span></span></div>';
    c.appendChild(d);
    mkPhoto(document.getElementById('waP'), '220px');
    setLayer(1);
    c.scrollTop = c.scrollHeight;
    sndWa();
  }, 800);

  // Sara
  simTimeout(function () {
    waType(c, '<span class="who who-sara">Sara</span>' + t('wa.sara1') + ' <span class="meta">' + formatTime(clockBaseH, clockBaseM) + '</span>', 1200);
  }, 3000);

  // Tim
  simTimeout(function () {
    waType(c, '<span class="who who-tim">Tim</span>' + t('wa.tim1') + ' <span class="meta">' + formatTime(clockBaseH, clockBaseM) + '</span>', 1400);
  }, 6500);

  // Leon sends sticker
  simTimeout(function () {
    var d = document.createElement('div');
    d.className = 'wm-sticker';
    d.innerHTML = '<img src="assets/sticker.png"><div class="stk-emoji">\uD83E\uDD21</div><div class="meta">' + formatTime(clockBaseH, clockBaseM) + '</div>';
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
    sndWa();
  }, 9500);

  // Leon
  simTimeout(function () {
    waType(c, '<span class="who who-leon">Leon</span>' + t('wa.leon1') + ' <span class="meta">' + formatTime(clockBaseH, clockBaseM) + '</span>', 1000);
  }, 11000);

  // Sara
  simTimeout(function () {
    waType(c, '<span class="who who-sara">Sara</span>' + t('wa.sara2') + ' <span class="meta">' + formatTime(clockBaseH, clockBaseM) + '</span>', 1500);
  }, 14000);

  simTimeout(function () {
    flash();
    sndShutter();
    toast(t('wa.toastScreenshot'), 2500);
  }, 17500);

  // Marco
  simTimeout(function () {
    waType(c, '<span class="who who-marco">Marco</span>' + t('wa.marco2') + ' <span class="meta">' + formatTime(clockBaseH, clockBaseM) + '</span>', 1200);
  }, 20000);

  // Tom leaves the group -- system message, not a chat bubble
  simTimeout(function () {
    var d = document.createElement('div');
    d.className = 'wa-sys';
    d.textContent = t('wa.tomLeaves');
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
    sndWa();
  }, 23000);

  simTimeout(function () {
    toast(t('wa.toastEditing'), 2000);
    setLayer(2);
  }, 25000);

  simTimeout(function () {
    toast(t('wa.toastPosted'), 2000);
    sndWa();
  }, 26500);

  simTimeout(function () {
    sw('aWa', 'aIg');
    p2();
  }, 28000);
}
