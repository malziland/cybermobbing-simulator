# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) und folgt [Semantic Versioning](https://semver.org/lang/de/).

## [2.0.2] - 2026-10-09

Handy-Fassung nach den Wünschen des Betreibers vom 2026-10-09. Vor der
Auslieferung von einer zweiten Instanz abgenommen; ihre sieben Funde sind
behoben. Ausgeliefert am 2026-10-09; Nachweise in `docs/VERIFICATION.md`,
Abschnitt „Version 2.0.2".

### Geändert
- **Am Handy gibt es keine Steuerleiste mehr.** Das nachgebaute Handy nutzt die Höhe bis zur Impressum-Zeile (im iPhone-Simulator 36 Pixel mehr). Ein Tipp auf das Handy pausiert, ein zweiter setzt fort; solange pausiert ist, steht ein Pause-Zeichen in der Mitte. Fortschritt und Ton-Knopf entfallen dort; die Lautstärke regeln die Tasten des Handys. Das Impressum bleibt als Zeile unter dem Handy
- **Quer gehalten zeigt die Seite am Handy einen Hinweis „Bitte dreh dein Handy hochkant"** statt einer winzigen Simulation. Der Lauf pausiert dabei und geht nach dem Drehen weiter, außer er war schon vorher pausiert
- **Handys werden am Gerät erkannt, nicht mehr an der Fenstergröße:** Der Bildschirm misst an der kürzeren Seite unter 600 Pixel, und der Browser meldet sich als Handy-Browser oder der Finger ist das Hauptzeigegerät. Tablets behalten in beiden Lagen die volle Fassung mit Leiste, Springen und Beamer-Ansicht; Rechner bleiben, wie sie waren, auch mit schmalem Fenster (`docs/adr/ADR-0008`)

### Behoben
- **Tab-Taste im Lauf** (Bestand, in Chrome und Firefox): Nach mehrmaligem Tab nahm ein rollbarer Bereich im nachgebauten Handy den Fokus, und der Handy-Bildschirm rutschte weg; das Handy stand leer. Die Bereiche sind aus der Tab-Folge genommen

## [2.0.1] - 2026-10-09

Behebung für Smartphones und Tablets. Den Fehler hat der Betreiber am Tag der
Auslieferung von 2.0.0 am eigenen Handy gefunden. Ausgeliefert am 2026-10-09;
Nachweise in `docs/VERIFICATION.md`, Abschnitt „Version 2.0.1".

### Behoben
- **Am Smartphone lag die Steuerleiste über dem unteren Rand des nachgebauten Handys** (neu seit 2.0.0): Die Eingabeleiste der Chats und die Menüleisten der Apps waren teilweise bis fast ganz verdeckt. Ursache: Die Höhe des Handys war als Anteil der Fensterhöhe (`vh`) angegeben. Handy-Browser rechnen dabei mit eingefahrener Adressleiste; sichtbar ist weniger. Das Handy richtet sich jetzt nach der sichtbaren Höhe und sitzt mittig über der Leiste
- **Beamer-Ansicht am Tablet:** Leiste und Handy saßen aus demselben Grund versetzt zur Bildfläche. Die Beamer-Ansicht misst jetzt die sichtbare Höhe (mit Rückfall für ältere Browser), ebenso der Rahmen des Impressums
- **Beamer-Ansicht in Safari:** Nach einem Sprung dunkelten ältere Nachrichten 0,4 Sekunden lang ab und verdrängte klappten sichtbar zusammen, statt sofort zu stehen
- **Letzte Seite in niedrigen Fenstern** (960 × 540, Beamer mit 800 × 600): Logo, Links, Text und beide Knöpfe passen ohne Rollen. Zwei ältere Regeln für sehr niedrige Fenster standen im Stylesheet an einer Stelle, an der sie nicht wirkten; sie greifen jetzt
- **Datenschutztext:** Er nannte zwei Werte im Browserspeicher, darunter die gewählte Sprache. Gespeichert wird nur die Tagesmarke des Zählers. Der Satz ist berichtigt, und die Seite liest keinen Sprachwert mehr aus dem Speicher

### Geändert
- **Am Handy gibt es kein Springen auf der Zeitleiste und keine Beamer-Ansicht, egal wie es gehalten wird** (Entscheidung des Betreibers vom 2026-10-09). Bisher hing beides an der Fensterbreite: Ein quer gehaltenes Handy konnte springen und die Beamer-Ansicht wählen, ein hochkant gehaltenes nicht. Als Handy gilt ein Fenster bis 500 Pixel Breite oder ein Gerät mit Fingerbedienung, dessen Fenster höchstens 500 Pixel hoch ist. Tablets und Rechner sind nicht betroffen (`docs/adr/ADR-0008`)

### Hinzugefügt
- Prüfung in echtem mobilem Safari: `npm run test:ios` (`scripts/check-ios.js`) misst die Seite im iPhone- und iPad-Simulator von Xcode. Sie gehört zu den Prüfungen vor jeder Auslieferung (`docs/RUNBOOK.md`)
- Der Ablauftest prüft Handys in den Fenstergrößen, die ein Handy-Browser tatsächlich zeigt, mit Fingerbedienung hochkant und quer, dazu Tablets; ein Abschnitt läuft zusätzlich in der Safari-Technik (WebKit)

## [2.0.0] - 2026-10-09

Neue Bedienung: Beamer-Ansicht und Steuerleiste mit Zeitleiste. Die Versionsnummer
hat der Betreiber festgelegt. Ausgeliefert am 2026-10-09; Nachweise in
`docs/VERIFICATION.md`, Abschnitt „Auslieferung von v2.0.0".

### Hinzugefügt
- **Beamer-Ansicht** für große Räume (`docs/adr/ADR-0007`): zweite Darstellung desselben Ablaufs für alle Szenen, mit dem Handy links, dem Bild der Szene in der Mitte und den neuesten Nachrichten groß rechts. Umschalten jederzeit ohne Sprung im Ablauf. Alle Maße sind Anteile der Bildfläche, Auflösung und Browser-Zoom ändern die Proportionen nicht. Bild, Zahlen und Zusatztexte sitzen in jeder App an derselben Stelle
- **Steuerleiste** (`docs/adr/ADR-0008`): eine Leiste am unteren Rand mit Pause, Name der Szene, Zeitleiste, Ton, Wahl der Ansicht und Impressum, in beiden Ansichten gleich aufgebaut. Sie zeigt keine Zeiten und bleibt auch auf der letzten Seite mit den Hilfsangeboten stehen
- **Zeitleiste zum Springen und Ziehen, vor und zurück:** Ein Klick landet an der geklickten Stelle, dicht neben einer Marke auf dem Anfang der Szene. Beim Ziehen läuft das Bild in Handy und Beamer-Ansicht sofort mit. Die letzte Seite ist der letzte Abschnitt der Zeitleiste; von dort kommt man an jede Stelle zurück, ohne neu zu starten. Tasten auf der Leiste: Pfeile, Bild auf, Bild ab, Pos1, Ende
- **Ton:** Knopf für Ton aus und ein sowie Schieberegler für die Lautstärke, dazu die Taste M. Wirkt auf Musik und Geräusche gemeinsam; die Einstellung wird nicht gespeichert
- **Wahl der Ansicht** über zwei Kacheln mit Vorschaubildern am Startbildschirm, in der Steuerleiste, mit der Taste B und über den Link-Zusatz `?beamer=1`
- Tests: QUnit-Module `tests/test-stage.js`, `tests/test-volume.js`, `tests/test-controls.js`; der Ablauftest prüft zusätzlich die Beamer-Ansicht, Sprünge und Ziehen gegen einen Durchlauf ohne Sprung, die Sichtbarkeit der Einträge, die letzte Seite und das Layout in vielen Fenstergrößen

### Geändert
- **Bedienelemente im Lauf:** Pausesymbol, Pausentext, der dünne Fortschrittsstrich und das Impressum unten in der Mitte sind durch die Steuerleiste ersetzt
- **Schmale Fenster:** Bis einschließlich 700 Pixel Fensterbreite zeigt die Seite immer die Handy-Ansicht, ohne Kacheln und Umschalter für die Beamer-Ansicht; die Wahl gilt wieder, sobald das Fenster breiter wird. Bis 900 Pixel entfällt in der Handy-Ansicht der Lautstärke-Regler (der Ton-Knopf bleibt). Bis 500 Pixel zeigt die Leiste Pause, Fortschritt und Ton, das Impressum steht als Zeile darunter, und die Zeitleiste ist reine Anzeige
- **Impressum:** Wird es während des Laufs geöffnet, pausiert die Simulation und läuft beim Schließen weiter (außer sie war schon pausiert). Die Uhrzeit in seiner Statusleiste ist die des Handys in der Simulation, außerhalb des Laufs die echte Uhrzeit; vorher stand dort fest 21:34
- **Kontaktadresse** ist überall `info@malziland.at`: Impressum und Datenschutz-Kontakt (Deutsch und Englisch), `llms.txt`, `SECURITY.md`, `CONTRIBUTING.md`, Issue-Vorlage
- **Startbildschirm und letzte Seite:** Der Platz für den Hinweistext unten richtet sich nach dessen wirklicher Höhe. In schmalen Fenstern läuft der Text über bis zu fünf Zeilen und überdeckt nichts mehr. Das Impressum ist größer (mindestens 15 statt 12 CSS-Pixel)
- Der Teilen-Knopf gibt den Link immer ohne den Zusatz `?beamer=1` weiter
- Nach dem Start ist der Startbildschirm auch für die Tastatur ausgeblendet (vorher blieben seine Knöpfe unsichtbar anwählbar)
- **Barrierefreiheit des Rahmens:** Das Impressum übernimmt beim Öffnen den Tastaturfokus und gibt ihn beim Schließen zurück; dahinter ist nichts bedienbar. Schließen-Knopf, Untertitel und Links im Impressum erfüllen die Kontrastprüfung, die Seite nennt Screenreadern ihre Sprache (auch in der englischen Fassung), die Links der letzten Seite sind 24 Pixel hoch
- In niedrigen Fenstern (quer gehaltenes Handy) lassen sich Startbildschirm und letzte Seite rollen, statt dass der Hinweistext Teile überdeckt
- Die Uhr der Leiste läuft nach der echten Zeit statt nach gezählten Takten; in Firefox und Safari ging sie sonst bis zu sechs Prozent nach. Ein Ruhezustand des Rechners zählt nicht als Laufzeit
- Video-Export (`scripts/video-export/`) blendet die neuen Bedienelemente aus
- Szenenzeiten stehen nur noch an einer Stelle (`CTL_SCENES` in `js/controls.js`); README und Kommentare nannten teils falsche Zeiten
- Betriebshandbuch: Release-Ablauf über Pull Request, mit Prüfsummen-Vergleich der Live-Seite (`scripts/verify-live.sh`) und dem Tag erst nach dem Deploy

### Behoben
- **Start hing am fremden Skript des Zählers:** War der Host des Firebase-SDK im Netz gesperrt oder antwortete er nicht, oder fehlte `js/config.js`, blieb „Simulation starten" ohne Wirkung. Das SDK lädt jetzt als Letztes; die Simulation startet auch ohne Zähler. Wer startet, bevor der Zähler geladen ist, wird nachgezählt (bestand schon vor dieser Version)
- **Hinweise zu kurz sichtbar:** Folgten zwei Hinweise dicht aufeinander, blendete der Ausblend-Zeitgeber des ersten den zweiten mit aus. „… hat es auf Instagram gepostet" und zwei weitere standen nur eine halbe Sekunde, auch in der Beamer-Ansicht. Jetzt steht jeder Hinweis seine volle Zeit oder bis ihn der nächste ablöst, mindestens anderthalb Sekunden (bestand schon vor dieser Version)
- **Pause direkt nach dem Start:** Wer in der ersten halben Sekunde pausierte und fortsetzte, startete die Uhr doppelt; sie lief danach mit doppelter Geschwindigkeit und im Pausezustand weiter (bestand schon vor dieser Version)

### Entfernt
- Die alten Bedienelemente samt ihren Texten und Testhilfen (Pausentext, Fortschrittsstrich)
- Eine unbenutzte Gestaltungsregel (`.fin-msg`) und eine unbenutzte Funktion (`startMusic()`), beide schon vorher ohne Verwendung

### Sicherheit
- **Die Live-Seite liefert nur noch die Seite selbst aus.** Seit dem 16.07.2026 waren über die Live-Adresse auch versteckte Ordner abrufbar: der Versionsverlauf (`.git/`), eine lokale Einstellungsdatei (`.claude/settings.local.json`) und `.github/`, dazu Doku, Tests und Skripte. Ursache war ein Ausschlussmuster, das Dateien in Punkt-Ordnern nicht erfasst. Zugangsdaten wurden in diesen Dateien nicht gefunden. Jetzt schließt die Liste alles außer der Seite aus, eine Sperre (`scripts/deploy-files.js`) bricht jeden Deploy mit fremden Dateien ab, und `scripts/verify-live.sh` prüft nach jedem Deploy, dass diese Pfade nicht mehr abrufbar sind. Einzelheiten: `docs/SECURITY-MODEL.md`, Abschnitt „Vorfälle"
- Entwicklungswerkzeug `brace-expansion` 5.0.7 → 5.0.12 (mehrere Meldungen zu Überlastung, unter anderem GHSA-mh99-v99m-4gvg). Betrifft nur die Werkzeuge; die Seite selbst hat keine Laufzeit-Abhängigkeiten

## [1.2.1] - 2026-07-16

Behebung aller vier Findings des KURZAUDITS vom 2026-07-16 (AUDIT-REMEDIATION).

### Behoben
- **BUG-01:** `/views`-Datenbankregel erlaubt jetzt den allerersten Zählimpuls auf einer frischen Datenbank — der View-Counter von Forks blieb bisher dauerhaft leer
- **DOC-01:** Falsche Aussage in `SECURITY.md` korrigiert (Tageslimit war nie regelseitig durchgesetzt); zusätzlich echter serverseitiger Deckel in den Datenbank-Regeln: `/daily/<datum>` maximal 5000 Schreibvorgänge pro Tag
- **OPS-01:** Video-Export serviert immer den Offline-Stub statt der echten Firebase-Konfiguration — Filmläufe zählen den Live-Counter nicht mehr hoch
- **BIZ-01:** Der zur Laufzeit gesetzte Seitentitel behält den Marken-Zusatz „| malziland" (SEO, seit v1.1.5); E2E-Test prüft das jetzt mit

## [1.2.0] - 2026-07-16

Nachzug auf den Familien-Standard (PROJEKTSTART-Lückenplan, siehe `docs/KONZEPT.md`).
Zusätzlich extern eingerichtet (außerhalb des Repos, siehe `docs/VERIFICATION.md`):
Branch Protection mit CI-Pflicht-Checks, Dependabot-Alerts + Security-Updates;
Secret Scanning/Push Protection und Google-Budget-Alarm waren bereits aktiv.

### Hinzugefügt
- **Doku-Fundament:** `docs/adr/` (ADR-0001–0006), `docs/SECURITY-MODEL.md`, `docs/RUNBOOK.md`, `docs/VERIFICATION.md`, `AGENTS.md` (+ `CLAUDE.md`-Verweis)
- **Werkzeugkette:** ESLint 10 + Prettier (`npm run lint`/`format`), headless QUnit-Runner via Playwright (`npm run test`), lokale Vorschau (`npm run dev`), Node-Pinning (`.nvmrc`, `engines`, `package-lock.json`), `.editorconfig`
- **E2E- und Accessibility-Tests** (`npm run test:e2e`): kompletter Nutzerfluss tastaturgesteuert und hermetisch (ohne Produktions-Firebase), axe-core-Checks (WCAG 2.x AA) für Start- und Hilfsangebote-Ansicht
- **CI (GitHub Actions):** Lint, Tests, E2E, Secret-Scan (gitleaks), Dependency-Audit; Actions per Commit-SHA gepinnt; Dependabot-Konfiguration
- **Test-Zeitraffer** `?testspeed=N` (1–60) für Tests, Produktionsverhalten unverändert (ADR-0006)
- Video-Export-Werkzeug (`scripts/video-export/`) ist jetzt versioniert (ohne `node_modules`/`output`)

### Behoben
- **Impressum per Tastatur bedienbar:** der Fußzeilen-Link (`span[role=button]`) reagierte nur auf Klick, nicht auf Enter/Leertaste (WCAG 2.1.1)
- **Kontraste des Rahmen-UI auf WCAG AA** angehoben: Start-Untertitel und Credit-Zeile (#666/#555 → #777), Start-/Teilen-Buttons (Weiß auf #fe2c55 = 3,68:1 → Hintergrund #e0264d = 4,6:1); die simulierten App-Szenen bleiben bewusst originalgetreu (ADR-0005)
- **`setup.sh` lädt Icons wieder zuverlässig:** die fest verdrahteten Apple-CDN-URLs waren verrottet (404); Auflösung jetzt zur Laufzeit über die offizielle iTunes-Lookup-API — gefunden durch die Rollback-Probe
- **Startverzögerung nutzt das pausierbare Timer-System** (`simTimeout` statt nativem `setTimeout`); behebt zwei „global failure"-Fehler der Test-Suite

### Geändert
- Firebase-SDK (CDN) 12.12.0 → 12.16.0 (SRI-Hashes erneuert), QUnit 2.25.0 → 2.26.0
- `package.json`: Repository-URL korrigiert (`…/cybermobbing-simulator`)
- README: Abschnitt „Entwicklung & Tests" mit den neuen Befehlen

## [1.1.5] - 2026-07-16

### Hinzugefügt
- **SEO / Auffindbarkeit:** JSON-LD erweitert — Christoph Krieger als `creator` (Person) mit `sameAs`-Links zu LinkedIn und GitHub, malziland-Organisation mit `founder`-Verknüpfung, zweiter Typ `LearningResource`, `image`/`screenshot`, GitHub-Repo als `sameAs`, `inLanguage` de+en
- Sichtbare Credit-Zeile am Startbildschirm („Ein Open-Source-Bildungsprojekt von malziland", verlinkt auf das GitHub-Repo dieses Projekts; DE + EN via `ui.credit`)
- `llms.txt`: maschinenlesbarer Projekt-Steckbrief für KI-Crawler (DE + EN, mit Betreiber- und Autoren-Angaben)
- `og:locale:alternate` (en_US), Meta-Author um Christoph Krieger ergänzt, Titel-Tag mit Marken-Zusatz „| malziland"

### Geändert
- `sitemap.xml`: `lastmod` aktualisiert
- `README.md`: Credits-Abschnitt mit Namen und LinkedIn-Link
- JSON-LD: `https://malzi.me` als Organisations-URL entfernt — malzi.me ist ein eigenständiges Projekt und wird nicht mehr quer-verlinkt
- `firebase.json`: `scripts/video-export/**` vom Hosting ausgeschlossen (lokales Werkzeug, gehört nicht auf den Live-Server)

## [1.1.4] - 2026-07-14

### Geändert
- Firmenwortlaut aktualisiert: „malziland – digitale Wissensgestaltung e.U." → „malziland - learning | training | consulting e.U." (Impressum, Meta-Author und JSON-LD in `index.html`, `LICENSE`, `README.md`, `package.json`)

## [1.1.3] - 2026-04-19

### Hinzugefügt
- Impressum/Datenschutz: neuer Absatz `imp.privacyLocalStorage` (deutsch + englisch), der die beiden funktionalen localStorage-Werte offenlegt: `sim_lang` (gewählte Sprache) und `cms_last_count` (Tagesmarke für den View-Counter-Dedup). Ergänzt die bisherige „keine Cookies"-Aussage um Transparenz zu lokalem Browserspeicher. Beide Werte bleiben auf dem Endgerät, enthalten keine personenbezogenen Daten und werden nicht übertragen.

## [1.1.2] - 2026-04-19

### Dokumentation
- `SECURITY.md`: Hinweis, dass die Console-Meldung „Refused to execute a script (inline)" von einem Firebase-Long-Polling-Transport stammt, der einen `<script>`-Block in einen IFRAME schreibt. Dieser Transport scheitert erwartungsgemäß an der CSP (kein `'unsafe-inline'`, Inhalt variiert pro Request → nicht hash-pinbar). Das SDK fällt still auf den erlaubten `<script src="https://*.firebaseio.com/.lp?...">`-Transport zurück; der Counter funktioniert. `'unsafe-inline'` würde den Log leiser machen, aber den XSS-Schutz der CSP aushebeln — Lärm wird daher bewusst in Kauf genommen.

## [1.1.1] - 2026-04-19

### Behoben
- **View-Counter auf Safari und bei deaktiviertem WebSocket:** Content Security Policy erlaubte `script-src` nur auf `self` + `gstatic.com`. Wenn Firebase Realtime Database vom WebSocket auf Long-Polling zurückfällt (Safari mit Extensions, restriktive Netzwerke), lädt es die Response als `<script>` von `firebaseio.com/.lp?...`. Diese wurden von der CSP geblockt — Counter blieb auf `--` und verschwand nach 5 s. `firebaseio.com` ist jetzt in `script-src` zugelassen.

### Hinzugefügt
- `/favicon.svg`: dunkles rundes Icon mit Sprechblase und Benachrichtigungspunkt in der bestehenden Farbpalette. Beseitigt den 404-Eintrag auf `/favicon.ico` in den Browser-Logs.

### Geändert
- CSP `connect-src` enthält zusätzlich `https://www.gstatic.com`, damit DevTools die Firebase-Sourcemaps (`.js.map`) beim Debuggen laden können. Produktivverhalten für normale Besucher unverändert — Sourcemaps werden nur mit geöffneten DevTools angefordert.

## [1.1.0] - 2026-04-19

### Geändert
- Firebase JS SDK: 10.12.0 → 12.12.0 (neue SRI-Hashes in `index.html`)
- QUnit: 2.20.1 → 2.25.0 (neue SRI-Hashes in `tests/test-runner.html`)
- `scripts/cache-bust.sh`: portables `sed`-Muster (funktioniert jetzt auf macOS und Linux/CI)
- `setup.sh`: Icon-Download validiert HTTP-Status, MIME-Typ und Mindestgröße; schlägt jetzt laut fehl statt stillschweigend Fehler-Payloads als `.png` zu speichern
- Copyright in `LICENSE`: „2025" → „2025–2026 malziland – digitale Wissensgestaltung e.U."
- CTA-Seite (`p5-finale.js`): Helpline-Logo und Links werden via DOM-APIs gebaut statt via `innerHTML` (defense-in-depth gegen Injection durch operator-kontrollierte Strings in `config.js`)
- Content Security Policy (`firebase.json`): zusätzlich `base-uri 'self'` und `form-action 'self'`
- `package.json`: doppelter `cache-bust`-Aufruf im Deploy entfernt

### Behoben
- View-Counter zeigte dauerhaft `--` bei blockierter Firebase-Verbindung (Ad-Blocker, Schul-Firewalls, Firefox ETP) — Counter-Boxen werden jetzt nach 5 s Timeout sauber ausgeblendet
- Countdown bis Mitternacht auf dem Limit-Page wurde gegen lokale Zeitzone berechnet, der Datums-Schlüssel jedoch gegen UTC — beide laufen jetzt konsistent gegen UTC-Mitternacht

### Hinzugefügt
- Pro-Browser-Dedup im View-Counter via `localStorage`: jeder Browser zählt maximal einmal pro UTC-Tag. Verhindert inflation durch Refresh-Loops im Unterricht und erschwert Bagatell-Missbrauch. Bei blockiertem/deaktiviertem localStorage fällt das System transparent zurück.

## [1.0.0] - 2026-03-31

### Hinzugefügt
- Interaktive 120-Sekunden-Simulation mit 6 Szenen (WhatsApp, Instagram, TikTok, Homescreen, iMessage, Hilfsangebote)
- Pausierbares Timer-System für Workshop-Einsatz (alle Timer, Sounds, Uhr eingefroren)
- Web Audio API Sound-Engine (App-spezifische Benachrichtigungstöne)
- Echtzeit-Uhr und heutiges Datum auf dem simulierten Phone
- Firebase Realtime Database View-Counter mit Tageslimit (5000/Tag)
- Mehrsprachigkeit (Deutsch + Englisch) via i18n-System
- Automatische Spracherkennung (URL-Parameter, localStorage, Browser-Sprache)
- Konfigurierbare Helpline auf der CTA-Seite (Logo, Slogan, Links über config.js)
- Content Security Policy mit SRI-Hashes für externe Scripts
- Impressum-Modal im Phone-Frame-Design (DSGVO-konform)
- Erweiterter Disclaimer (Markenrechte, keine Plattform-Verbindung, optionaler Genehmigungshinweis)
- 84 Unit-Tests mit 1698 Assertions (QUnit)
- JSDoc-Dokumentation für alle Funktionen
- Open-Source-Dokumentation (README, CONTRIBUTING, SECURITY, LICENSE, CHANGELOG)
- Automatisches Cache-Busting bei Deploy (scripts/cache-bust.sh)
- Icon-Download-Script für Forks (setup.sh)
- GitHub Issue Templates, FUNDING.yml
