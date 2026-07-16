# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) und folgt [Semantic Versioning](https://semver.org/lang/de/).

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
