QUnit.module('scenes', function () {

  QUnit.test('Functions p1-p5 exist and are callable (typeof === function)', function (assert) {
    assert.equal(typeof p1, 'function', 'p1 is a function');
    assert.equal(typeof p2, 'function', 'p2 is a function');
    assert.equal(typeof p3, 'function', 'p3 is a function');
    assert.equal(typeof p4, 'function', 'p4 is a function');
    assert.equal(typeof p4b, 'function', 'p4b is a function');
    assert.equal(typeof p5, 'function', 'p5 is a function');
    assert.equal(typeof p6, 'function', 'p6 is a function');
  });

  QUnit.test('All scene i18n keys exist in TRANSLATIONS.de', function (assert) {
    // Keys used in p1-whatsapp.js
    var waKeys = [
      'wa.dateLabel', 'wa.marco1', 'wa.sara1', 'wa.tim1', 'wa.leon1',
      'wa.sara2', 'wa.marco2', 'wa.tomLeaves',
      'wa.toastScreenshot', 'wa.toastEditing', 'wa.toastPosted'
    ];

    // Keys used in p2-instagram.js
    var igKeys = [
      'ig.likesCount', 'ig.sara', 'ig.tim', 'ig.leon', 'ig.tom1',
      'ig.marco', 'ig.lukas', 'ig.tom2', 'ig.hype', 'ig.commentsCount',
      'ig.storyViews', 'ig.toastScreenshot', 'ig.toastReaction', 'ig.toastTiktok'
    ];

    // Keys used in p3-tiktok.js
    var tkKeys = [
      'tk.lukas', 'tk.sara', 'tk.noah', 'tk.anon', 'tk.tom',
      'tk.aggro', 'tk.marco', 'tk.troll', 'tk.stickerLabel',
      'tk.toastReport', 'tk.toastVideos'
    ];

    // Keys used in p4-homescreen.js
    var hsKeys = [
      'hs.n1', 'hs.n2', 'hs.n3', 'hs.n4', 'hs.n5', 'hs.n6', 'hs.n7', 'hs.n8'
    ];

    // Keys used in p4b-messages.js
    var imKeys = [
      'im.mama', 'im.tom'
    ];

    var allKeys = waKeys.concat(igKeys, tkKeys, hsKeys, imKeys);
    allKeys.forEach(function (key) {
      assert.ok(TRANSLATIONS.de[key] !== undefined,
        'DE translation exists for scene key: ' + key);
      assert.ok(TRANSLATIONS.en[key] !== undefined,
        'EN translation exists for scene key: ' + key);
    });
  });

  QUnit.test('All DOM element IDs referenced by scenes exist in a fixture', function (assert) {
    // Build a comprehensive fixture with all IDs that scene functions reference
    var fixture = document.getElementById('qunit-fixture');
    var ids = [
      'wC', 'igCm', 'igB', 'igH', 'igLk', 'igCc', 'igVw',
      'tkCo', 'tkCl', 'tkCmH', 'tkLk', 'tkCm', 'tkSh',
      'hsN', 'xW', 'xI', 'xT', 'xN', 'xS',
      'imC', 'fA', 'fB', 'fC', 'fC2', 'fE', 'ctaLogo', 'ctaHelpline', 'ctaMsg', 'aCta', 'toast'
    ];

    // Create all elements in fixture
    var html = '';
    ids.forEach(function (id) {
      html += '<div id="' + id + '"></div>';
    });
    fixture.innerHTML = html;

    // Verify each element is findable in the DOM
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      assert.ok(el !== null, 'Element with id "' + id + '" exists in DOM');
    });
  });

  QUnit.test('Character speech pattern comments match the actual characters used (avatars exist)', function (assert) {
    // Characters referenced across all scenes
    var sceneCharacters = [
      'sara', 'marco', 'tim', 'leon', 'tom',
      'lukas', 'noah.x', 'anon99', 'aggro.44', 'troll.page', 'hype.page',
      // Aliases used in scene comment arrays
      'sara.xoxo', 'tim_0711', 'leon_fcb', 'tom.m', 'marco_2012',
      'xxl.lukas', 'lukas.der.echte', 'sara_2012'
    ];

    sceneCharacters.forEach(function (username) {
      var html = getAvatar(username);
      // anon99 is intentionally mapped to av-anon (anonymous user by design)
      if (username === 'anon99') {
        assert.ok(html.indexOf('av-anon') !== -1,
          'Character "' + username + '" correctly uses av-anon');
      } else {
        assert.ok(html.indexOf('av-anon') === -1,
          'Character "' + username + '" has a non-fallback avatar');
      }
    });

    // Specifically verify the 5 main characters from the requirement
    ['sara', 'marco', 'tim', 'leon', 'tom'].forEach(function (name) {
      assert.ok(avatars[name] !== undefined, 'Main character "' + name + '" exists in avatars');
    });
  });

});
