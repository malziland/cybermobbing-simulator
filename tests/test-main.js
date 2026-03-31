QUnit.module('main', {
  beforeEach: function () {
    this._origSimStarted = simStarted;
    this._origCurrentLang = currentLang;
  },
  afterEach: function () {
    simStarted = this._origSimStarted;
    currentLang = this._origCurrentLang;
  }
}, function () {

  QUnit.test('simStarted guard: go() is protected by flag', function (assert) {
    // Create the minimal DOM that go() needs so it doesn't throw
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="start"></div>' +
      '<div id="pauseBtn" class="hidden"></div>' +
      '<div id="pauseOverlay"></div>' +
      '<div id="phone" class="hidden"></div>' +
      '<div id="igPh"></div>' +
      '<div id="tkBg"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    // Set simStarted = true before calling go()
    simStarted = true;
    // go() should return immediately because simStarted is true
    // The start div should NOT get the 'gone' class if go() was short-circuited
    go();
    assert.ok(!document.getElementById('start').classList.contains('gone'),
      'go() does nothing when simStarted is already true');
  });

  QUnit.test('mkPhoto() creates correct DOM structure', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-photo"></div>';
    currentLang = 'de';
    var el = document.getElementById('test-photo');
    mkPhoto(el);

    assert.ok(el.querySelector('.real-photo'), 'Contains real-photo div');
    assert.ok(el.querySelector('.edits'), 'Contains edits div');
    assert.ok(el.querySelector('.igfr'), 'Contains igfr div');
    assert.ok(el.querySelector('.grain'), 'Contains grain div');
    assert.ok(el.querySelector('.photo-wrap'), 'Contains photo-wrap wrapper');
  });

  QUnit.test('mkPhoto() sets data-user and data-likes attributes on igfr', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-photo2"></div>';
    currentLang = 'de';
    var el = document.getElementById('test-photo2');
    mkPhoto(el);

    var igfr = el.querySelector('.igfr');
    assert.ok(igfr, 'igfr element exists');
    assert.equal(igfr.getAttribute('data-user'), t('photo.igUser'), 'data-user matches i18n key');
    assert.equal(igfr.getAttribute('data-likes'), t('photo.igLikes'), 'data-likes matches i18n key');
  });

  QUnit.test('shareSimulation() shows toast with correct i18n text', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="toast" class="hidden"></div>';
    currentLang = 'de';

    // Mock clipboard to avoid actual clipboard access
    var origClipboard = navigator.clipboard;
    // We can't fully mock navigator.clipboard in all browsers,
    // so we rely on the fallback path (textarea) for HTTP contexts.
    // The function should still show the toast regardless.
    shareSimulation();

    var toastEl = document.getElementById('toast');
    assert.equal(toastEl.textContent, t('ui.linkCopied'), 'Toast text matches ui.linkCopied translation');
    assert.ok(toastEl.classList.contains('show'), 'Toast has show class');
  });

  // ===== EXPANDED TESTS =====

  QUnit.test('mkPhoto() creates elements with i18n text (photo.ugly, photo.exposed, etc.)', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-photo-i18n"></div>';
    currentLang = 'de';
    var el = document.getElementById('test-photo-i18n');
    mkPhoto(el);

    var html = el.innerHTML;
    assert.ok(html.indexOf(t('photo.ugly')) !== -1, 'Contains photo.ugly text');
    assert.ok(html.indexOf(t('photo.exposed')) !== -1, 'Contains photo.exposed text');
    assert.ok(html.indexOf(t('photo.pov')) !== -1, 'Contains photo.pov text');
    assert.ok(html.indexOf(t('photo.tags')) !== -1, 'Contains photo.tags text');
    assert.ok(html.indexOf(t('photo.bozo')) !== -1, 'Contains photo.bozo text');
  });

  QUnit.test('mkPhoto() creates exactly 5 e2 elements and 5 e3 elements', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="test-photo-count"></div>';
    currentLang = 'de';
    var el = document.getElementById('test-photo-count');
    mkPhoto(el);

    var e2s = el.querySelectorAll('.e2');
    var e3s = el.querySelectorAll('.e3');
    assert.equal(e2s.length, 5, 'Exactly 5 e2 (layer 2) elements');
    assert.equal(e3s.length, 5, 'Exactly 5 e3 (layer 3) elements');
  });

  QUnit.test('go() sets simPaused to false', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="start"></div>' +
      '<div id="pauseBtn" class="hidden"></div>' +
      '<div id="pauseOverlay"></div>' +
      '<div id="phone" class="hidden"></div>' +
      '<div id="igPh"></div>' +
      '<div id="tkBg"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    // Reset simStarted so go() will run
    simStarted = false;
    simPaused = true; // Set to true before calling go
    go();
    assert.ok(simPaused === false, 'go() sets simPaused to false');

    // Clean up intervals started by go()
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
    // Clear any simTimers created by go->p1
    simTimers.forEach(function (t) { clearTimeout(t.nativeId); });
    simTimers = [];
  });

  QUnit.test('go() resets simTimers to empty array', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML =
      '<div id="start"></div>' +
      '<div id="pauseBtn" class="hidden"></div>' +
      '<div id="pauseOverlay"></div>' +
      '<div id="phone" class="hidden"></div>' +
      '<div id="igPh"></div>' +
      '<div id="tkBg"></div>' +
      '<div id="tf" style="width:0"></div>' +
      '<div id="tl"></div>' +
      '<div id="sbTime">21:34</div>' +
      '<div id="hsClock">21:34</div>';

    // Set up some fake timers before calling go
    simStarted = false;
    simTimers = [{id: 999, fn: function(){}, remaining: 99999, nativeId: -1}];
    go();
    // go() resets simTimers to [] before starting scenes
    // The initial reset happens immediately, but p1 will add new timers after
    // We check that the fake timer we added was cleared
    var found = simTimers.some(function (t) { return t.id === 999; });
    assert.ok(!found, 'go() cleared our pre-existing fake timer');

    // Clean up
    if (typeof tmr !== 'undefined') clearInterval(tmr);
    if (typeof clockInt !== 'undefined') clearInterval(clockInt);
    simTimers.forEach(function (t) { clearTimeout(t.nativeId); });
    simTimers = [];
  });

  QUnit.test('shareSimulation() uses navigator.share on mobile user agents (mock test)', function (assert) {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="toast"></div>';
    currentLang = 'de';

    // Save originals
    var origUA = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
    var origShare = navigator.share;
    var shareCalled = false;
    var shareArgs = null;

    // Mock navigator.share
    navigator.share = function (data) {
      shareCalled = true;
      shareArgs = data;
      return Promise.resolve();
    };

    // Mock mobile user agent -- override via defineProperty
    try {
      Object.defineProperty(navigator, 'userAgent', {
        get: function () { return 'Mozilla/5.0 (iPhone; CPU OS 16_0)'; },
        configurable: true
      });

      shareSimulation();

      assert.ok(shareCalled, 'navigator.share was called on mobile');
      assert.ok(shareArgs && shareArgs.title === t('share.title'), 'Share title matches');
      assert.ok(shareArgs && shareArgs.text === t('share.text'), 'Share text matches');
    } finally {
      // Restore
      if (origUA) {
        Object.defineProperty(navigator, 'userAgent', origUA);
      }
      if (origShare) {
        navigator.share = origShare;
      } else {
        delete navigator.share;
      }
    }
  });

});
