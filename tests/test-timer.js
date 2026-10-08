QUnit.module(
  'timer',
  {
    beforeEach: function () {
      // Reset timer state
      sec = 0;
      // The control bar shows what the clock counts; give tick() a bar to update
      document.getElementById('qunit-fixture').innerHTML =
        '<button id="pauseBtn"></button><span id="ctlScene"></span>' +
        '<div id="ctlSeek"><div id="ctlTrack"></div></div>';
      document.getElementById('sbTime').textContent = '21:34';
      document.getElementById('hsClock').textContent = '21:34';
    },
  },
  function () {
    QUnit.test('tick increments sec by 0.1', function (assert) {
      sec = 0;
      tick();
      assert.ok(Math.abs(sec - 0.1) < 0.001, 'sec is 0.1 after one tick (actual: ' + sec + ')');
    });

    QUnit.test('tick follows the wall clock when ticks arrive late', function (assert) {
      var done = assert.async();
      sec = 10;
      tick(); // first tick after sec was set: one step
      assert.ok(Math.abs(sec - 10.1) < 0.001, 'first tick adds one step (' + sec + ')');
      // The browser delivers the next tick 300 ms late instead of after 100 ms
      setTimeout(function () {
        tick();
        var passed = sec - 10.1;
        assert.ok(
          passed > 0.25 * SIM_SPEED && passed < 0.6 * SIM_SPEED,
          'a tick 300 ms late moves the clock by about 0.3 s, not by 0.1 (' +
            passed.toFixed(3) +
            ')'
        );
        done();
      }, 300);
    });

    QUnit.test('tick moves the timeline to the elapsed share', function (assert) {
      sec = CTL_TOTAL / 2; // halfway
      tick();
      var pos = document.getElementById('ctlSeek').style.getPropertyValue('--pos');
      assert.ok(parseFloat(pos) > 49.9 && parseFloat(pos) < 50.2, 'Timeline is at ~50%: ' + pos);
    });

    QUnit.test('tick never moves the timeline beyond its end', function (assert) {
      sec = CTL_TOTAL + 3;
      tick();
      assert.equal(document.getElementById('ctlSeek').style.getPropertyValue('--pos'), '100.00%');
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

    QUnit.test('the timeline keeps moving during the closing text', function (assert) {
      function pos() {
        return parseFloat(document.getElementById('ctlSeek').style.getPropertyValue('--pos'));
      }
      sec = 120;
      tick();
      var at120 = pos();
      assert.ok(at120 > 80 && at120 < 95, 'after 120 s the timeline is not full yet: ' + at120);
      sec = 130;
      tick();
      assert.ok(pos() > at120 && pos() < 100, 'ten seconds later it has moved on: ' + pos());
      sec = CTL_TOTAL - 0.1;
      tick();
      assert.equal(pos(), 100, 'full at the end of the timeline');
    });

    QUnit.test('tick() keeps counting until the run is over, then stops itself', function (assert) {
      var done = assert.async();
      var origTmr = tmr;
      var fired = 0;
      // During the closing text the interval must stay alive
      tmr = setInterval(function () {
        fired++;
      }, 5);
      sec = CTL_TOTAL - 2;
      tick();
      setTimeout(function () {
        assert.ok(fired > 0, 'two seconds before the end the clock still runs (' + fired + ')');
        // A few seconds after the end it stops
        sec = CTL_TOTAL - 0.05;
        tick();
        var atStop = fired;
        setTimeout(function () {
          assert.equal(fired, atStop, 'after the end the interval is cleared');
          clearInterval(tmr);
          tmr = origTmr;
          done();
        }, 40);
      }, 40);
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

    QUnit.test('tick() at sec=0 leaves the timeline close to 0%', function (assert) {
      sec = 0;
      tick();
      var pos = parseFloat(document.getElementById('ctlSeek').style.getPropertyValue('--pos'));
      assert.ok(pos < 1, 'Timeline is near 0% at start: ' + pos + '%');
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

    QUnit.test(
      'startClock() does not overwrite clockStart if already set (resume fix)',
      function (assert) {
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
      }
    );

    QUnit.test('Multiple simTimeout with same delay all execute', function (assert) {
      var done = assert.async();
      var origTimers = simTimers;
      var origPaused = simPaused;
      simTimers = [];
      simPaused = false;
      var count = 0;

      simTimeout(function () {
        count++;
      }, 50);
      simTimeout(function () {
        count++;
      }, 50);
      simTimeout(function () {
        count++;
      }, 50);

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
      var unique = ids.filter(function (v, idx, arr) {
        return arr.indexOf(v) === idx;
      });
      assert.equal(unique.length, 5, 'All 5 IDs are unique');
      // Clean up
      simTimers.forEach(function (t) {
        clearTimeout(t.nativeId);
      });
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
  }
);
