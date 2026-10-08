QUnit.module(
  'volume',
  {
    beforeEach: function () {
      this._orig = {
        volume: simVolume,
        muted: simMuted,
        bgMusic: bgMusic,
        ax: ax,
        axOut: axOut,
        lang: currentLang,
      };
      currentLang = 'de';
      document.getElementById('qunit-fixture').innerHTML =
        '<button id="soundBtn"></button>' +
        '<input type="range" id="volSlider" min="0" max="100" step="5" value="100">' +
        '<audio id="testBgm"></audio>';
      bgMusic = document.getElementById('testBgm');
      simVolume = 1;
      simMuted = false;
    },
    afterEach: function () {
      simVolume = this._orig.volume;
      simMuted = this._orig.muted;
      bgMusic = this._orig.bgMusic;
      ax = this._orig.ax;
      axOut = this._orig.axOut;
      currentLang = this._orig.lang;
    },
  },
  function () {
    /** True if two volumes are equal within floating point noise. */
    function near(a, b) {
      return Math.abs(a - b) < 0.0001;
    }

    QUnit.test('music plays at 40% of the master volume', function (assert) {
      assert.strictEqual(BGM_BASE_VOLUME, 0.4, 'base volume of the music is 40%');
      setVolume(1);
      assert.ok(near(bgMusic.volume, 0.4), 'full master volume -> 0.4');
      setVolume(0.5);
      assert.ok(near(bgMusic.volume, 0.2), 'half master volume -> 0.2');
      assert.equal(document.getElementById('volSlider').value, '50', 'slider shows 50');
    });

    QUnit.test('setVolume() clamps out-of-range and invalid values', function (assert) {
      setVolume(2);
      assert.strictEqual(simVolume, 1, 'above 1 -> 1');
      setVolume(-1);
      assert.strictEqual(simVolume, 0, 'below 0 -> 0');
      setVolume('abc');
      assert.strictEqual(simVolume, 0, 'not a number -> 0');
      setVolume(0.35);
      assert.ok(near(simVolume, 0.35), 'valid value is taken as is');
    });

    QUnit.test('toggleMute() switches the sound off without losing the volume', function (assert) {
      var btn = document.getElementById('soundBtn');
      setVolume(0.6);
      assert.ok(!btn.classList.contains('muted'), 'button not marked while sound is on');
      assert.equal(btn.getAttribute('aria-label'), t('ui.soundMute'), 'label offers to mute');
      toggleMute();
      assert.strictEqual(bgMusic.muted, true, 'music muted');
      assert.ok(near(simVolume, 0.6), 'chosen volume kept');
      assert.ok(btn.classList.contains('muted'), 'button marked as muted');
      assert.equal(btn.getAttribute('aria-label'), t('ui.soundUnmute'), 'label offers to unmute');
      toggleMute();
      assert.strictEqual(bgMusic.muted, false, 'music audible again');
      assert.ok(near(bgMusic.volume, 0.24), 'back at the chosen volume');
    });

    QUnit.test('moving the slider above zero switches the sound back on', function (assert) {
      toggleMute();
      assert.strictEqual(simMuted, true, 'muted first');
      setVolume(0.3);
      assert.strictEqual(simMuted, false, 'slider movement unmutes');
      assert.strictEqual(bgMusic.muted, false, 'music element unmuted');
    });

    QUnit.test('volume zero counts as silent, switching on raises it', function (assert) {
      var btn = document.getElementById('soundBtn');
      setVolume(0);
      assert.ok(btn.classList.contains('muted'), 'button shows the muted icon at volume zero');
      toggleMute();
      assert.strictEqual(simMuted, false, 'sound is on');
      assert.ok(near(simVolume, 0.5), 'volume raised to half so there is sound');
      assert.ok(!btn.classList.contains('muted'), 'button back to normal');
    });

    QUnit.test('master gain follows volume and mute', function (assert) {
      if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
        assert.ok(true, 'AudioContext not available in this environment -- skipping');
        return;
      }
      initAudio();
      assert.strictEqual(audioOut(), axOut, 'sounds are routed through the master gain');
      assert.ok(near(axOut.gain.value, 1), 'gain starts at full volume');
      setVolume(0.25);
      assert.ok(near(axOut.gain.value, 0.25), 'gain follows the slider');
      toggleMute();
      assert.strictEqual(axOut.gain.value, 0, 'gain is zero while muted');
      toggleMute();
      assert.ok(near(axOut.gain.value, 0.25), 'gain returns after unmuting');
      var foreign = new (window.AudioContext || window.webkitAudioContext)();
      var own = ax;
      ax = foreign;
      assert.strictEqual(audioOut(), foreign.destination, 'falls back for a context without gain');
      if (own.close) own.close().catch(function () {});
      if (foreign.close) foreign.close().catch(function () {});
    });

    QUnit.test('every sound ends at the master gain, none goes past it', function (assert) {
      if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
        assert.ok(true, 'AudioContext not available in this environment -- skipping');
        return;
      }
      initAudio();
      var past = 0;
      var toMaster = 0;
      var origConnect = AudioNode.prototype.connect;
      AudioNode.prototype.connect = function (dest) {
        if (dest === ax.destination && this !== axOut) past++;
        if (dest === axOut) toMaster++;
        return origConnect.apply(this, arguments);
      };
      var origPaused = simPaused;
      simPaused = false;
      [sndWa, sndIg, sndTk, sndIm, sndShutter, sndBuzz].forEach(function (snd) {
        snd();
      });
      tone(440, 0, 0.02, 0.01);
      simPaused = origPaused;
      AudioNode.prototype.connect = origConnect;
      assert.equal(past, 0, 'no sound is connected straight to the loudspeaker');
      assert.ok(
        toMaster >= 7,
        'all seven sounds are connected to the master gain (' + toMaster + ')'
      );
      if (ax.close) ax.close().catch(function () {});
    });

    QUnit.test('sound control i18n keys exist in both languages', function (assert) {
      ['ui.sound', 'ui.soundMute', 'ui.soundUnmute', 'ui.volume'].forEach(function (k) {
        assert.ok(TRANSLATIONS.de[k], 'de: ' + k);
        assert.ok(TRANSLATIONS.en[k], 'en: ' + k);
      });
    });
  }
);
