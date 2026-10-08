QUnit.module(
  'stage (projector view)',
  {
    beforeEach: function () {
      this._origWanted = stageWanted;
      this._origLang = currentLang;
      currentLang = 'de';
      // Minimal copy of the stage skeleton and the phone containers it mirrors
      document.getElementById('qunit-fixture').innerHTML =
        '<button id="viewPhoneBtn" data-view="phone"></button>' +
        '<button id="viewBeamerBtn" data-view="beamer"></button>' +
        '<button id="runPhoneBtn" data-view="phone"></button>' +
        '<button id="runBeamerBtn" data-view="beamer"></button>' +
        '<div id="toast"></div>' +
        '<div id="phone" class="hidden"><div class="scr">' +
        '<div class="app" id="aWa"><div id="wC"></div></div>' +
        '<div class="app" id="aIg"><svg id="igH" fill="none"></svg><div id="igLk"></div>' +
        '<div id="igCc"></div><div id="igVw"></div><div id="igCm"></div></div>' +
        '<div class="app tk" id="aTk"><span id="tkLk"></span><span id="tkCm"></span>' +
        '<span id="tkSh"></span><div id="tkCl"></div></div>' +
        '<div class="app" id="aHs"><div id="hsClock"></div><div id="hsDate"></div><div id="hsN"></div>' +
        '<div id="xW"></div><div id="xI"></div><div id="xT"></div><div id="xN"></div><div id="xS"></div></div>' +
        '<div class="app" id="aIm"><div id="imC"></div></div>' +
        '<div class="app" id="aFn"><div id="fA"></div><div id="fB"></div><div id="fC"></div>' +
        '<div id="fC2"></div><div id="fE"></div></div>' +
        '</div></div>' +
        '<div id="stage"><div class="st-frame">' +
        '<div class="st-scene" id="stWa" data-app="aWa"><div class="st-media" id="stWaMedia">' +
        '<div id="stWaPh"></div></div><div class="st-list" id="stWaList"></div>' +
        '<div class="st-sys" id="stWaSys"></div></div>' +
        '<div class="st-scene" id="stIg" data-app="aIg"><div id="stIgPh"></div><span id="stIgHeart"></span>' +
        '<span id="stIgLk"></span><div id="stIgCc"></div><div id="stIgVw"></div>' +
        '<div class="st-list" id="stIgList"></div></div>' +
        '<div class="st-scene" id="stTk" data-app="aTk"><div id="stTkPh"></div><span id="stTkLk"></span>' +
        '<span id="stTkCm"></span><span id="stTkSh"></span><div class="st-list" id="stTkList"></div>' +
        '<div id="stTkRpt"></div></div>' +
        '<div class="st-scene" id="stHs" data-app="aHs"><div id="stHsClock"></div><div id="stHsDate"></div>' +
        '<div id="stXW"></div><div id="stXI"></div><div id="stXT"></div><div id="stXN"></div>' +
        '<div id="stXS"></div><div class="st-list" id="stHsList"></div></div>' +
        '<div class="st-scene" id="stIm" data-app="aIm"><div class="st-list" id="stImList"></div></div>' +
        '<div class="st-scene" id="stFn" data-app="aFn"><div id="stFA"></div><div id="stFB"></div>' +
        '<div id="stFC"></div><div id="stFC2"></div><div id="stFE"></div></div>' +
        '<div id="stNote"></div>' +
        '</div></div>';
    },
    afterEach: function () {
      stageWanted = this._origWanted;
      currentLang = this._origLang;
      document.body.classList.remove('beamer', 'stage-live');
    },
  },
  function () {
    /** Live (not fading out) large items of a stage list. */
    function live(listId) {
      return document.getElementById(listId).querySelectorAll('.st-item:not(.out)');
    }

    /** Builds a detached element from an HTML string. */
    function el(html) {
      var d = document.createElement('div');
      d.innerHTML = html;
      return d.firstChild;
    }

    // ----- switching on: URL, state, labels -----

    QUnit.test('stageFromUrl() accepts exactly beamer=1', function (assert) {
      assert.strictEqual(stageFromUrl('?beamer=1'), true, '?beamer=1 switches on');
      assert.strictEqual(stageFromUrl('?lang=en&beamer=1'), true, 'works as second parameter');
      assert.strictEqual(stageFromUrl('?beamer=1&lang=en'), true, 'works as first parameter');
      assert.strictEqual(stageFromUrl(''), false, 'no parameter: off');
      assert.strictEqual(stageFromUrl('?beamer=0'), false, 'beamer=0: off');
      assert.strictEqual(stageFromUrl('?beamer=true'), false, 'beamer=true: off');
      assert.strictEqual(stageFromUrl('?beamer=11'), false, 'beamer=11: off');
      assert.strictEqual(stageFromUrl('?xbeamer=1'), false, 'other parameter name: off');
    });

    QUnit.test('stageUrl() adds and removes the parameter, keeps the rest', function (assert) {
      assert.equal(
        stageUrl('https://x.test/', true),
        'https://x.test/?beamer=1',
        'adds to bare URL'
      );
      assert.equal(
        stageUrl('https://x.test/?lang=en', true),
        'https://x.test/?lang=en&beamer=1',
        'appends to existing query'
      );
      assert.equal(
        stageUrl('https://x.test/?lang=en&beamer=1#top', false),
        'https://x.test/?lang=en#top',
        'removes, keeps other parameter and hash'
      );
      assert.equal(
        stageUrl('https://x.test/?beamer=1', false),
        'https://x.test/',
        'removes only one'
      );
      assert.equal(
        stageUrl('https://x.test/?beamer=1', true),
        'https://x.test/?beamer=1',
        'no duplicate when already set'
      );
    });

    QUnit.test('shareSimulation() never shares the projector parameter', function (assert) {
      assert.equal(
        stageUrl('https://cybermobbing.web.app/?beamer=1&lang=en', false),
        'https://cybermobbing.web.app/?lang=en',
        'share URL is built without beamer=1'
      );
    });

    QUnit.test('stageSet() sets the body class and marks the chosen view', function (assert) {
      stageSet(true);
      assert.ok(document.body.classList.contains('beamer'), 'body has class beamer');
      ['viewBeamerBtn', 'runBeamerBtn'].forEach(function (id) {
        assert.equal(
          document.getElementById(id).getAttribute('aria-pressed'),
          'true',
          id + ' pressed in projector view'
        );
      });
      ['viewPhoneBtn', 'runPhoneBtn'].forEach(function (id) {
        assert.equal(
          document.getElementById(id).getAttribute('aria-pressed'),
          'false',
          id + ' not pressed in projector view'
        );
      });
      stageSet(false);
      assert.ok(!document.body.classList.contains('beamer'), 'body class removed');
      ['viewBeamerBtn', 'runBeamerBtn'].forEach(function (id) {
        assert.equal(
          document.getElementById(id).getAttribute('aria-pressed'),
          'false',
          id + ' not pressed in phone view'
        );
      });
      ['viewPhoneBtn', 'runPhoneBtn'].forEach(function (id) {
        assert.equal(
          document.getElementById(id).getAttribute('aria-pressed'),
          'true',
          id + ' pressed in phone view'
        );
      });
    });

    QUnit.test('stageFit() scales the phone to STAGE_PHONE_H stage units', function (assert) {
      stageFit();
      var unit = Math.min(window.innerWidth / 100, window.innerHeight / 56.25);
      var k = parseFloat(document.documentElement.style.getPropertyValue('--st-phone-k'));
      assert.ok(k > 0, 'a positive scale factor is set');
      assert.ok(
        Math.abs(k * STAGE_PHONE_PX - STAGE_PHONE_H * unit) < 0.01,
        'scaled phone height equals ' + STAGE_PHONE_H + ' stage units'
      );
      assert.strictEqual(STAGE_PHONE_PX, 852, 'pixel height matches the .phone rule in styles.css');
    });

    QUnit.test('stageToggle() flips the state', function (assert) {
      stageSet(false);
      stageToggle();
      assert.strictEqual(stageWanted, true, 'off -> on');
      stageToggle();
      assert.strictEqual(stageWanted, false, 'on -> off');
    });

    QUnit.test('stage is live only while the phone phase is running', function (assert) {
      var phone = document.getElementById('phone');
      stageSet(true);
      assert.ok(
        !document.body.classList.contains('stage-live'),
        'not live before start (phone hidden)'
      );
      phone.classList.remove('hidden');
      stageSync();
      assert.ok(document.body.classList.contains('stage-live'), 'live once the phone is shown');
      stageSet(false);
      assert.ok(!document.body.classList.contains('stage-live'), 'not live in phone view');
      stageSet(true);
      phone.classList.add('hidden');
      stageSync();
      assert.ok(
        !document.body.classList.contains('stage-live'),
        'not live on the final help screen'
      );
    });

    QUnit.test('new i18n keys exist in both languages', function (assert) {
      [
        'ui.viewLabel',
        'ui.viewPhone',
        'ui.viewBeamer',
        'ui.viewPhoneLong',
        'ui.viewBeamerLong',
        'ui.beamerHint',
      ].forEach(function (k) {
        assert.ok(TRANSLATIONS.de[k], 'de: ' + k);
        assert.ok(TRANSLATIONS.en[k], 'en: ' + k);
      });
    });

    // ----- at most two large messages -----

    QUnit.test('stagePush() keeps at most STAGE_MAX_ITEMS live items', function (assert) {
      assert.strictEqual(STAGE_MAX_ITEMS, 2, 'limit is two (inclusive)');
      var list = document.getElementById('stWaList');
      stagePush(list, stageBubble('st-wa-b', 'A', 'eins'), STAGE_MAX_ITEMS);
      assert.equal(live('stWaList').length, 1, 'one item live');
      stagePush(list, stageBubble('st-wa-b', 'B', 'zwei'), STAGE_MAX_ITEMS);
      assert.equal(live('stWaList').length, 2, 'two items live (limit reached, none dropped)');
      assert.ok(live('stWaList')[0].classList.contains('old'), 'previous item is dimmed');
      assert.ok(!live('stWaList')[1].classList.contains('old'), 'newest item is not dimmed');
      stagePush(list, stageBubble('st-wa-b', 'C', 'drei'), STAGE_MAX_ITEMS);
      assert.equal(live('stWaList').length, 2, 'third item pushes the oldest out');
      assert.equal(
        live('stWaList')[1].querySelector('.st-text').textContent,
        'drei',
        'newest is last'
      );
      assert.equal(list.querySelectorAll('.st-item.out').length, 1, 'oldest is fading out');
      stagePush(list, stageBubble('st-wa-b', 'D', 'vier'), STAGE_MAX_ITEMS);
      assert.equal(
        list.querySelectorAll('.st-item.out').length,
        1,
        'earlier faded item was removed'
      );
      assert.equal(list.querySelectorAll('.st-item').length, 3, 'list does not grow');
    });

    // ----- WhatsApp -----

    QUnit.test('WhatsApp text message is shown large without time stamp', function (assert) {
      stageOnWa(
        el(
          '<div class="wm other"><span class="who who-sara">Sara</span>HAHA <span class="meta">18:53</span></div>'
        ),
        true
      );
      var items = live('stWaList');
      assert.equal(items.length, 1, 'one large item');
      assert.equal(items[0].querySelector('.st-name').textContent, 'Sara', 'name shown');
      assert.ok(
        items[0].querySelector('.st-name').classList.contains('who-sara'),
        'name keeps colour class'
      );
      assert.equal(
        items[0].querySelector('.st-text').textContent,
        'HAHA',
        'text shown, time stamp dropped'
      );
    });

    QUnit.test('WhatsApp photo message shows the photo area and its caption', function (assert) {
      assert.ok(
        !document.getElementById('stWaMedia').classList.contains('on'),
        'photo hidden first'
      );
      stageOnWa(
        el(
          '<div class="wm-photo"><span class="who who-marco">Marco</span><div class="img"></div>' +
            '<div class="cap">ey schaut <span class="meta">18:53</span></div></div>'
        ),
        true
      );
      assert.ok(
        document.getElementById('stWaMedia').classList.contains('on'),
        'photo area switched on'
      );
      assert.equal(
        live('stWaList')[0].querySelector('.st-text').textContent,
        'ey schaut',
        'caption shown'
      );
      assert.equal(
        live('stWaList')[0].querySelector('.st-name').textContent,
        'Marco',
        'sender shown'
      );
    });

    QUnit.test('WhatsApp sticker is shown as a large item', function (assert) {
      stageOnWa(
        el(
          '<div class="wm-sticker"><img src="x.png"><div class="stk-emoji">X</div><div class="meta">1</div></div>'
        ),
        true
      );
      var item = live('stWaList')[0];
      assert.ok(item.querySelector('img'), 'sticker image present');
      assert.ok(!item.querySelector('.meta'), 'time stamp dropped');
    });

    QUnit.test('WhatsApp system line does not use up a message slot', function (assert) {
      stageOnWa(el('<div class="wm other"><span class="who">A</span>eins</div>'), true);
      stageOnWa(el('<div class="wm other"><span class="who">B</span>zwei</div>'), true);
      stageOnWa(el('<div class="wa-sys">Tom hat die Gruppe verlassen</div>'), true);
      assert.equal(live('stWaList').length, 2, 'both messages still shown');
      assert.equal(
        document.getElementById('stWaSys').textContent,
        'Tom hat die Gruppe verlassen',
        'system line shown in its own row'
      );
      assert.ok(
        document.getElementById('stWaSys').classList.contains('show'),
        'system line visible'
      );
    });

    QUnit.test('typing indicator appears and disappears with the phone', function (assert) {
      var typ = el('<div class="wa-typ"><i></i><i></i><i></i></div>');
      stageOnWa(typ, true);
      assert.equal(
        document.getElementById('stWaList').querySelectorAll('.st-typing').length,
        1,
        'shown'
      );
      assert.equal(live('stWaList').length, 0, 'typing is not counted as a message');
      stageOnWa(typ, false);
      assert.equal(
        document.getElementById('stWaList').querySelectorAll('.st-typing').length,
        0,
        'removed'
      );
    });

    // ----- Instagram -----

    QUnit.test('Instagram comment is shown large, the victim comment is marked', function (assert) {
      stageOnIg(
        el(
          '<div class="ig-c"><span class="ig-av-inline"><div class="av-circle av-sara">SA</div></span><b>sara.xoxo</b> HAHA</div>'
        )
      );
      stageOnIg(
        el(
          '<div class="ig-c vic"><span class="ig-av-inline"><div class="av-circle av-tom">TO</div></span><b>tom.m</b> Bitte</div>'
        )
      );
      var items = live('stIgList');
      assert.equal(items.length, 2, 'two comments');
      assert.ok(
        items[0].querySelector('.st-name').textContent.indexOf('sara.xoxo') !== -1,
        'user name'
      );
      assert.ok(items[0].querySelector('.av-circle'), 'avatar kept');
      assert.equal(items[0].querySelector('.st-text').textContent, 'HAHA', 'comment text');
      assert.ok(items[1].classList.contains('vic'), 'victim comment marked');
      assert.ok(!items[0].classList.contains('vic'), 'other comment not marked');
    });

    QUnit.test('stageMirror() copies counters', function (assert) {
      document.getElementById('igLk').textContent = '197 Angaben';
      stageMirror('igLk', 'stIgLk');
      assert.equal(
        document.getElementById('stIgLk').textContent,
        '197 Angaben',
        'like counter copied'
      );
      document.getElementById('tkLk').textContent = '4.7k';
      stageMirror('tkLk', 'stTkLk');
      assert.equal(document.getElementById('stTkLk').textContent, '4.7k', 'TikTok counter copied');
    });

    QUnit.test('Instagram heart turns red with the phone', function (assert) {
      stageOnHeart();
      assert.ok(
        !document.getElementById('stIgHeart').classList.contains('on'),
        'grey while unliked'
      );
      document.getElementById('igH').setAttribute('fill', '#fe2c55');
      stageOnHeart();
      assert.ok(document.getElementById('stIgHeart').classList.contains('on'), 'red once liked');
    });

    // ----- TikTok -----

    QUnit.test('TikTok comment and sticker are shown large', function (assert) {
      stageOnTk(
        el(
          '<div class="tc vic"><div class="av-circle av-tom av-big">TO</div><div><div class="nm">@tom.m</div><div class="tx">Das bin ich.</div></div></div>'
        )
      );
      stageOnTk(
        el(
          '<div class="tc"><div class="av-circle av-aggro av-big">AG</div><div><div class="nm">@aggro.44</div>' +
            '<div class="tk-sticker-wrap"><img class="tk-sticker-img" src="x.png"><div class="tk-sticker-lbl">OPFER</div></div></div></div>'
        )
      );
      var items = live('stTkList');
      assert.equal(items.length, 2, 'comment and sticker');
      assert.ok(items[0].classList.contains('vic'), 'victim comment marked');
      assert.ok(
        items[0].querySelector('.st-name').textContent.indexOf('@tom.m') !== -1,
        'user name'
      );
      assert.equal(items[0].querySelector('.st-text').textContent, 'Das bin ich.', 'comment text');
      assert.ok(items[1].querySelector('img'), 'sticker image shown');
      assert.equal(
        items[1].querySelector('.tk-sticker-lbl').textContent,
        'OPFER',
        'sticker label shown'
      );
    });

    QUnit.test('TikTok report notice is shown', function (assert) {
      stageOnTkReport(el('<div class="tk-rpt">Deine Meldung wird geprueft</div>'));
      var r = document.getElementById('stTkRpt');
      assert.equal(r.textContent, 'Deine Meldung wird geprueft', 'notice text');
      assert.ok(r.classList.contains('show'), 'notice visible');
    });

    // ----- Homescreen -----

    QUnit.test('Homescreen keeps at most STAGE_MAX_NOTIFS notifications', function (assert) {
      assert.strictEqual(STAGE_MAX_NOTIFS, 3, 'limit is three (inclusive)');
      for (var i = 1; i <= 4; i++) {
        stageOnHs(
          el(
            '<div class="hs-n"><div class="ico hs-ico-wa">X</div><div><strong>N' +
              i +
              '</strong> t</div></div>'
          )
        );
      }
      var items = live('stHsList');
      assert.equal(items.length, 3, 'three live after four pushes');
      assert.ok(items[2].textContent.indexOf('N4') !== -1, 'newest is last');
      assert.ok(items[0].textContent.indexOf('N2') !== -1, 'oldest live one is the second');
      assert.ok(items[0].querySelector('.ico'), 'icon kept');
    });

    // ----- Messages -----

    QUnit.test('Messages: both bubbles and the hesitating typing dots', function (assert) {
      stageOnIm(el('<div class="im-bub received">Tom, Schatz?</div>'), true);
      var typ = el('<div class="im-typ"><i></i><i></i><i></i></div>');
      stageOnIm(typ, true);
      assert.equal(
        document.getElementById('stImList').querySelectorAll('.st-typing').length,
        1,
        'dots shown'
      );
      stageOnIm(typ, false);
      assert.equal(
        document.getElementById('stImList').querySelectorAll('.st-typing').length,
        0,
        'dots gone'
      );
      stageOnIm(el('<div class="im-bub vic">Mama, ich halt das nicht mehr aus.</div>'), true);
      var items = live('stImList');
      assert.equal(items.length, 2, 'two bubbles');
      assert.ok(items[0].classList.contains('received'), 'first is the received one');
      assert.ok(items[1].classList.contains('vic'), 'second is the victim reply');
      assert.equal(items[1].textContent, 'Mama, ich halt das nicht mehr aus.', 'reply text');
    });

    // ----- Finale, notices, scene switching -----

    QUnit.test('Finale lines follow the phone', function (assert) {
      stageOnFinale();
      assert.ok(!document.getElementById('stFA').classList.contains('show'), 'hidden first');
      document.getElementById('fA').classList.add('show');
      document.getElementById('fE').classList.add('show');
      stageOnFinale();
      assert.ok(document.getElementById('stFA').classList.contains('show'), 'line 1 shown');
      assert.ok(document.getElementById('stFE').classList.contains('show'), 'line 5 shown');
      assert.ok(!document.getElementById('stFB').classList.contains('show'), 'line 2 still hidden');
    });

    QUnit.test('notices get their own row and do not use a message slot', function (assert) {
      stageOnWa(el('<div class="wm other"><span class="who">A</span>eins</div>'), true);
      stageOnWa(el('<div class="wm other"><span class="who">B</span>zwei</div>'), true);
      var toastEl = document.getElementById('toast');
      toastEl.textContent = 'Sara hat einen Screenshot gemacht';
      toastEl.classList.add('show');
      stageOnToast();
      var note = document.getElementById('stNote');
      assert.equal(note.textContent, 'Sara hat einen Screenshot gemacht', 'notice text copied');
      assert.ok(note.classList.contains('show'), 'notice visible');
      assert.equal(live('stWaList').length, 2, 'both messages still shown');
      toastEl.classList.remove('show');
      stageOnToast();
      assert.ok(!note.classList.contains('show'), 'notice hidden with the toast');
    });

    QUnit.test('stageShowApp() shows exactly the panel of the active app', function (assert) {
      stageShowApp('aIg');
      assert.ok(document.getElementById('stIg').classList.contains('on'), 'Instagram panel on');
      assert.equal(document.querySelectorAll('#stage .st-scene.on').length, 1, 'only one panel on');
      stageShowApp('aTk');
      assert.ok(document.getElementById('stTk').classList.contains('on'), 'TikTok panel on');
      assert.ok(!document.getElementById('stIg').classList.contains('on'), 'Instagram panel off');
      assert.equal(document.querySelectorAll('#stage .st-scene.on').length, 1, 'still only one');
    });

    // ----- wiring: the real observers pick up what the scenes do -----

    QUnit.test('stageInit() wires the observers to the phone (integration)', function (assert) {
      var done = assert.async();
      stageInit();
      addMsg(
        document.getElementById('wC'),
        '<span class="who who-tim">Tim</span>bro <span class="meta">1</span>'
      );
      document.getElementById('igLk').textContent = '42 Angaben';
      document.getElementById('aIg').classList.add('on');
      var toastEl = document.getElementById('toast');
      toastEl.textContent = 'Hinweis';
      toastEl.classList.add('show');
      // MutationObserver callbacks run as microtasks; a macrotask is safely after them
      setTimeout(function () {
        assert.equal(live('stWaList').length, 1, 'message mirrored by the observer');
        assert.equal(
          live('stWaList')[0].querySelector('.st-text').textContent,
          'bro',
          'text correct'
        );
        assert.equal(
          document.getElementById('stIgLk').textContent,
          '42 Angaben',
          'counter mirrored'
        );
        assert.ok(
          document.getElementById('stIg').classList.contains('on'),
          'panel follows the active app'
        );
        assert.ok(document.getElementById('stNote').classList.contains('show'), 'notice mirrored');
        done();
      }, 20);
    });

    QUnit.test('stageInit() builds the three stage photos', function (assert) {
      stageInit();
      ['stWaPh', 'stIgPh', 'stTkPh'].forEach(function (id) {
        assert.ok(document.getElementById(id).querySelector('.photo-wrap'), id + ' has a photo');
      });
      setLayer(2);
      assert.ok(
        document.getElementById('stIgPh').querySelector('.e2').classList.contains('on'),
        'stage photo follows setLayer()'
      );
      setLayer(1);
    });
  }
);
