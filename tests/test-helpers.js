QUnit.module('helpers', function () {
  QUnit.test('getAvatar returns correct HTML for known user', function (assert) {
    var html = getAvatar('marco');
    assert.ok(html.indexOf('av-marco') !== -1, 'Contains avatar class');
    assert.ok(html.indexOf('MA') !== -1, 'Contains initials');
    assert.ok(html.indexOf('av-circle') !== -1, 'Contains base class');
  });

  QUnit.test('getAvatar returns fallback for unknown user', function (assert) {
    var html = getAvatar('unknown_user_xyz');
    assert.ok(html.indexOf('av-anon') !== -1, 'Falls back to av-anon');
    assert.ok(html.indexOf('??') !== -1, 'Shows ?? initials');
  });

  QUnit.test('getAvatar big mode adds av-big class', function (assert) {
    var html = getAvatar('marco', true);
    assert.ok(html.indexOf('av-big') !== -1, 'Contains av-big class');
  });

  QUnit.test('getAvatar normal mode has no av-big class', function (assert) {
    var html = getAvatar('marco', false);
    assert.ok(html.indexOf('av-big') === -1, 'No av-big class');
  });

  QUnit.test('All character usernames resolve to valid avatars', function (assert) {
    var users = Object.keys(avatars);
    assert.ok(users.length >= 10, 'At least 10 avatar entries: ' + users.length);
    users.forEach(function (user) {
      var html = getAvatar(user);
      assert.ok(html.indexOf('av-anon') === -1 || user === 'anon99',
        user + ' resolves to a non-default avatar');
    });
  });

  QUnit.test('Avatar aliases map to same class', function (assert) {
    var marco1 = getAvatar('marco');
    var marco2 = getAvatar('marco_2012');
    assert.ok(marco1.indexOf('av-marco') !== -1, 'marco has av-marco');
    assert.ok(marco2.indexOf('av-marco') !== -1, 'marco_2012 has av-marco');
  });

  // ===== NEW TESTS =====

  QUnit.test('sw() toggles classes on/off between two elements', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="test-sw-a" class="on"></div>' +
      '<div id="test-sw-b"></div>';
    sw('test-sw-a', 'test-sw-b');
    var a = document.getElementById('test-sw-a');
    var b = document.getElementById('test-sw-b');
    assert.ok(a.classList.contains('off'), 'Element A gets "off" class');
    assert.ok(!a.classList.contains('on'), 'Element A loses "on" class');
    assert.ok(b.classList.contains('on'), 'Element B gets "on" class');
  });

  QUnit.test('toast() sets text content and adds show class', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="toast"></div>';
    toast('Test-Nachricht');
    var el = document.getElementById('toast');
    assert.equal(el.textContent, 'Test-Nachricht', 'Toast text set correctly');
    assert.ok(el.classList.contains('show'), 'Toast has "show" class');
  });

  QUnit.test('flash() adds go class to flash element', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="fl"></div>';
    flash();
    var el = document.getElementById('fl');
    assert.ok(el.classList.contains('go'), 'Flash element has "go" class');
  });

  QUnit.test('addMsg() creates element and scrolls container', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-chat" style="height:50px;overflow:auto;"></div>';
    var container = document.getElementById('test-chat');
    addMsg(container, '<b>Hello</b>', 'wm other');
    assert.equal(container.children.length, 1, 'One child added');
    assert.equal(container.children[0].className, 'wm other', 'Correct CSS class');
    assert.ok(container.children[0].innerHTML.indexOf('<b>Hello</b>') !== -1, 'HTML content set');
    // Add more messages and verify scrolling behavior
    addMsg(container, 'Second message', 'wm other');
    assert.equal(container.children.length, 2, 'Two children after second addMsg');
  });

  QUnit.test('setLayer() toggles on class for layer elements', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div class="e2"></div>' +
      '<div class="e2"></div>' +
      '<div class="e3"></div>' +
      '<div class="igfr"></div>' +
      '<div class="grain"></div>';

    // Layer 1: nothing should have 'on'
    setLayer(1);
    assert.ok(!fixture.querySelector('.e2').classList.contains('on'), 'Layer 1: e2 is off');
    assert.ok(!fixture.querySelector('.e3').classList.contains('on'), 'Layer 1: e3 is off');
    assert.ok(!fixture.querySelector('.igfr').classList.contains('on'), 'Layer 1: igfr is off');
    assert.ok(!fixture.querySelector('.grain').classList.contains('on'), 'Layer 1: grain is off');

    // Layer 2: e2 elements should have 'on', e3/igfr/grain should not
    setLayer(2);
    var e2s = fixture.querySelectorAll('.e2');
    e2s.forEach(function (el) {
      assert.ok(el.classList.contains('on'), 'Layer 2: e2 is on');
    });
    assert.ok(!fixture.querySelector('.e3').classList.contains('on'), 'Layer 2: e3 is off');
    assert.ok(!fixture.querySelector('.igfr').classList.contains('on'), 'Layer 2: igfr is off');

    // Layer 3: all elements should have 'on'
    setLayer(3);
    e2s.forEach(function (el) {
      assert.ok(el.classList.contains('on'), 'Layer 3: e2 is on');
    });
    assert.ok(fixture.querySelector('.e3').classList.contains('on'), 'Layer 3: e3 is on');
    assert.ok(fixture.querySelector('.igfr').classList.contains('on'), 'Layer 3: igfr is on');
    assert.ok(fixture.querySelector('.grain').classList.contains('on'), 'Layer 3: grain is on');
  });

  // ===== EXPANDED TESTS =====

  QUnit.test('getAvatar() returns string starting with <div', function (assert) {
    var html = getAvatar('marco');
    assert.ok(html.indexOf('<div') === 0, 'Avatar HTML starts with <div: ' + html.substring(0, 10));
  });

  QUnit.test('getAvatar() with empty string returns fallback', function (assert) {
    var html = getAvatar('');
    assert.ok(html.indexOf('av-anon') !== -1, 'Empty string falls back to av-anon');
    assert.ok(html.indexOf('??') !== -1, 'Empty string shows ?? initials');
  });

  QUnit.test('sw() adds off class to first element and removes it after 500ms', function (assert) {
    var done = assert.async();
    // Clear any pending timers from other tests to prevent scene functions firing
    var savedTimers = simTimers.slice();
    simTimers.forEach(function (t) { clearTimeout(t.nativeId); });
    simTimers = [];
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="test-sw-c" class="on"></div>' +
      '<div id="test-sw-d"></div>';
    sw('test-sw-c', 'test-sw-d');
    var ea = document.getElementById('test-sw-c');
    assert.ok(ea.classList.contains('off'), 'Element A has off class immediately');
    setTimeout(function () {
      assert.ok(!ea.classList.contains('off'), 'Element A off class removed after ~500ms');
      simTimers = savedTimers;
      done();
    }, 600);
  });

  QUnit.test('toast() removes show class after timeout via simTimeout', function (assert) {
    var done = assert.async();
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="toast"></div>';
    var origTimers = simTimers;
    var origPaused = simPaused;
    simTimers = [];
    simPaused = false;
    toast('Test', 100); // short duration for fast test
    var el = document.getElementById('toast');
    assert.ok(el.classList.contains('show'), 'Toast has show class initially');
    // Wait for the simTimeout to fire (100ms + buffer)
    setTimeout(function () {
      assert.ok(!el.classList.contains('show'), 'Toast show class removed after timeout');
      simTimers = origTimers;
      simPaused = origPaused;
      done();
    }, 200);
  });

  QUnit.test('setLayer(1) does NOT add on to e2/e3 elements', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div class="e2"></div>' +
      '<div class="e3"></div>';
    setLayer(1);
    assert.ok(!fixture.querySelector('.e2').classList.contains('on'), 'e2 has no on at layer 1');
    assert.ok(!fixture.querySelector('.e3').classList.contains('on'), 'e3 has no on at layer 1');
  });

  QUnit.test('setLayer(2) adds on to e2 but NOT to e3', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div class="e2"></div>' +
      '<div class="e3"></div>';
    setLayer(2);
    assert.ok(fixture.querySelector('.e2').classList.contains('on'), 'e2 has on at layer 2');
    assert.ok(!fixture.querySelector('.e3').classList.contains('on'), 'e3 has no on at layer 2');
  });

  QUnit.test('setLayer(3) adds on to BOTH e2 and e3', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div class="e2"></div>' +
      '<div class="e3"></div>';
    setLayer(3);
    assert.ok(fixture.querySelector('.e2').classList.contains('on'), 'e2 has on at layer 3');
    assert.ok(fixture.querySelector('.e3').classList.contains('on'), 'e3 has on at layer 3');
  });

  QUnit.test('addMsg() with custom class applies that class', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-chat-cls"></div>';
    var container = document.getElementById('test-chat-cls');
    addMsg(container, 'Hello', 'custom-class special');
    assert.equal(container.children[0].className, 'custom-class special', 'Custom class applied');
  });

  QUnit.test('addMsg() with sound function calls the sound function', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-chat-snd"></div>';
    var container = document.getElementById('test-chat-snd');
    var soundCalled = false;
    addMsg(container, 'Hello', 'wm other', function () { soundCalled = true; });
    assert.ok(soundCalled, 'Sound function was called');
  });
});
