QUnit.module(
  'controls (timeline)',
  {
    beforeEach: function () {
      this._orig = {
        timers: simTimers,
        paused: simPaused,
        seeking: simSeeking,
        counter: simTimerIdCounter,
        sec: sec,
        lang: currentLang,
      };
      simTimers = [];
      simPaused = false;
      simSeeking = false;
      currentLang = 'de';
    },
    afterEach: function () {
      simTimers.forEach(function (timer) {
        clearTimeout(timer.nativeId);
      });
      simTimers = this._orig.timers;
      simPaused = this._orig.paused;
      simSeeking = this._orig.seeking;
      simTimerIdCounter = this._orig.counter;
      sec = this._orig.sec;
      currentLang = this._orig.lang;
    },
  },
  function () {
    // ----- small helpers -----

    QUnit.test(
      'ctlSnap() pulls a click onto a scene mark only when it is close',
      function (assert) {
        assert.strictEqual(CTL_SNAP, 1.5, 'a click snaps within 1.5 seconds of a mark');
        assert.equal(ctlSnap(70), 70, 'in the middle of a scene: stays where it was made');
        assert.equal(
          ctlSnap(62),
          62,
          'earlier in the same scene: stays, no jump to the scene start'
        );
        assert.equal(ctlSnap(57.5), 56, 'exactly 1.5 s after the mark: onto the mark (inclusive)');
        assert.equal(ctlSnap(54.5), 56, 'exactly 1.5 s before the mark: onto the mark (inclusive)');
        assert.equal(ctlSnap(57.6), 57.6, 'just outside after the mark: stays');
        assert.equal(ctlSnap(54.4), 54.4, 'just outside before the mark: stays');
        assert.equal(ctlSnap(1), 0, 'next to the start: the start');
      }
    );

    QUnit.test('ctlSceneAt() returns the scene running at a second', function (assert) {
      assert.equal(ctlSceneAt(0).app, 'aWa', 'start: WhatsApp');
      assert.equal(ctlSceneAt(27.9).app, 'aWa', 'just before the first mark: still WhatsApp');
      assert.equal(ctlSceneAt(28).app, 'aIg', 'on the mark: Instagram (inclusive)');
      assert.equal(ctlSceneAt(70).app, 'aTk', 'TikTok');
      assert.equal(ctlSceneAt(120).app, 'aFn', 'closing text');
      assert.equal(
        ctlSceneAt(133.9).app,
        'aFn',
        'just before the help page: still the closing text'
      );
      assert.equal(ctlSceneAt(134).app, 'aCta', 'on the last mark: the help page (inclusive)');
      assert.equal(ctlSceneAt(CTL_TOTAL).app, 'aCta', 'end: the help page');
    });

    QUnit.test(
      'timeline has seven parts in rising order with labels in both languages',
      function (assert) {
        assert.equal(CTL_SCENES.length, 7, 'six scenes and the help page');
        assert.equal(CTL_SCENES[6].app, 'aCta', 'the last part is the help page');
        assert.strictEqual(CTL_TOTAL, 140, 'timeline covers the run and a part for the help page');
        for (var i = 0; i < CTL_SCENES.length; i++) {
          if (i > 0) assert.ok(CTL_SCENES[i].at > CTL_SCENES[i - 1].at, 'start ' + i + ' is later');
          assert.ok(CTL_SCENES[i].at < CTL_TOTAL, 'start ' + i + ' lies on the timeline');
          assert.ok(TRANSLATIONS.de[CTL_SCENES[i].key], 'de label for ' + CTL_SCENES[i].key);
          assert.ok(TRANSLATIONS.en[CTL_SCENES[i].key], 'en label for ' + CTL_SCENES[i].key);
        }
      }
    );

    // ----- the timer system can be fast-forwarded -----

    QUnit.test('simAdvance() runs due timers in order and leaves the rest', function (assert) {
      var order = [];
      simPaused = true; // timers are created but not armed
      simTimeout(function () {
        order.push('c');
      }, 300 * SIM_SPEED);
      simTimeout(function () {
        order.push('a');
      }, 100 * SIM_SPEED);
      simTimeout(function () {
        order.push('b');
      }, 200 * SIM_SPEED);
      simTimeout(function () {
        order.push('late');
      }, 900 * SIM_SPEED);
      simAdvance(300);
      assert.deepEqual(order, ['a', 'b', 'c'], 'due timers ran in the order of their time');
      assert.equal(simTimers.length, 1, 'the later timer is still waiting');
      assert.ok(Math.abs(simTimers[0].remaining - 600) < 0.001, 'and has 600 ms left');
      assert.strictEqual(simSeeking, false, 'seeking flag is cleared afterwards');
    });

    QUnit.test('simAdvance() also runs timers created on the way', function (assert) {
      var order = [];
      simPaused = true;
      simTimeout(function () {
        order.push('first');
        simTimeout(function () {
          order.push('second');
          simTimeout(function () {
            order.push('third');
          }, 50 * SIM_SPEED);
        }, 50 * SIM_SPEED);
      }, 100 * SIM_SPEED);
      simAdvance(180);
      assert.deepEqual(order, ['first', 'second'], 'chain ran as far as the time reaches');
      simAdvance(20);
      assert.deepEqual(order, ['first', 'second', 'third'], 'the rest follows with more time');
    });

    QUnit.test('simAdvance() treats a timer on the exact target as due', function (assert) {
      var ran = false;
      simPaused = true;
      // float steps first, as the typing sound produces them
      simTimeout(function () {}, 33.3333 * SIM_SPEED);
      simTimeout(function () {}, 66.6667 * SIM_SPEED);
      simTimeout(function () {
        ran = true;
      }, 28000 * SIM_SPEED);
      simAdvance(28000);
      assert.ok(ran, 'the scene switch at exactly 28 s is executed');
    });

    QUnit.test(
      'simAdvance() runs a chained step that lands exactly on the target',
      function (assert) {
        var ran = false;
        simPaused = true;
        // 0.3 - 0.1 is 0.19999999999999998 in floats, a hair less than the 0.2 the
        // second step waits: without the tolerance the step would be left out
        simTimeout(function () {
          simTimeout(function () {
            ran = true;
          }, 0.2 * SIM_SPEED);
        }, 0.1 * SIM_SPEED);
        simAdvance(0.3);
        assert.ok(ran, 'the step due at 0.1 + 0.2 = 0.3 ms runs when advancing by 0.3 ms');
      }
    );

    QUnit.test('timers are not armed while paused or seeking', function (assert) {
      simPaused = true;
      simTimeout(function () {}, 50);
      assert.strictEqual(simTimers[0].nativeId, undefined, 'paused: no native timeout');
      simPaused = false;
      simSeeking = true;
      simTimeout(function () {}, 50);
      assert.strictEqual(simTimers[1].nativeId, undefined, 'seeking: no native timeout');
      simSeeking = false;
      simTimeout(function () {}, 50);
      assert.notStrictEqual(simTimers[2].nativeId, undefined, 'running: armed as before');
    });

    QUnit.test(
      'simFreezeTimers() stops armed timers and keeps their remaining time',
      function (assert) {
        var done = assert.async();
        var fired = false;
        simTimeout(function () {
          fired = true;
        }, 40 * SIM_SPEED);
        simFreezeTimers();
        assert.strictEqual(simTimers[0].nativeId, undefined, 'native timeout cleared');
        assert.ok(
          simTimers[0].remaining > 0 && simTimers[0].remaining <= 40,
          'remaining time kept'
        );
        setTimeout(function () {
          assert.strictEqual(fired, false, 'a frozen timer does not fire');
          done();
        }, 90);
      }
    );

    QUnit.test('simFreezeTimers() takes the time that has already passed off', function (assert) {
      var done = assert.async();
      simTimeout(function () {}, 400 * SIM_SPEED);
      setTimeout(function () {
        simFreezeTimers();
        var left = simTimers[0].remaining;
        assert.ok(
          left > 150 && left < 330,
          'about 100 of 400 ms have passed, ' + left + ' are left'
        );
        done();
      }, 100);
    });

    QUnit.test('no sound source is created while seeking or paused', function (assert) {
      if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
        assert.ok(true, 'AudioContext not available in this environment -- skipping');
        return;
      }
      initAudio();
      var made = 0;
      var origOsc = ax.createOscillator;
      var origBuf = ax.createBufferSource;
      ax.createOscillator = function () {
        made++;
        return origOsc.apply(ax, arguments);
      };
      ax.createBufferSource = function () {
        made++;
        return origBuf.apply(ax, arguments);
      };
      var sounds = [sndWa, sndIg, sndTk, sndIm, sndShutter, sndBuzz];
      function playAll() {
        made = 0;
        sounds.forEach(function (snd) {
          snd();
        });
        tone(440, 0, 0.02, 0.01);
        return made;
      }
      var origPaused = simPaused;
      simPaused = false;
      simSeeking = false;
      var normal = playAll();
      assert.ok(normal >= 7, 'positive control: all seven sounds create a source (' + normal + ')');
      simSeeking = true;
      assert.equal(playAll(), 0, 'seeking: not a single source');
      simSeeking = false;
      simPaused = true;
      assert.equal(playAll(), 0, 'paused: not a single source');
      simPaused = origPaused;
      ax.createOscillator = origOsc;
      ax.createBufferSource = origBuf;
    });

    QUnit.test('sounds and the camera flash stay off while seeking', function (assert) {
      document.getElementById('qunit-fixture').innerHTML = '<div id="fl"></div>';
      simSeeking = true;
      flash();
      assert.ok(!document.getElementById('fl').classList.contains('go'), 'no flash while seeking');
      simSeeking = false;
      flash();
      assert.ok(
        document.getElementById('fl').classList.contains('go'),
        'flash works again afterwards'
      );
    });

    // ----- the bar -----

    QUnit.test('ctlUpdate() shows scene, fill and the pause state, no time', function (assert) {
      document.getElementById('qunit-fixture').innerHTML =
        '<div id="phone"><div class="app on" id="aIg"></div></div>' +
        '<div id="ctlBar"><button id="pauseBtn"></button><span id="ctlScene"></span>' +
        '<div id="ctlSeek"><div id="ctlTrack"></div></div></div>';
      sec = CTL_TOTAL / 4;
      ctlUpdate();
      var seek = document.getElementById('ctlSeek');
      assert.notOk(
        /\d/.test(document.getElementById('ctlBar').textContent),
        'the bar writes no time: "' + document.getElementById('ctlBar').textContent + '"'
      );
      assert.equal(seek.getAttribute('aria-valuetext'), t('ctl.ig'), 'read out as the scene name');
      assert.equal(
        document.getElementById('ctlScene').textContent,
        t('ctl.ig'),
        'scene name from the active app'
      );
      assert.equal(seek.style.getPropertyValue('--pos'), '25.00%', 'fill is a quarter');
      assert.equal(seek.getAttribute('aria-valuenow'), '35', 'value for assistive technology');
      assert.equal(
        document.getElementById('pauseBtn').getAttribute('aria-label'),
        t('ctl.pause'),
        'button offers pause'
      );
      simPaused = true;
      ctlUpdate();
      assert.equal(
        document.getElementById('ctlScene').textContent,
        t('ctl.paused'),
        'paused replaces the scene name'
      );
      assert.ok(
        document.getElementById('pauseBtn').classList.contains('paused'),
        'button marked as paused'
      );
      assert.equal(
        document.getElementById('pauseBtn').getAttribute('aria-label'),
        t('ctl.resume'),
        'button offers resume'
      );
      sec = 500;
      ctlUpdate();
      assert.equal(seek.style.getPropertyValue('--pos'), '100.00%', 'fill never exceeds the bar');
    });

    QUnit.test('simSeek() does nothing before the simulation was started', function (assert) {
      document.getElementById('qunit-fixture').innerHTML = '<div id="phone"></div>';
      var origStarted = simStarted;
      simStarted = false;
      sec = 7;
      simSeek(60);
      assert.strictEqual(sec, 7, 'simulation not started: no jump');
      simStarted = origStarted;
    });

    // ----- the help page is part of the timeline -----

    QUnit.test('p6Reset() takes the help page back, p6() can run again', function (assert) {
      document.getElementById('qunit-fixture').innerHTML =
        '<div id="phone"></div><button id="pauseBtn"></button><div class="disclaimer hidden"></div>' +
        '<div id="aCta" class="hidden"><a id="ctaLogo" class="hidden"></a><div id="ctaLinks"></div>' +
        '<div id="ctaHelpline"></div><div id="ctaMsg"></div></div>';
      var origTimers = simTimers;
      var origPaused = simPaused;
      simTimers = [];
      simPaused = true; // timers only wait in the list
      function state() {
        return {
          cta: !document.getElementById('aCta').classList.contains('hidden'),
          phone: !document.getElementById('phone').classList.contains('hidden'),
          pause: !document.getElementById('pauseBtn').classList.contains('hidden'),
          disclaimer: !document.querySelector('.disclaimer').classList.contains('hidden'),
          links: document.getElementById('ctaLinks').children.length,
          logo: document.getElementById('ctaLogo').children.length,
          shown: document.querySelectorAll('#aCta .show').length,
        };
      }
      // As on the live site: a logo and two links (the example config has neither logo nor second link)
      var hadConfig = typeof helplineConfig !== 'undefined';
      var origConfig = hadConfig ? helplineConfig : undefined;
      window.helplineConfig = {
        logo: 'logo.png',
        logoAlt: 'Logo',
        link: 'https://example.org/',
        linkLabel: 'example.org',
        infoLink: 'https://example.org/info',
        infoLabel: 'Info',
        slogan: 'Slogan',
      };
      p6();
      simAdvance(600); // the fade-in step of the help page
      var first = state();
      assert.equal(first.logo, 1, 'p6: one logo');
      assert.equal(first.links, 2, 'p6: two links');
      assert.ok(first.cta && !first.phone && !first.pause && first.disclaimer, 'p6: help page up');
      assert.ok(first.shown >= 2, 'p6: its texts are shown (' + first.shown + ')');

      p6Reset();
      var back = state();
      assert.ok(!back.cta && back.phone && back.pause && !back.disclaimer, 'reset: phone is back');
      assert.equal(back.links + back.logo + back.shown, 0, 'reset: links, logo and fades are gone');

      p6();
      simAdvance(600);
      assert.deepEqual(state(), first, 'a second run of p6 gives the same page, nothing doubled');
      if (hadConfig) window.helplineConfig = origConfig;
      else delete window.helplineConfig;
      simTimers = origTimers;
      simPaused = origPaused;
    });

    QUnit.test('on the help page the bar names it and never reads paused', function (assert) {
      document.getElementById('qunit-fixture').innerHTML =
        '<div id="phone" class="hidden"><div class="app on" id="aFn"></div></div><div id="aCta"></div>' +
        '<button id="pauseBtn"></button><span id="ctlScene"></span><div id="ctlSeek"></div>';
      var origPaused = simPaused;
      sec = 136;
      simPaused = false;
      ctlUpdate();
      var scene = document.getElementById('ctlScene');
      assert.equal(scene.textContent, t('ctl.help'), 'named after the help page, not the last app');
      simPaused = true;
      ctlUpdate();
      assert.equal(scene.textContent, t('ctl.help'), 'still the help page while paused');
      assert.notOk(scene.classList.contains('paused'), 'not marked as paused');
      document.getElementById('aCta').classList.add('hidden');
      document.getElementById('phone').classList.remove('hidden');
      ctlUpdate();
      assert.equal(scene.textContent, t('ctl.paused'), 'back in the run it reads paused again');
      simPaused = origPaused;
    });

    // ----- stage keeps messages whole -----

    QUnit.test(
      'stageFitList() pushes the older message out when both do not fit',
      function (assert) {
        document.getElementById('qunit-fixture').innerHTML =
          '<div id="fitList" style="height:100px;overflow:hidden">' +
          '<div class="st-item" style="height:70px">alt</div>' +
          '<div class="st-item" style="height:70px">neu</div></div>';
        var list = document.getElementById('fitList');
        stageFitList(list);
        assert.ok(list.children[0].classList.contains('out'), 'older item is pushed out');
        assert.ok(!list.children[1].classList.contains('out'), 'newest item stays');
        list.children[0].classList.remove('out');
        list.style.height = '200px';
        stageFitList(list);
        assert.ok(!list.children[0].classList.contains('out'), 'with enough room both stay');
        list.style.height = '20px';
        list.children[0].classList.add('out');
        stageFitList(list);
        assert.ok(
          !list.children[1].classList.contains('out'),
          'the last remaining item is never pushed out'
        );
      }
    );

    QUnit.test('stageScrollPhone() brings the chat to its newest entry', function (assert) {
      document.getElementById('qunit-fixture').innerHTML =
        '<div id="wC" style="height:40px;overflow:auto"><div style="height:300px"></div></div>';
      var chat = document.getElementById('wC');
      chat.scrollTop = 0;
      stageScrollPhone();
      assert.equal(chat.scrollTop, chat.scrollHeight - chat.clientHeight, 'scrolled to the end');
    });

    QUnit.test('stageReset() restores the stage and wires it again', function (assert) {
      var done = assert.async();
      document.getElementById('qunit-fixture').innerHTML =
        '<div id="toast"></div><div id="phone"><div class="scr"><div class="app" id="aWa"><div id="wC"></div></div></div></div>' +
        '<div id="stage"><div class="st-frame"><div class="st-scene" id="stWa" data-app="aWa">' +
        '<div class="st-media" id="stWaMedia"><div id="stWaPh"></div></div>' +
        '<div class="st-list" id="stWaList"></div><div class="st-sys" id="stWaSys"></div></div>' +
        '<div id="stNote"></div></div></div>';
      stageInit();
      stageOnWa(
        (function () {
          var d = document.createElement('div');
          d.className = 'wm other';
          d.innerHTML = '<span class="who">A</span>eins';
          return d;
        })(),
        true
      );
      assert.equal(
        document.querySelectorAll('#stWaList .st-item').length,
        1,
        'one item before the reset'
      );
      stageReset();
      assert.equal(
        document.querySelectorAll('#stWaList .st-item').length,
        0,
        'stage is empty again'
      );
      addMsg(
        document.getElementById('wC'),
        '<span class="who">B</span>zwei <span class="meta">1</span>'
      );
      setTimeout(function () {
        var items = document.querySelectorAll('#stWaList .st-item');
        assert.equal(items.length, 1, 'new observers mirror the phone again, exactly once');
        assert.equal(items[0].querySelector('.st-text').textContent, 'zwei', 'with the right text');
        done();
      }, 20);
    });
  }
);
