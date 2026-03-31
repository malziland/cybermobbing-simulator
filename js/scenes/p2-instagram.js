/**
 * @file p2-instagram.js
 * @description Scene 2: Instagram post with comments (28-56s).
 *   The edited photo is posted on Instagram. A like counter escalates rapidly
 *   via a fast interval, comments from multiple characters pile on, and Tom
 *   makes two desperate attempts to defend himself. Ends with a screenshot
 *   and transition to TikTok (p3).
 * @requires audio.js   - simTimeout(), sndIg(), sndShutter(), sndWa()
 * @requires helpers.js  - getAvatar(), setLayer(), sw(), flash(), toast()
 * @requires i18n.js     - t() for all message text and interpolated counts
 */

// ===== P2: INSTAGRAM (28-56s) =====
// Character speech patterns:
// sara.xoxo: CAPS-mix, Emojis, dehnt Wörter
// tim_0711: klein, tippfehler, Wörter weglassen
// leon_fcb: sachlich, keine Fehler
// tom.m: korrekt, verzweifelt
// marco_2012: aggressiv, klein, kurz
// xxl.lukas: slang, direkt, hart
// hype.page: call to action

/**
 * Runs the Instagram post scene. Starts a like counter interval, schedules
 * timed comments, triggers a heart animation, and transitions to TikTok.
 */
function p2() {
  setLayer(2);
  var c = document.getElementById('igCm');
  var sc = document.getElementById('igB');
  var lk = 0, cc = 0;

  // Like counter: increments by 2-7 every 400ms via simTimeout chain (pausable)
  function igLikeTick() {
    lk += Math.floor(Math.random() * 6) + 2;
    document.getElementById('igLk').textContent = t('ig.likesCount', {count: lk});
    if (lk <= 190) simTimeout(igLikeTick, 400);
  }
  simTimeout(igLikeTick, 400);

  // Fill the heart icon red after 1.2s to simulate the first "like"
  simTimeout(function () {
    document.getElementById('igH').setAttribute('fill', '#fe2c55');
    document.getElementById('igH').setAttribute('stroke', '#fe2c55');
    sndIg();
  }, 1200);

  // Comment schedule: [delay_ms, username, text, is_victim_flag]
  // The 4th element (1) marks Tom's comments with the 'vic' CSS class
  var cms = [
    [1500,  'sara.xoxo',  t('ig.sara')],
    [5000,  'tim_0711',   t('ig.tim')],
    [8000,  'leon_fcb',   t('ig.leon')],
    [11000, 'tom.m',      t('ig.tom1'), 1],
    [14000, 'marco_2012', t('ig.marco')],
    [17000, 'xxl.lukas',  t('ig.lukas')],
    [20000, 'tom.m',      t('ig.tom2'), 1],
    [23000, 'hype.page',  t('ig.hype')],
  ];

  cms.forEach(function (m) {
    simTimeout(function () {
      var d = document.createElement('div');
      d.className = 'ig-c' + (m[3] ? ' vic' : '');
      d.innerHTML = '<span class="ig-av-inline">' + getAvatar(m[1]) + '</span><b>' + m[1] + '</b> ' + m[2];
      c.appendChild(d);
      cc++;
      document.getElementById('igCc').textContent = t('ig.commentsCount', {count: cc});
      sc.scrollTop = sc.scrollHeight;
      sndIg();
    }, m[0]);
  });

  simTimeout(function () {
    document.getElementById('igVw').textContent = t('ig.storyViews');
  }, 8000);

  simTimeout(function () {
    flash(); sndShutter();
    toast(t('ig.toastScreenshot'), 2000);
  }, 24000);

  simTimeout(function () {
    toast(t('ig.toastReaction'), 2000);
  }, 25500);

  simTimeout(function () {
    toast(t('ig.toastTiktok'), 2000);
    sndWa();
  }, 27000);

  simTimeout(function () {
    sw('aIg', 'aTk');
    p3();
  }, 28000);
}
