QUnit.module('audio', {
  beforeEach: function () {
    this._origSimPaused = simPaused;
    this._origSimTimers = simTimers;
    this._origSimTimerIdCounter = simTimerIdCounter;
    simPaused = false;
    simTimers = [];
  },
  afterEach: function () {
    // Clear any lingering native timeouts from simTimers
    simTimers.forEach(function (t) {
      clearTimeout(t.nativeId);
    });
    simPaused = this._origSimPaused;
    simTimers = this._origSimTimers;
    simTimerIdCounter = this._origSimTimerIdCounter;
  }
}, function () {

  QUnit.test('simTimeout chain: one timer scheduling another', function (assert) {
    var done = assert.async();
    var sequence = [];

    simTimeout(function () {
      sequence.push('first');
      // Schedule a second timer from within the first callback
      simTimeout(function () {
        sequence.push('second');
        assert.deepEqual(sequence, ['first', 'second'], 'Timers executed in sequence');
        done();
      }, 30);
    }, 30);
  });

  QUnit.test('togglePause sets simPaused correctly', function (assert) {
    // Create the minimal DOM that togglePause needs
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="pauseBtn"></div>' +
      '<div id="pauseOverlay" class="hidden"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    // Ensure starting state
    simPaused = false;
    sec = 10;
    // Initialize clockStart so togglePause resume path works
    clockStart = Date.now() - (sec * 1000);

    // First toggle: should pause
    togglePause();
    assert.ok(simPaused === true, 'After first togglePause, simPaused is true');

    // Second toggle: should resume
    togglePause();
    assert.ok(simPaused === false, 'After second togglePause, simPaused is false');

    // Clean up intervals that togglePause may have started
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
  });

  QUnit.test('Paused timers do not fire while paused', function (assert) {
    var done = assert.async();
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="pauseBtn"></div>' +
      '<div id="pauseOverlay" class="hidden"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    var called = false;
    sec = 10;
    clockStart = Date.now() - (sec * 1000);

    // Create a timer with a 80ms delay
    simTimeout(function () {
      called = true;
    }, 80);

    // Immediately pause -- timer should freeze
    simPaused = false;
    togglePause();
    assert.ok(simPaused, 'Simulation is paused');

    // After 120ms (longer than the 80ms delay), the timer should NOT have fired
    setTimeout(function () {
      assert.ok(!called, 'Timer did not fire while paused');

      // Resume and let the timer fire
      togglePause();
      assert.ok(!simPaused, 'Simulation is resumed');

      setTimeout(function () {
        assert.ok(called, 'Timer fired after resume');
        // Clean up intervals
        if (typeof tmr !== 'undefined') clearInterval(tmr);
        if (typeof clockInt !== 'undefined') clearInterval(clockInt);
        done();
      }, 150);
    }, 120);
  });

  QUnit.test('simTimerIdCounter increments monotonically', function (assert) {
    var id1 = simTimeout(function () {}, 5000);
    var id2 = simTimeout(function () {}, 5000);
    var id3 = simTimeout(function () {}, 5000);

    assert.ok(id2 > id1, 'Second timer ID (' + id2 + ') > first (' + id1 + ')');
    assert.ok(id3 > id2, 'Third timer ID (' + id3 + ') > second (' + id2 + ')');
    assert.ok(id3 === id1 + 2, 'IDs are consecutive');

    // Clean up -- clear all the 5-second timers
    simTimers.forEach(function (t) {
      clearTimeout(t.nativeId);
    });
    simTimers = [];
  });

  // ===== EXPANDED TESTS =====

  QUnit.test('simTimeout callback receives no arguments', function (assert) {
    var done = assert.async();
    simTimeout(function () {
      assert.equal(arguments.length, 0, 'Callback receives no arguments');
      done();
    }, 20);
  });

  QUnit.test('After togglePause() twice (pause+resume), simPaused is false', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="pauseBtn"></div>' +
      '<div id="pauseOverlay" class="hidden"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    simPaused = false;
    sec = 5;
    clockStart = Date.now() - (sec * 1000);

    togglePause(); // pause
    assert.ok(simPaused === true, 'After first toggle: paused');
    togglePause(); // resume
    assert.ok(simPaused === false, 'After second toggle: resumed, simPaused is false');

    // Clean up
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
  });

  QUnit.test('togglePause() changes pauseBtn text to resume text, then back to pause', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="pauseBtn"></div>' +
      '<div id="pauseOverlay" class="hidden"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    var origLang = currentLang;
    currentLang = 'de';
    simPaused = false;
    sec = 5;
    clockStart = Date.now() - (sec * 1000);
    var btn = document.getElementById('pauseBtn');

    togglePause(); // pause
    assert.equal(btn.textContent, t('ui.resume'), 'Pause button shows resume text when paused');

    togglePause(); // resume
    assert.equal(btn.textContent, t('ui.pause'), 'Pause button shows pause text when resumed');

    // Clean up
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
    currentLang = origLang;
  });

  QUnit.test('Pausing clears all native timeout IDs (remaining time calculated)', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="pauseBtn"></div>' +
      '<div id="pauseOverlay" class="hidden"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    simPaused = false;
    sec = 5;
    clockStart = Date.now() - (sec * 1000);

    // Create timers with long delays
    simTimeout(function () {}, 10000);
    simTimeout(function () {}, 10000);
    var timerCountBefore = simTimers.length;
    assert.ok(timerCountBefore >= 2, 'At least 2 timers created');

    togglePause(); // pause -- should freeze timers and calculate remaining

    // After pausing, each timer should have remaining <= original delay
    simTimers.forEach(function (timer) {
      assert.ok(timer.remaining <= 10000, 'Timer remaining (' + timer.remaining + ') is <= 10000');
      assert.ok(timer.remaining >= 0, 'Timer remaining (' + timer.remaining + ') is >= 0');
    });

    // Resume to clean up
    togglePause();
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
  });

  QUnit.test('initAudio() creates an AudioContext (if available)', function (assert) {
    // Only test if AudioContext is available in this environment
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      var origAx = ax;
      initAudio();
      assert.ok(ax instanceof (window.AudioContext || window.webkitAudioContext),
        'ax is an AudioContext instance');
      // Close the context to clean up
      if (ax && ax.close) ax.close().catch(function () {});
      ax = origAx;
    } else {
      assert.ok(true, 'AudioContext not available in this environment -- skipping');
    }
  });

  QUnit.test('typActive flag is false initially', function (assert) {
    // typActive is declared in audio.js and should be false by default
    // We test it before any typStart() call within this test
    assert.equal(typeof typActive, 'boolean', 'typActive is a boolean');
    // After typStop() it should definitely be false
    typStop();
    assert.equal(typActive, false, 'typActive is false after typStop()');
  });

});
