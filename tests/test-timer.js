QUnit.module('timer', {
  beforeEach: function () {
    // Reset timer state
    sec = 0;
    // Ensure fixture elements exist with fresh content
    document.getElementById('tf').style.width = '0';
    document.getElementById('tl').textContent = '';
    document.getElementById('sbTime').textContent = '21:34';
    document.getElementById('hsClock').textContent = '21:34';
  }
}, function () {
  QUnit.test('tick increments sec by 0.1', function (assert) {
    sec = 0;
    tick();
    assert.ok(Math.abs(sec - 0.1) < 0.001, 'sec is 0.1 after one tick (actual: ' + sec + ')');
  });

  QUnit.test('tick sets progress bar width correctly', function (assert) {
    sec = 60; // halfway
    tick();
    var width = document.getElementById('tf').style.width;
    // sec is now 60.1, so width should be ~50.08%
    assert.ok(parseFloat(width) > 49 && parseFloat(width) < 51, 'Width is ~50%: ' + width);
  });

  QUnit.test('tick updates label text', function (assert) {
    sec = 30;
    tick();
    var label = document.getElementById('tl').textContent;
    assert.equal(label, '30s / 120s');
  });

  QUnit.test('tick caps width at 100%', function (assert) {
    sec = 125;
    tick();
    var width = document.getElementById('tf').style.width;
    assert.equal(width, '100%');
  });

  QUnit.test('simTimeout creates and executes timer', function (assert) {
    var done = assert.async();
    var called = false;
    simTimers = [];
    simPaused = false;
    simTimeout(function () {
      called = true;
      assert.ok(called, 'Timer callback was executed');
      done();
    }, 50);
    assert.ok(simTimers.length === 1, 'Timer added to simTimers');
  });

  QUnit.test('simTimeout removes timer after execution', function (assert) {
    var done = assert.async();
    simTimers = [];
    simPaused = false;
    simTimeout(function () {
      assert.equal(simTimers.length, 0, 'Timer removed from simTimers after execution');
      done();
    }, 50);
  });

  // ===== NEW TESTS =====

  QUnit.test('tick() at exactly 120s: label shows "120s / 120s"', function (assert) {
    sec = 119.9;
    tick();
    // sec is now 120.0
    var label = document.getElementById('tl').textContent;
    assert.equal(label, '120s / 120s', 'Label shows 120s / 120s at sec=120');
  });

  QUnit.test('tick() beyond 120s: label should not update', function (assert) {
    sec = 119.9;
    tick();
    // sec = 120.0, label updated to "120s / 120s"
    var labelAt120 = document.getElementById('tl').textContent;
    assert.equal(labelAt120, '120s / 120s', 'Label correct at 120s');

    // Now tick again: sec = 120.1, label should NOT update
    tick();
    var labelBeyond = document.getElementById('tl').textContent;
    assert.equal(labelBeyond, '120s / 120s', 'Label stays at 120s / 120s beyond 120s');
  });

  QUnit.test('simTimeout with 0ms delay: should still execute', function (assert) {
    var done = assert.async();
    var origTimers = simTimers;
    var origPaused = simPaused;
    simTimers = [];
    simPaused = false;
    var called = false;
    simTimeout(function () {
      called = true;
      assert.ok(called, 'Timer with 0ms delay executed');
      simTimers = origTimers;
      simPaused = origPaused;
      done();
    }, 0);
  });

  QUnit.test('Multiple simultaneous simTimeouts: all should execute', function (assert) {
    var done = assert.async(3); // expect 3 async completions
    var origTimers = simTimers;
    var origPaused = simPaused;
    simTimers = [];
    simPaused = false;
    var results = [];

    simTimeout(function () {
      results.push('a');
      assert.ok(true, 'Timer A executed');
      done();
    }, 30);

    simTimeout(function () {
      results.push('b');
      assert.ok(true, 'Timer B executed');
      done();
    }, 60);

    simTimeout(function () {
      results.push('c');
      assert.ok(true, 'Timer C executed');
      assert.equal(results.length, 3, 'All 3 timers have fired');
      simTimers = origTimers;
      simPaused = origPaused;
      done();
    }, 100);

    assert.equal(simTimers.length, 3, 'Three timers registered');
  });

  // ===== EXPANDED TESTS =====

  QUnit.test('tick() at sec=0 produces width close to 0%', function (assert) {
    sec = 0;
    tick();
    // sec is now 0.1, width = 0.1/120*100 = ~0.083%
    var width = parseFloat(document.getElementById('tf').style.width);
    assert.ok(width < 1, 'Width is near 0% at start: ' + width + '%');
  });

  QUnit.test('tick() label format is always "Xs / 120s"', function (assert) {
    sec = 45;
    tick();
    var label = document.getElementById('tl').textContent;
    assert.ok(/^\d+s \/ 120s$/.test(label), 'Label matches format "Xs / 120s": ' + label);

    sec = 0;
    tick();
    label = document.getElementById('tl').textContent;
    assert.ok(/^\d+s \/ 120s$/.test(label), 'Label at start matches format: ' + label);

    sec = 99.9;
    tick();
    label = document.getElementById('tl').textContent;
    assert.ok(/^\d+s \/ 120s$/.test(label), 'Label at 100s matches format: ' + label);
  });

  QUnit.test('startClock() sets initial time to 21:34', function (assert) {
    var origClockStart = clockStart;
    var origClockInt = clockInt;
    clockStart = 0; // Reset so startClock initializes it
    startClock();
    // The clock should display 21:34 initially (or very close, within the first tick)
    var sbTime = document.getElementById('sbTime').textContent;
    assert.equal(sbTime, '21:34', 'Initial clock time is 21:34');
    // Clean up
    clearInterval(clockInt);
    clockStart = origClockStart;
    clockInt = origClockInt;
  });

  QUnit.test('startClock() does not overwrite clockStart if already set (resume fix)', function (assert) {
    var origClockStart = clockStart;
    var origClockInt = clockInt;
    // Set clockStart to a known value
    var knownStart = Date.now() - 5000;
    clockStart = knownStart;
    startClock();
    assert.equal(clockStart, knownStart, 'clockStart was not overwritten when already set');
    // Clean up
    clearInterval(clockInt);
    clockStart = origClockStart;
    clockInt = origClockInt;
  });

  QUnit.test('Multiple simTimeout with same delay all execute', function (assert) {
    var done = assert.async();
    var origTimers = simTimers;
    var origPaused = simPaused;
    simTimers = [];
    simPaused = false;
    var count = 0;

    simTimeout(function () { count++; }, 50);
    simTimeout(function () { count++; }, 50);
    simTimeout(function () { count++; }, 50);

    assert.equal(simTimers.length, 3, 'Three timers with same delay registered');

    setTimeout(function () {
      assert.equal(count, 3, 'All three timers with same delay fired');
      simTimers = origTimers;
      simPaused = origPaused;
      done();
    }, 150);
  });

  QUnit.test('simTimeout returns unique IDs for each call', function (assert) {
    var origTimers = simTimers;
    var origPaused = simPaused;
    simTimers = [];
    simPaused = false;
    var ids = [];
    for (var i = 0; i < 5; i++) {
      ids.push(simTimeout(function () {}, 5000));
    }
    // Check all IDs are unique
    var unique = ids.filter(function (v, idx, arr) { return arr.indexOf(v) === idx; });
    assert.equal(unique.length, 5, 'All 5 IDs are unique');
    // Clean up
    simTimers.forEach(function (t) { clearTimeout(t.nativeId); });
    simTimers = origTimers;
    simPaused = origPaused;
  });

  QUnit.test('simTimers array is empty after all timers fire', function (assert) {
    var done = assert.async();
    var origTimers = simTimers;
    var origPaused = simPaused;
    simTimers = [];
    simPaused = false;

    simTimeout(function () {}, 20);
    simTimeout(function () {}, 40);
    simTimeout(function () {}, 60);

    assert.equal(simTimers.length, 3, 'Three timers registered');

    setTimeout(function () {
      assert.equal(simTimers.length, 0, 'simTimers is empty after all timers fired');
      simTimers = origTimers;
      simPaused = origPaused;
      done();
    }, 150);
  });
});
