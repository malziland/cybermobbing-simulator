/**
 * @file p4-homescreen.js
 * @description Scene 4: Phone homescreen notification flood (78-93s).
 *   Shows Tom's phone from his perspective: notification badges on all apps
 *   escalate rapidly, and push notifications stack up from every platform.
 *   The overwhelming volume of notifications visualizes how inescapable
 *   the harassment is. Transitions to the iMessage scene (p4b).
 * @requires audio.js   - simTimeout(), sndBuzz()
 * @requires helpers.js  - sw()
 * @requires i18n.js     - t() for notification text
 */

// ===== P4: HOMESCREEN (78-93s) =====

/**
 * Runs the homescreen notification flood scene. Two intervals run in parallel:
 * one escalates notification badge counts on app icons, the other pushes
 * notification banners into a visible stack (max 4 visible at a time).
 */
function p4() {
  // Initial badge counts (already elevated to show harassment was ongoing)
  var w = 23, ig = 186, tk = 4231, n = 47, s = 12;

  // Badge counter escalation via simTimeout chain (pausable)
  var badgeActive = true;
  function badgeTick() {
    w += Math.floor(Math.random() * 4) + 1;
    ig += Math.floor(Math.random() * 18) + 6;
    tk += Math.floor(Math.random() * 260) + 70;
    n += Math.floor(Math.random() * 5) + 1;
    s += Math.floor(Math.random() * 3) + 1;
    document.getElementById('xW').textContent = w;
    document.getElementById('xI').textContent = ig;
    document.getElementById('xT').textContent = tk > 1000 ? (tk / 1000).toFixed(1) + 'k' : tk;
    document.getElementById('xN').textContent = n;
    document.getElementById('xS').textContent = s;
    if (badgeActive) simTimeout(badgeTick, 500);
  }
  simTimeout(badgeTick, 500);

  // Push notification banners: [emoji, CSS icon class, text]
  var nts = [
    ['\uD83D\uDCAC', 'hs-ico-wa', t('hs.n1')],
    ['\u2764\uFE0F', 'hs-ico-heart', t('hs.n2')],
    ['\uD83D\uDCF8', 'hs-ico-cam', t('hs.n3')],
    ['\uD83C\uDFB5', 'hs-ico-heart', t('hs.n4')],
    ['\uD83D\uDCF1', 'hs-ico-phone', t('hs.n5')],
    ['\uD83D\uDCAC', 'hs-ico-wa', t('hs.n6')],
    ['\uD83C\uDFB5', 'hs-ico-heart', t('hs.n7')],
    ['\uD83D\uDCF8', 'hs-ico-cam', t('hs.n8')],
  ];

  // Notification banner queue via simTimeout chain (pausable)
  var nc = document.getElementById('hsN'), ni = 0;
  function notifTick() {
    if (ni >= nts.length) return;
    var x = nts[ni];
    var d = document.createElement('div');
    d.className = 'hs-n';
    d.innerHTML = '<div class="ico ' + x[1] + '">' + x[0] + '</div><div>' + x[2] + '</div>';
    nc.appendChild(d);
    if (nc.children.length > 4) nc.removeChild(nc.firstChild);
    ni++;
    sndBuzz();
    if (ni < nts.length) simTimeout(notifTick, 1600);
  }
  simTimeout(notifTick, 1600);

  simTimeout(function () {
    badgeActive = false;
    sw('aHs', 'aIm');
    p4b();
  }, 15000);
}
