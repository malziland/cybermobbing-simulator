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
      assert.equal(ctlSceneAt(CTL_TOTAL).app, 'aFn', 'end: still the closing text');
    });

    QUnit.test(
      'timeline has six scenes in rising order with labels in both languages',
      function (assert) {
        assert.equal(CTL_SCENES.length, 6, 'six scenes');
        assert.strictEqual(CTL_TOTAL, 134, 'timeline covers the whole run up to the help page');
        assert.strictEqual(CTL_SEEK_END, CTL_TOTAL - 1, 'jumps end one second before that');
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
      assert.equal(seek.getAttribute('aria-valuenow'), '33', 'value for assistive technology');
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

    QUnit.test('simSeek() does nothing outside the running phone phase', function (assert) {
      document.getElementById('qunit-fixture').innerHTML = '<div id="phone" class="hidden"></div>';
      var origStarted = simStarted;
      simStarted = true;
      sec = 7;
      simSeek(60);
      assert.strictEqual(sec, 7, 'phone hidden (start or help screen): no jump');
      simStarted = false;
      document.getElementById('phone').classList.remove('hidden');
      simSeek(60);
      assert.strictEqual(sec, 7, 'simulation not started: no jump');
      simStarted = origStarted;
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
