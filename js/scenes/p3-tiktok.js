/**
 * @file p3-tiktok.js
 * @description Scene 3: TikTok video with comments (56-78s).
 *   This is the escalation scene. The edited photo becomes a TikTok video.
 *   View/like/share counters climb rapidly. Comments escalate from mockery
 *   to doxxing (noah.x posts address and phone number) and direct threats.
 *   An "OPFER" (victim) sticker is posted. Tom's report attempt is shown.
 *   Ends by transitioning to the homescreen scene (p4).
 * @requires audio.js   - simTimeout(), sndTk(), sndShutter()
 * @requires helpers.js  - getAvatar(), setLayer(), sw(), flash(), toast()
 * @requires i18n.js     - t() for all message text
 */

// ===== P3: TIKTOK (56-78s) =====
// Escalation: doxxing with address and phone number
// Character speech patterns:
// lukas: cool, kurz, organisiert | sara: CAPS, übertreibt
// noah: creepy sachlich, doxxing | anon99: lässig, "lol"
// tom: verzweifelt, korrekt | aggro: brutal, kurz
// marco: drohend | troll: call to action

/**
 * Runs the TikTok scene. Starts viral engagement counters, opens the comment
 * section with escalating hate comments, and transitions to the homescreen.
 */
function p3() {
  setLayer(3);
  var v = 0, cc = 0;

  // Viral engagement counters via simTimeout chain (pausable)
  // Views climb 60-179 per tick, shares derived as ~1/180 of views
  function tkCountTick() {
    v += Math.floor(Math.random() * 120) + 60;
    document.getElementById('tkLk').textContent = v > 1000 ? (v / 1000).toFixed(1) + 'k' : v;
    cc += Math.floor(Math.random() * 3) + 1;
    document.getElementById('tkCm').textContent = cc;
    document.getElementById('tkSh').textContent = Math.floor(v / 180);
    if (v <= 5200) simTimeout(tkCountTick, 250);
  }
  simTimeout(tkCountTick, 250);

  simTimeout(function () {
    document.getElementById('tkCo').classList.add('open');
    var lst = document.getElementById('tkCl');

    var cms = [
      [0,     'lukas.der.echte', t('tk.lukas')],
      [2500,  'sara_2012',       t('tk.sara')],
      [5000,  'noah.x',          t('tk.noah')],
      [7500,  'anon99',          t('tk.anon')],
      [10000, 'tom.m',           t('tk.tom'), 1],
      [13000, 'aggro.44',        t('tk.aggro')],
      [16000, 'marco_2012',      t('tk.marco')],
      [18500, 'troll.page',      t('tk.troll')],
    ];

    cms.forEach(function (m) {
      simTimeout(function () {
        var d = document.createElement('div');
        d.className = 'tc' + (m[3] ? ' vic' : '');
        d.innerHTML = getAvatar(m[1], true) +
          '<div><div class="nm">@' + m[1] + '</div><div class="tx">' + m[2] + '</div></div>';
        lst.appendChild(d);
        sndTk();
        requestAnimationFrame(function () { lst.scrollTop = lst.scrollHeight; });
      }, m[0]);
    });

    // aggro.44 posts a "OPFER" (victim) sticker -- visual escalation peak
    simTimeout(function () {
      var d = document.createElement('div');
      d.className = 'tc';
      var img = new Image();
      img.src = 'assets/sticker.png';
      img.className = 'tk-sticker-img';
      img.onload = function () { lst.scrollTop = lst.scrollHeight; };
      var wrap = document.createElement('div');
      wrap.className = 'tk-sticker-wrap';
      wrap.appendChild(img);
      var lbl = document.createElement('div');
      lbl.className = 'tk-sticker-lbl';
      lbl.textContent = t('tk.stickerLabel');
      wrap.appendChild(lbl);
      d.innerHTML = getAvatar('aggro.44', true);
      var txt = document.createElement('div');
      txt.innerHTML = '<div class="nm">@aggro.44</div>';
      txt.appendChild(wrap);
      d.appendChild(txt);
      lst.appendChild(d);
      sndTk();
      lst.scrollTop = lst.scrollHeight;
    }, 14500);
  }, 3000);

  simTimeout(function () {
    var r = document.createElement('div');
    r.className = 'tk-rpt';
    r.textContent = t('tk.toastReport');
    document.querySelector('.tk').appendChild(r);
  }, 17000);

  simTimeout(function () {
    flash(); sndShutter();
    toast(t('tk.toastVideos'), 2000);
  }, 20000);

  simTimeout(function () {
    document.getElementById('tkCo').classList.remove('open');
    sw('aTk', 'aHs');
    p4();
  }, 24000);
}
