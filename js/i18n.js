/**
 * @file i18n.js
 * @description Internationalization system for the Cybermobbing Simulation.
 *   Provides a simple key-based translation lookup with German as default.
 *   Load this file BEFORE all other app scripts.
 * @requires - (no dependencies, must be loaded first)
 */

var TRANSLATIONS = {

  de: {
    // ===== UI =====
    'ui.title': 'Wie Cybermobbing viral geht',
    'ui.titleHtml': 'Wie Cybermobbing<br><em>viral geht</em>',
    'ui.subtitle': '120-Sekunden-Simulation',
    'ui.start': 'Simulation starten',
    'ui.share': 'Simulation teilen',
    'ui.replay': 'Nochmal',
    'ui.pause': 'II',
    'ui.resume': '\u25B8',
    'ui.paused': 'Pausiert \u2014 tippe um fortzufahren',
    'ui.impressum': 'Impressum',
    'ui.close': 'Schlie\u00DFen',
    'ui.linkCopied': 'Link kopiert!',
    'ui.messages': 'Nachrichten',

    // ===== IMPRESSUM =====
    'imp.title': 'Impressum',
    'imp.subtitle': 'Cybermobbing-Simulation by malziland',
    'imp.notice': 'Diese Simulation ist ein Bildungstool zur Sensibilisierung gegen Cybermobbing. Alle dargestellten Personen, Namen und Inhalte sind frei erfunden.',
    'imp.purpose': 'Zweck: Bereitstellung und Betrieb einer interaktiven Cybermobbing-Simulation f\u00FCr Workshops zur Medienkompetenz an Schulen.',
    'imp.privacyTitle': 'Datenschutz gem\u00E4\u00DF DSGVO',
    'imp.privacyNoData': 'Diese Seite speichert keine personenbezogenen Daten. Es werden keine Cookies gesetzt, kein Tracking eingesetzt und keine IP-Adressen gespeichert.',
    'imp.privacyCounter': 'Der View-Counter speichert ausschlie\u00DFlich eine anonyme Z\u00E4hlzahl ohne Bezug zu einzelnen Besuchern. Eine Zuordnung zu Personen ist nicht m\u00F6glich.',
    'imp.privacyHosting': 'Das Hosting erfolgt \u00FCber Google Firebase (Google Ireland Ltd). Es gelten die <a href="https://firebase.google.com/terms" target="_blank">Firebase-Nutzungsbedingungen</a> und die <a href="https://policies.google.com/privacy" target="_blank">Google-Datenschutzerkl\u00E4rung</a>.',
    'imp.privacyContact': 'Bei Fragen zum Datenschutz: <a href="mailto:info@malzi.me">info@malzi.me</a>',

    // ===== SHARE =====
    'share.title': 'Cybermobbing-Simulation',
    'share.text': 'Wie Cybermobbing viral geht \u2013 120-Sekunden-Simulation.\n\nWenn du betroffen bist: Rat auf Draht 147',

    // ===== DISCLAIMER =====
    'disclaimer.full': 'Fiktives Szenario zu Bildungszwecken. Alle Namen und Inhalte sind erfunden. Die dargestellten App-Oberfl\u00E4chen, Logos und Markenzeichen sind Eigentum der jeweiligen Unternehmen und werden hier ausschlie\u00DFlich zur realistischen Veranschaulichung im Bildungskontext verwendet. Diese Seite steht in keiner Verbindung zu den genannten Plattformen oder deren Betreibern. Die genannten Plattformen bieten Meldefunktionen und Hilfsangebote gegen Cybermobbing.',
    'disclaimer.helplineLogo': 'Das Logo von 147 Rat auf Draht wird mit freundlicher Genehmigung verwendet.',

    // ===== LIMIT PAGE =====
    'limit.n1': '<strong>+247 Nachrichten</strong> in 3 Gruppen',
    'limit.n2': '<strong>+1.8k Likes</strong> auf das Foto von dir',
    'limit.n3': '<strong>12 Screenshots</strong> von deinem Bild',
    'limit.n4': '<strong>4 TikTok-Videos</strong> mit deinem Foto',
    'limit.n5': '<strong>Mama</strong> versucht anzurufen...',
    'limit.title': 'Auch diese Simulation<br>braucht eine Pause.',
    'limit.sub': 'Heute haben schon zu viele Menschen zugeschaut.',
    'limit.availableIn': 'Wieder verf\u00FCgbar in:',
    'limit.note': 'Cybermobbing h\u00F6rt leider nicht auf,<br>nur weil man wegschaut.',

    // ===== WHATSAPP (P1: 0-28s) =====
    'wa.groupName': 'Klasse 3B \uD83C\uDFEB',
    'wa.groupMembers': 'Marco, Sara, Tim, Tom +19',
    'wa.inputPlaceholder': 'Nachricht',
    'wa.dateLabel': 'HEUTE',
    'wa.marco1': 'ey schaut euch den an \uD83D\uDE02\uD83D\uDE02 checkt garnix der typ',
    'wa.sara1': 'HAHA NEEE \uD83D\uDC80\uD83D\uDC80\uD83D\uDC80 ich kannn nicht mehrrr',
    'wa.tim1': 'bro wie peinlcih is der \uD83D\uDE02 kein wunder das keienr mit dem redet',
    'wa.leon1': 'Schickts in die 3A und 4B. Die m\u00FCssen das alle sehen \uD83D\uDC80',
    'wa.sara2': 'WARTE screenshot \uD83D\uDD25\uD83D\uDD25 kommt auf mein instaaaa',
    'wa.marco2': 'alter morgen in der schule bist du dran \uD83E\uDD21',
    'wa.tomLeaves': '\u2190 Tom hat die Gruppe verlassen',
    'wa.toastScreenshot': '\uD83D\uDCF8 Sara hat einen Screenshot gemacht',
    'wa.toastEditing': '\u270F\uFE0F Sara bearbeitet das Foto...',
    'wa.toastPosted': '\uD83D\uDCE4 Sara hat es auf Instagram gepostet',

    // ===== INSTAGRAM (P2: 28-56s) =====
    'ig.likesZero': '0 \u201EGef\u00E4llt mir\u201C-Angaben',
    'ig.likesCount': '{count} \u201EGef\u00E4llt mir\u201C-Angaben',
    'ig.commentsCount': 'Alle {count} Kommentare ansehen',
    'ig.storyViews': '234 Story-Views \u00B7 48 aus Parallelklassen',
    'ig.sara': 'HAHAHA ICH KANN NICHT \uD83D\uDC80\uD83D\uDC80 schaut euch den an omggg',
    'ig.tim': 'bro l\u00F6sch dich einfach \uD83D\uDE02\uD83D\uDE02 so peinlcih',
    'ig.leon': 'Wer so ruml\u00E4uft hat es nicht anders verdient \uD83E\uDD21',
    'ig.tom1': 'Bitte l\u00F6scht das. Das ist nicht lustig. Bitte.',
    'ig.marco': '\uD83D\uDE02\uD83D\uDE02 keiner vermisst dich wenn du weg bist tom',
    'ig.lukas': '@tom.m geh einfach keiner braucht dich hier \uD83D\uDC80 f\u00FCr immer',
    'ig.tom2': 'H\u00D6RT AUF. ICH MELDE DAS ALLES.',
    'ig.hype': 'wer den in der schule sieht \u2192 foto machen posten taggen \uD83D\uDD25\uD83D\uDD25',
    'ig.toastScreenshot': '\uD83D\uDCF8 lukas.der.echte hat einen Screenshot gemacht',
    'ig.toastReaction': '\uD83C\uDFAC lukas.der.echte macht ein Reaktionsvideo...',
    'ig.toastTiktok': '\uD83D\uDCE4 Neues TikTok-Video mit deinem Foto ver\u00F6ffentlicht',

    // ===== TIKTOK (P3: 56-78s) =====
    'tk.label': 'Reaktionsvideo \u00B7 @marco_2012',
    'tk.commentsHeader': 'Kommentare',
    'tk.navStart': 'Start',
    'tk.navDiscover': 'Entdecken',
    'tk.navInbox': 'Posteingang',
    'tk.navProfile': 'Profil',
    'tk.lukas': 'kennt den wer? taggt ihn \uD83D\uDC80',
    'tk.sara': 'HAHAHA TOM M. 3B Gymnasium Mitte \uD83D\uDE02\uD83D\uDE02 EXPOSED',
    'tk.noah': 'Linzerstra\u00DFe 14. Falls jemand vorbei will \uD83D\uDC80',
    'tk.anon': 'der geht auf unsre schule lol kenn den alle wissen bescheid \uD83D\uDE02',
    'tk.tom': 'Das bin ich. Bitte meldet das Video. Bitte.',
    'tk.aggro': 'heult auf tiktok \uD83D\uDE02 wie erbermlich kannst du sein',
    'tk.marco': '@tom.m du bist so tot morgen in der schule glaub mir \uD83E\uDD21',
    'tk.troll': 'jeder der das sieht \u2192 liken teilen reposten \uD83D\uDC80\uD83D\uDD25',
    'tk.botDesc': 'I can\'t \uD83D\uDC80\uD83D\uDC80 <span class="tag">#school</span> <span class="tag">#exposed</span> <span class="tag">#fy</span>',
    'tk.stickerLabel': 'OPFER',
    'tk.toastReport': '\u23F3 Deine Meldung wird gepr\u00FCft',
    'tk.toastVideos': '\uD83D\uDCF8 3 weitere Videos mit deinem Foto erstellt',

    // ===== HOMESCREEN (P4: 78-93s) =====
    'hs.n1': '<strong>Marco</strong>: \u201Ealter wenn ich den morgen seh \uD83D\uDE02\u201C',
    'hs.n2': '<strong>+38 Likes</strong> auf das Foto von dir',
    'hs.n3': '<strong>hype.page</strong> hat deinen vollen Namen gepostet',
    'hs.n4': '<strong>2.8k Views</strong> auf das TikTok-Video',
    'hs.n5': '<strong>Mama</strong> versucht anzurufen...',
    'hs.n6': '<strong>Neue Gruppe</strong>: \u201ETom exposed \uD83E\uDD21\u201C \u2014 41 Mitglieder',
    'hs.n7': '<strong>Neuer Kommentar</strong>: \u201El\u00F6sch dich einfach \uD83D\uDC80\u201C',
    'hs.n8': '<strong>aggro.44</strong> hat ein Meme aus deinem Foto gemacht',

    // ===== MESSAGES (P4b: 93-112s) =====
    'im.mama': 'Tom, Schatz? Alles ok bei dir? \u2764\uFE0F',
    'im.tom': 'Mama, ich halt das nicht mehr aus.',
    'im.contactName': 'Mama \u2764\uFE0F',
    'im.label': 'iMessage',
    'im.back': 'Zur\u00FCck',

    // ===== FINALE (P5: 112-120s) =====
    'fin.line1': 'Das waren 120 Sekunden.',
    'fin.line2': 'F\u00FCr Tom geht das seit 3 Wochen.',
    'fin.line3': 'Jeden Tag.',
    'fin.line4': 'Auch nachts.',
    'fin.line5': 'Alle haben es gesehen<br>und morgen in der Schule<br>geht es weiter.',
    'fin.help': 'Cybermobbing ist kein Spa\u00DF \u2013 es ist Gewalt, die man nicht sieht. Wenn Worte dich verletzen oder du siehst, wie andere fertiggemacht werden: Du musst das nicht alleine aushalten. Brich das Schweigen.',

    // ===== PHOTO OVERLAYS =====
    'photo.igUser': 'marco_2012',
    'photo.igLikes': '\u2764 192',
    'photo.emoji1': '\uD83E\uDD2E\uD83E\uDD2E',
    'photo.lookText': 'stellt euch vor so auszusehen \uD83D\uDE02',
    'photo.poop': '\uD83D\uDCA9',
    'photo.ugly': 'H\u00C4SSLICH',
    'photo.never': 'wird nie eine abbekommen \uD83D\uDC80',
    'photo.exposed': 'EXPOSED',
    'photo.pov': 'POV: du hast keine freunde',
    'photo.tags': '#exposed #schule #rip',
    'photo.emojiBot': '\uD83E\uDD21\uD83D\uDC80\uD83D\uDD95\uD83E\uDD2E',
    'photo.bozo': 'rip bozo \uD83D\uDC80'
  },

  en: {
    // ===== UI =====
    'ui.title': 'How Cyberbullying goes viral',
    'ui.titleHtml': 'How Cyberbullying<br><em>goes viral</em>',
    'ui.subtitle': '120-Second Simulation',
    'ui.start': 'Start Simulation',
    'ui.share': 'Share Simulation',
    'ui.replay': 'Replay',
    'ui.pause': 'II',
    'ui.resume': '\u25B8',
    'ui.paused': 'Paused \u2014 tap to continue',
    'ui.impressum': 'Legal Notice',
    'ui.close': 'Close',
    'ui.linkCopied': 'Link copied!',
    'ui.messages': 'Messages',

    // ===== IMPRESSUM =====
    'imp.title': 'Legal Notice',
    'imp.subtitle': 'Cyberbullying Simulation by malziland',
    'imp.notice': 'This simulation is an educational tool to raise awareness about cyberbullying. All depicted persons, names and content are entirely fictional.',
    'imp.purpose': 'Purpose: Development and operation of an interactive cyberbullying simulation for media literacy workshops in schools.',
    'imp.privacyTitle': 'Privacy (GDPR)',
    'imp.privacyNoData': 'This site does not store any personal data. No cookies are set, no tracking is used, and no IP addresses are stored.',
    'imp.privacyCounter': 'The view counter stores only an anonymous count with no relation to individual visitors. Attribution to persons is not possible.',
    'imp.privacyHosting': 'Hosting is provided by Google Firebase (Google Ireland Ltd). The <a href="https://firebase.google.com/terms" target="_blank">Firebase Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank">Google Privacy Policy</a> apply.',
    'imp.privacyContact': 'For privacy questions: <a href="mailto:info@malzi.me">info@malzi.me</a>',

    // ===== SHARE =====
    'share.title': 'Cyberbullying Simulation',
    'share.text': 'How cyberbullying goes viral \u2013 120-second simulation.\n\nIf you are affected: seek help.',

    // ===== DISCLAIMER =====
    'disclaimer.full': 'Fictional scenario for educational purposes. All names and content are fictitious. The depicted app interfaces, logos and trademarks are the property of their respective owners and are used here solely for realistic illustration in an educational context. This site is not affiliated with the mentioned platforms or their operators. The mentioned platforms offer reporting tools and support against cyberbullying.',
    'disclaimer.helplineLogo': 'The 147 Rat auf Draht logo is used with kind permission.',

    // ===== LIMIT PAGE =====
    'limit.n1': '<strong>+247 messages</strong> in 3 groups',
    'limit.n2': '<strong>+1.8k likes</strong> on your photo',
    'limit.n3': '<strong>12 screenshots</strong> of your picture',
    'limit.n4': '<strong>4 TikTok videos</strong> with your photo',
    'limit.n5': '<strong>Mom</strong> is trying to call...',
    'limit.title': 'This simulation also<br>needs a break.',
    'limit.sub': 'Too many people have already watched today.',
    'limit.availableIn': 'Available again in:',
    'limit.note': 'Cyberbullying doesn\'t stop<br>just because you look away.',

    // ===== WHATSAPP (P1) =====
    'wa.groupName': 'Class 3B \uD83C\uDFEB',
    'wa.groupMembers': 'Marco, Sara, Tim, Tom +19',
    'wa.inputPlaceholder': 'Message',
    'wa.dateLabel': 'TODAY',
    'wa.marco1': 'yo look at this guy \uD83D\uDE02\uD83D\uDE02 he has no clue',
    'wa.sara1': 'HAHA NOOO \uD83D\uDC80\uD83D\uDC80\uD83D\uDC80 I caaan\'t anymore',
    'wa.tim1': 'bro how embarassing is he \uD83D\uDE02 no wonder nobody talks to him',
    'wa.leon1': 'Send it to 3A and 4B. They all need to see this \uD83D\uDC80',
    'wa.sara2': 'WAIT screenshot \uD83D\uDD25\uD83D\uDD25 going on my instaaaa',
    'wa.marco2': 'dude tomorrow at school you\'re done \uD83E\uDD21',
    'wa.tomLeaves': '\u2190 Tom has left the group',
    'wa.toastScreenshot': '\uD83D\uDCF8 Sara took a screenshot',
    'wa.toastEditing': '\u270F\uFE0F Sara is editing the photo...',
    'wa.toastPosted': '\uD83D\uDCE4 Sara posted it on Instagram',

    // ===== INSTAGRAM (P2) =====
    'ig.likesZero': '0 likes',
    'ig.likesCount': '{count} likes',
    'ig.commentsCount': 'View all {count} comments',
    'ig.storyViews': '234 story views \u00B7 48 from other classes',
    'ig.sara': 'HAHAHA I CAN\'T \uD83D\uDC80\uD83D\uDC80 look at him omggg',
    'ig.tim': 'bro just delete yourself \uD83D\uDE02\uD83D\uDE02 so embarassing',
    'ig.leon': 'If you walk around like that you deserve it \uD83E\uDD21',
    'ig.tom1': 'Please delete this. This is not funny. Please.',
    'ig.marco': '\uD83D\uDE02\uD83D\uDE02 nobody misses you when you\'re gone tom',
    'ig.lukas': '@tom.m just leave nobody needs you here \uD83D\uDC80 ever',
    'ig.tom2': 'STOP. I\'M REPORTING ALL OF THIS.',
    'ig.hype': 'anyone who sees him at school \u2192 take a photo post it tag him \uD83D\uDD25\uD83D\uDD25',
    'ig.toastScreenshot': '\uD83D\uDCF8 lukas.der.echte took a screenshot',
    'ig.toastReaction': '\uD83C\uDFAC lukas.der.echte is making a reaction video...',
    'ig.toastTiktok': '\uD83D\uDCE4 New TikTok video published with your photo',

    // ===== TIKTOK (P3) =====
    'tk.label': 'Reaction video \u00B7 @marco_2012',
    'tk.commentsHeader': 'Comments',
    'tk.navStart': 'Home',
    'tk.navDiscover': 'Discover',
    'tk.navInbox': 'Inbox',
    'tk.navProfile': 'Profile',
    'tk.lukas': 'does anyone know him? tag him \uD83D\uDC80',
    'tk.sara': 'HAHAHA TOM M. 3B Central High \uD83D\uDE02\uD83D\uDE02 EXPOSED',
    'tk.noah': '14 Linzer Street. In case anyone wants to stop by \uD83D\uDC80',
    'tk.anon': 'he goes to our school lol everyone knows him \uD83D\uDE02',
    'tk.tom': 'That\'s me. Please report this video. Please.',
    'tk.aggro': 'crying on tiktok \uD83D\uDE02 how pathetic can you be',
    'tk.marco': '@tom.m you\'re so dead tomorrow at school believe me \uD83E\uDD21',
    'tk.troll': 'everyone who sees this \u2192 like share repost \uD83D\uDC80\uD83D\uDD25',
    'tk.botDesc': 'I can\'t \uD83D\uDC80\uD83D\uDC80 <span class="tag">#school</span> <span class="tag">#exposed</span> <span class="tag">#fy</span>',
    'tk.stickerLabel': 'LOSER',
    'tk.toastReport': '\u23F3 Your report is being reviewed',
    'tk.toastVideos': '\uD83D\uDCF8 3 more videos created with your photo',

    // ===== HOMESCREEN (P4) =====
    'hs.n1': '<strong>Marco</strong>: \u201Cwhen I see him tomorrow \uD83D\uDE02\u201D',
    'hs.n2': '<strong>+38 likes</strong> on your photo',
    'hs.n3': '<strong>hype.page</strong> posted your full name',
    'hs.n4': '<strong>2.8k views</strong> on the TikTok video',
    'hs.n5': '<strong>Mom</strong> is trying to call...',
    'hs.n6': '<strong>New group</strong>: \u201CTom exposed \uD83E\uDD21\u201D \u2014 41 members',
    'hs.n7': '<strong>New comment</strong>: \u201Cjust delete yourself \uD83D\uDC80\u201D',
    'hs.n8': '<strong>aggro.44</strong> made a meme from your photo',

    // ===== MESSAGES (P4b) =====
    'im.mama': 'Tom, honey? Are you okay? \u2764\uFE0F',
    'im.tom': 'Mom, I can\'t take this anymore.',
    'im.contactName': 'Mom \u2764\uFE0F',
    'im.label': 'iMessage',
    'im.back': 'Back',

    // ===== FINALE (P5) =====
    'fin.line1': 'That was 120 seconds.',
    'fin.line2': 'For Tom, this has been going on for 3 weeks.',
    'fin.line3': 'Every day.',
    'fin.line4': 'Even at night.',
    'fin.line5': 'Everyone saw it<br>and tomorrow at school<br>it continues.',
    'fin.help': 'Cyberbullying is not a joke \u2013 it\'s violence you can\'t see. If words are hurting you or you see others being torn apart: You don\'t have to endure this alone. Break the silence.',

    // ===== PHOTO OVERLAYS =====
    'photo.igUser': 'marco_2012',
    'photo.igLikes': '\u2764 192',
    'photo.emoji1': '\uD83E\uDD2E\uD83E\uDD2E',
    'photo.lookText': 'imagine looking like this \uD83D\uDE02',
    'photo.poop': '\uD83D\uDCA9',
    'photo.ugly': 'UGLY',
    'photo.never': 'will never get anyone \uD83D\uDC80',
    'photo.exposed': 'EXPOSED',
    'photo.pov': 'POV: you have no friends',
    'photo.tags': '#exposed #school #rip',
    'photo.emojiBot': '\uD83E\uDD21\uD83D\uDC80\uD83D\uDD95\uD83E\uDD2E',
    'photo.bozo': 'rip bozo \uD83D\uDC80'
  }
};

/** Current language code */
var currentLang = 'de';

/**
 * Detect language from URL parameter (?lang=en) or browser settings.
 * Falls back to 'de' if no match found.
 * @returns {string} Language code ('de' or 'en')
 */
function detectLanguage() {
  var params = new URLSearchParams(window.location.search);
  var lang = params.get('lang');
  if (lang && TRANSLATIONS[lang]) return lang;

  var stored = localStorage.getItem('sim_lang');
  if (stored && TRANSLATIONS[stored]) return stored;

  var nav = (navigator.language || '').slice(0, 2);
  if (nav && TRANSLATIONS[nav]) return nav;

  return 'de';
}

/**
 * Get a translated string by key.
 * Supports {placeholder} replacement via second argument.
 * Falls back to German if key missing in current language.
 * Returns [key] if key missing in all languages.
 *
 * @param {string} key - Translation key (e.g. 'ui.start')
 * @param {Object} [replacements] - Key-value pairs for {placeholder} replacement
 * @returns {string} Translated string
 *
 * @example
 *   t('ui.start')              // "Simulation starten"
 *   t('ig.likesCount', {count: 42}) // "42 „Gefällt mir"-Angaben"
 */
function t(key, replacements) {
  var str = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
         || (TRANSLATIONS.de && TRANSLATIONS.de[key])
         || '[' + key + ']';

  if (replacements) {
    Object.keys(replacements).forEach(function (k) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), replacements[k]);
    });
  }
  return str;
}

/**
 * Apply translations to DOM elements with data-i18n or data-i18n-html attributes.
 * - data-i18n="key" sets textContent
 * - data-i18n-html="key" sets innerHTML (for strings with HTML like <br> or <strong>)
 */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });
}

// Initialize language on load
currentLang = detectLanguage();
