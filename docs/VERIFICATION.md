# Verifikationsmatrix

Je Anforderung der Nachweisweg. Diese Datei ist die einzige Stelle, an der die
Zahlen der Läufe stehen; andere Dokumente verweisen hierher. Jede Zeile nennt
den Stand (Commit) und das Datum ihrer Messung. Eine Zeile mit älterem Stand
ist seither nicht neu gemessen worden.

Werkzeuge der Messungen vom 2026-10-09: Node v24.21.0 / npm 11.19.0 ·
ESLint 10.7.0 · Playwright 1.61.1 · gitleaks 8.30.1 · firebase-tools 15.32.0 ·
Xcode 27.0 mit den Simulatoren iPhone 18 Pro, iPhone 17 und iPad mini (A17 Pro),
je iOS 27.0.

## Prüfungen vor der Auslieferung

| Anforderung | Befehl | Ergebnis | Stand |
|---|---|---|---|
| Lint | `npm run lint` | Rückgabewert 0 | `bcf5bd7`, 2026-10-09 16:40 |
| Unit-Tests (QUnit, headless) | `npm run test` | Rückgabewert 0, „QUnit: 2229/2229 assertions passed, 0 failed" | `bcf5bd7`, 2026-10-09 16:41 |
| Unit-Tests in zufälliger Reihenfolge, ganze Suite und jedes der neun Module allein | Testseite mit `?seed=true` und `&module=…` (Wegwerfskript) | zehn Läufe, je 0 fehlgeschlagen; ganze Suite 2229/2229 | `bcf5bd7`, 2026-10-09 16:45 |
| Ablauftest mit Barrierefreiheit (axe-core, WCAG 2.x A/AA), hermetisch ohne die echte Datenbank; am Ende ein Abschnitt in WebKit | `npm run test:e2e` | Rückgabewert 0, „E2E: all checks passed", 356 Zeilen „ok", 0 Zeilen „FAIL" | `bcf5bd7`, 2026-10-09 16:43 |
| iPhone und iPad in echtem mobilem Safari (Simulator von Xcode), hermetisch | `npm run test:ios` | Rückgabewert 0, „iOS: all checks passed", 22 Zeilen „ok", 0 Zeilen „FAIL". iPhone 18 Pro: Fenster 402 × 714 sichtbar bei 100vh = 754, in allen fünf Szenen „phone 8 to 642.2, bar from 650.3". iPad mini: 744 × 1001 sichtbar bei 100vh = 1076 | `bcf5bd7`, 2026-10-09 16:44 |
| Abhängigkeiten | `npm audit --audit-level=high` im Wurzelverzeichnis und in `scripts/video-export` | je Rückgabewert 0, „found 0 vulnerabilities" | `bcf5bd7`, 2026-10-09 16:45 |
| Geheimnisse in der Historie | `gitleaks git --redact .` | Rückgabewert 0, „78 commits scanned", „no leaks found". Gegenprobe vom 2026-10-09 01:40 an `c79f02d` mit zwei erfundenen Schlüsseln im echten Format: Rückgabewert 1, „leaks found: 2" | `bcf5bd7`, 2026-10-09 16:46 |
| Ausgeliefert wird nur die Seite (Sperre vor dem Deploy) | `node scripts/deploy-files.js` | Rückgabewert 0, „deploy-files: 33 files, all part of the page; all 25 files the page loads are among them". So auch an `bcf5bd7` am 2026-10-09 16:45. Gegenproben: mit der Ausschlussliste von `85ee8b4` Rückgabewert 1, „133 file(s) that do not belong to the page … (of 166 files)"; fünf Köder in einer Kopie (Sicherungskopie `js/config.js.bak`, Verknüpfung nach außen, fehlendes Icon, fehlendes Skript, neuer Ordner) je Rückgabewert 1 | `c79f02d`, 2026-10-09 01:40 |
| Live-Seite vor dem Deploy (Beleg, dass die Prüfung anschlagen kann) | `bash scripts/verify-live.sh` | Rückgabewert 1, „live site differs (35 problem(s) in 33 files and 21 hidden paths)"; darunter `.git/HEAD`, `.git/config`, `.git/index`, `.claude/settings.local.json`, `.github/workflows/ci.yml` je „EXPOSED … (HTTP 200)". Probe mit einem Prüfsummen-Werkzeug, das nichts liefert: Rückgabewert 2 | Live-Seite v1.2.1 gegen `c79f02d`, 2026-10-09 01:40 |
| Live-Seite vor dem Deploy von v2.0.1 | `bash scripts/verify-live.sh` | Rückgabewert 1, „live site differs (5 problem(s) in 33 files and 21 hidden paths)" | Live-Seite v2.0.0 gegen `bcf5bd7`, 2026-10-09 16:45 |
| Pipeline | GitHub Actions, Workflow `ci`, auf dem Pull Request | siehe Abschnitt „Auslieferung von v2.0.0" | — |

## Gegenproben

Verfahren: eine Stelle im Produktcode in einer Kopie zurückbauen, Tests
unverändert lassen, alle Tests laufen lassen. Die zuständige Prüfung muss rot
werden.

| Runde | Stand | Proben | Ergebnis |
|---|---|---|---|
| 1 | `b54d710`, 2026-10-08 | 32 | alle 32 von den Tests gemeldet; 31 an der erwarteten Prüfung, eine (Uhr stoppt zu früh) an zwei anderen |
| 2 | `48de3d7`, 2026-10-09 | 25, darunter die zehn folgenreichen Stellen des tiefen Audits | 21 gemeldet, 4 nicht: Platz für den Hinweistext nach einer Fensteränderung, Ziehen nach Loslassen außerhalb, Fokus am abgeschalteten Pause-Knopf, Höhe der Links der letzten Seite |
| 3 | `5aee659`, 2026-10-09 | die 4 aus Runde 2 nach geschärften und neuen Prüfungen, dazu 1 neue | 4 gemeldet, 1 nicht (letzte Seite reicht unter den Hinweistext) |
| einzeln | `136e795`, 2026-10-09 | die 1 aus Runde 3 nach neuer Prüfung | gemeldet: „page reaches 125 px under the disclaimer" |
| einzeln | `2ad6ab2`, 2026-10-08 | Schutzzeile des Hinweis-Zeitgebers | QUnit rot, zwei Zusicherungen |
| 4 | `c79f02d` (Arbeitsstand davor), 2026-10-09 | 3: Impressum öffnet am Ende, Start vor dem Zähler-Skript wird nicht nachgezählt, Ruhezustand zählt als Laufzeit | alle 3 gemeldet: „scrolled 834 of 834 px", „0 writes", QUnit 1 fehlgeschlagen |
| 5 | `bcf5bd7` (Arbeitsstand davor), 2026-10-09 | 18 für v2.0.1: 15 im Ablauftest, 1 in QUnit, 2 im Simulator; je eine Behebung in einer eigenen Kopie zurückgedreht | alle 18 gemeldet, je an der erwarteten Prüfung; die drei Läufe ohne Rückbau grün. Beispiele: alte Handy-Regel im Simulator: „phone 16.5 to 657.4, bar from 650.3, visible 714, 100vh 754" in fünf Szenen; Beamer-Ansicht mit `vh` am iPad: „bar 639.5 to 666.3, phone 340.6 to 705.2"; Sprung-Sperre nur nach Breite: „role slider" bei 852 × 393 mit Fingerbedienung; letzte Seite ohne die engeren Abstände: „needs 467 px, has 409"; Lesezugriff auf die Sprache wieder eingebaut: QUnit 1 fehlgeschlagen. Ein erster Durchgang lief, während am Code weitergearbeitet wurde, und ist verworfen |
| früher am 2026-10-08 | Zwischenstände bis `152c990` | 13, danach 2 wiederholt | 11 gemeldet, 2 nicht (gehaltene Taste, Platzprüfung); beide Prüfungen geschärft, danach gemeldet |

Die Kopien der nicht gemeldeten Proben sind verworfen; die Protokolle der Runden
lagen im Arbeitsordner der Sitzung und sind nicht Teil des Repositorys.

## Messungen ohne eigene Prüfung im Repository

| Was | Wie | Ergebnis | Stand |
|---|---|---|---|
| Dauer der Hinweise über einen ganzen Lauf | Wegwerfskript, Zeitraffer ×5, Beobachter am Hinweis | sieben Hinweise, kürzeste Dauer 1,5 s (abgelöst vom nächsten), sonst 2,0 bis 2,5 s; vor der Behebung dreimal 0,5 s | `2ad6ab2`, 2026-10-08 |
| Ziehen in drei Browser-Techniken (Chromium 149, WebKit 26.5, Firefox 151) | Wegwerfskript, 190 Sprünge beim Ziehen, 1920 × 1080 | Arbeit je Sprung im Mittel 7 / 14 / 9 ms, längster 11 / 23 / 14 ms; an sieben Stellen jeder Eintrag im Handy sichtbar; 0 Seitenfehler | Zwischenstand vor `b3f630c`, 2026-10-08; danach im tiefen Audit an `7c49271` nachgemessen (870 Bilder, 0 unsichtbar) |
| Musikdatei lässt sich abschnittsweise laden (Voraussetzung für das Springen in der Musik) | `curl -H "Range: bytes=1000-1999" https://cybermobbing.web.app/assets/bgm.mp3` | „HTTP/2 206", „content-range: bytes 1000-1999/1824429" | Live-Seite v1.2.1, 2026-10-08 |
| Sichtprüfung | 25 Bildschirmfotos: Leiste laufend und pausiert, beide Ansichten, schmale Fenster, letzte Seite mit Logo und zwei Links (auch 852 × 393, gerollt), Impressum, Startbildschirm | angesehen, je 0 Seitenfehler | Zwischenstände bis `6a100b3`, 2026-10-08 und 2026-10-09 |
| Fehler von v2.0.0 am Handy, vor der Behebung | Wegwerf-Messung im Simulator iPhone 17 (iOS 27.0, Safari), Seite mit Beispiel-Konfiguration | Fenster 402 × 714 sichtbar, 100vh = 754; nachgebautes Handy 16,5 bis 657,4, Leiste ab 650,3: 7,1 Pixel Überstand, Eingabeleiste 3,1 von 54 Pixel verdeckt. Für die zweizeilige Safari-Leiste des Betreibers (aus seinem Foto rund 655 Pixel sichtbar) gerechnet: rund 37 Pixel Überstand, rund 33 von 54 verdeckt | `9b796b3`, 2026-10-09 15:30 |
| Aufrufzähler bei den Messungen im Simulator | lesender Abruf von `/views` vor und nach der Messung | 361 und 361; der Messserver beantwortete `js/config.js` neunmal mit der Beispiel-Konfiguration | 2026-10-09 15:30 und 15:34 |
| Letzte Seite mit Logo und zwei Links, vor der Behebung | Wegwerfskript, Chromium, Beispiel-Konfiguration mit Logo und zweitem Link | es fehlten 58 Pixel bei 960 × 540, 22 bei 1024 × 576, in der Beamer-Ansicht 60 bei 800 × 600; danach in allen 20 gemessenen Fällen 0 | `9b796b3` und `bcf5bd7`, 2026-10-09 |
| Ältere Nachrichten nach einem Sprung in der Safari-Technik, vor der Behebung | Wegwerfskript, WebKit von Playwright, Beamer-Ansicht, erstes Bild nach dem Sprung | Deckkraft 1,00 statt 0,50 (ältere) und 1,00 statt 0 (verdrängte); danach 0,50 und 0,00 | `9b796b3` und `bcf5bd7`, 2026-10-09 |

## Audits

| Audit | Stand | Ergebnis | Bericht |
|---|---|---|---|
| KURZ | `1c498c1`, 2026-10-08 | elf Befunde (vier P2, sieben P3), kein P0 oder P1 | `docs/audit/2026-10-08-kurz-1c498c1.md` mit Nachtrag |
| TIEF | `7c49271`, 2026-10-08 | ein P1 (versteckte Ordner auf der Live-Seite, Bestand), zwei P2, elf P3 | `docs/audit/2026-10-08-tief-7c49271.md` mit Nachtrag |
| Nachprüfung der Behebungen | `498c1b3`, 2026-10-09 | Auslieferung geschlossen, Behebungen bestätigt, ein neuer Fehler (Impressum öffnete am Ende), behoben in `c79f02d`; Einzelheiten im Nachtrag des tiefen Berichts, Abschnitt „Abnahme" | `docs/audit/2026-10-09-nachpruefung-498c1b3.md` |

## Nicht belegt

- Lesbarkeit im echten Saal, Klang, Windows-Schulrechner.
- Das Handy des Betreibers selbst: Seine Safari-Leiste ist zweizeilig und lässt
  weniger Höhe als die des Simulators. Geprüft ist diese Fenstergröße
  (402 × 655) nur in den Testbrowsern; der Simulator ließ sich nicht auf diese
  Leiste umstellen. Beleg wäre ein Foto nach der Auslieferung von v2.0.1.
- Android-Handys und Tablets im Querformat in einem echten Browser (gerechnet
  und in den Testbrowsern geprüft; der Simulator lässt sich nicht drehen).
- Echtes Safari und Firefox am Rechner (gemessen sind die Testbrowser von
  Playwright; echtes mobiles Safari deckt `npm run test:ios` ab).
- Loslassen der Maus außerhalb des Fensters und Ruhezustand an einem echten Gerät.
- Die Behebungen in `c79f02d` nach der Nachprüfung und alle Behebungen von
  v2.0.1: nur vom Autor geprüft (Prüfungen und Gegenproben oben), nicht fremd
  abgenommen.
- Video-Export (`scripts/video-export`): Stand siehe Abschnitt „Version 2.0.1".

## Version 2.0.1

Prüfungen, Gegenproben und Messungen stehen in den Tabellen oben, Stand
`bcf5bd7`. Die Auslieferung ist noch nicht erfolgt; ihre Nachweise werden hier
mit dem Deploy eingetragen.

## Auslieferung von v2.0.0

Ausgelieferter Stand: Merge-Commit `7a51a61` auf `main` (Inhalt gleich `a4a90ff`,
`git diff --stat` leer), dazu der Cache-Stempel `?v=1791503108` in `index.html`.

| Schritt | Befehl | Ergebnis | Zeit (CEST) |
|---|---|---|---|
| Zweig hochgeladen | `git push -u origin feat/beamer-ansicht`; nachgemessen mit `git ls-remote origin refs/heads/feat/beamer-ansicht` | Rückgabewert 0; auf GitHub `a4a90ff` wie lokal | 2026-10-09 01:41 |
| Pipeline auf dem Pull Request Nr. 7 | `gh pr checks 7` | `lint-and-test: pass`, `secret-scan: pass`, `dependency-audit: pass` (Lauf 37860809100, Kopf `a4a90ff`). Erster Lauf des Ablauftests mit Linux-Schriften | 01:44 |
| Zusammengeführt | `gh pr merge 7 --merge`; nachgemessen mit `git merge-base --is-ancestor a4a90ff origin/main` | „MERGED", Merge-Commit `7a51a61`, enthält `a4a90ff` | 01:44 |
| Sperre vor dem Deploy | läuft als `hosting.predeploy`, im Protokoll des Deploys | „deploy-files: 33 files, all part of the page; all 25 files the page loads are among them", „hosting: Finished running predeploy script." | 01:45 |
| Deploy | `npm run deploy` von `main` | Rückgabewert 0; „found 33 files in .", „release complete", „Deploy complete!". Die Regeln der Datenbank wurden mit ausgeliefert, sie sind gegenüber v1.2.1 unverändert (`git diff --stat v1.2.1 HEAD -- database.rules.json` leer) | 01:45 |
| Live-Seite zeigt diesen Stand | `bash scripts/verify-live.sh` | Rückgabewert 0, Fehlerausgabe leer; „live site serves this state (33 of 33 files identical, 21 of 21 tooling files not reachable)"; Cache-Stempel live und lokal `?v=1791503108`. Vor dem Deploy: Rückgabewert 1 (Zeile weiter oben) | 01:45 |
| Versteckte Ordner nicht mehr abrufbar | `curl -s -o /dev/null -w '%{http_code}'` je Pfad | `/.git/HEAD`, `/.git/config`, `/.git/index`, `/.git/logs/HEAD`, `/.git/refs/heads/main`, `/.claude/settings.local.json`, `/.github/workflows/ci.yml`: je 404 (um 00:02 Uhr je 200). `/`, `/index.html`, `/js/controls.js`, `/js/stage.js`, `/css/styles.css`, `/assets/bgm.mp3`, `/robots.txt`, `/llms.txt`: je 200 | 01:45 |
| Die Seite läuft | Wegwerfskript: Live-Seite im Testbrowser mit `?beamer=1`, Start, Sprung auf 70 s, letzte Seite, zurück | Rückgabewert 0, neun Prüfungen „ok", 0 Seitenfehler. Dasselbe Skript vor dem Deploy: Rückgabewert 2, drei „FAIL" und Abbruch („simSeek is not a function") | 01:46 |
| Kopfzeilen | `curl -s -D - -o /dev/null https://cybermobbing.web.app/` | „HTTP/2 200", „cache-control: no-store, must-revalidate", CSP und „x-frame-options: DENY" wie in `firebase.json` | 01:45 |
| Musikdatei abschnittsweise ladbar | `curl -H "Range: bytes=1000-1999" …/assets/bgm.mp3` | „HTTP/2 206", „content-range: bytes 1000-1999/1824429" | 01:46 |

Fehlgriff bei der Probe „Die Seite läuft": Das Skript sperrte nur gewöhnliche
Abrufe zur Datenbank, nicht die Dauerverbindung, über die der Zähler schreibt.
Es startete die Simulation zweimal auf der Live-Seite (einmal vor, einmal nach
dem Deploy). Nachgemessen um 01:46 Uhr: `/views` steht bei 350, demselben Wert
wie auf den Bildschirmfotos des Betreibers vom Abend; gezählt wurde also nicht.
Eine solche Probe braucht eine Sperre der Dauerverbindung
(`routeWebSocket` in Playwright) oder die Beispiel-Konfiguration.

Rückweg: `docs/RUNBOOK.md`, Abschnitt „Rollback". Für diesen Release gilt Weg 2
(Code-Rollback) oder ein Vorwärts-Fix; Weg 1 (Konsole) stellt bei den Releases
vor v2.0.0 `.git/` wieder ins Netz. Gezogen wird der Rückweg, wenn der
Startknopf auf der Live-Seite nichts tut oder die Seite Fehler wirft.

## Ältere Nachweise (Stand 2026-07-16, seither nicht neu gemessen)

| Anforderung | Evidenz / Befehl | Ergebnis |
|---|---|---|
| Frischer Clone lauffähig (Setup) | `git clone … && npm ci && npm run lint && npm run test && npm run test:e2e` in leerem Verzeichnis | grün, 2026-07-16, Commit `d801143` |
| Rollback-Probe | worktree-Checkout v1.1.5, Setup + Suite dort; Details docs/RUNBOOK.md | durchgeführt 2026-07-16; Suite läuft; Fund: setup.sh-CDN-Verrottung → behoben (Commit `422aa13`) |
| Reproduzierbarer Stand | Lockfiles committet (Root + video-export), Node gepinnt (`.nvmrc`, `engines`), CDN-Skripte SRI-gepinnt, CI-Actions SHA-gepinnt | erfüllt, 2026-07-16 |
| Release v1.2.0 deployt | annotierter Tag `v1.2.0`, `npm run deploy`, Live-Check von außen (curl) | grün, 2026-07-16 |
| KURZAUDIT-Remediation v1.2.1 (BUG-01, DOC-01, OPS-01, BIZ-01) | je Finding die im Audit benannte Verifikation | grün, 2026-07-16; Einzelheiten im CHANGELOG 1.2.1 |
| Tastatur-Smoketest (UI-Profil) | Prozedur in docs/RUNBOOK.md | Seit 2026-10-09 prüft der Ablauftest die Tab-Reihenfolge von Startbildschirm und Leiste, alle Tasten der Zeitleiste und den Fokus im Impressum. Von Hand am echten Gerät zuletzt nicht wiederholt |

## Externe Kontrollen (außerhalb des Repos)

| Kontrolle | Status | Verifiziert am / wie |
|---|---|---|
| Branch Protection auf `main` inkl. Required Checks | aktiv | 2026-10-09 per GitHub-API gelesen: Pflicht-Checks `lint-and-test`, `secret-scan`, `dependency-audit`; Admin darf direkt pushen (`enforce_admins: false`, bewusste Solo-Ausnahme seit 2026-07-16) |
| GitHub Secret Scanning + Push Protection | aktiv laut Stand 2026-07-16 | 2026-07-16 per API verifiziert; seither nicht neu gemessen |
| 2FA auf GitHub-Account | aktiv laut Stand 2026-07-16 | 2026-07-16 per Sichtprüfung durch den Betreiber; seither nicht neu gemessen |
| Dependabot-Alerts + automatische Sicherheits-Updates | aktiv | 2026-10-09: drei offene Pull Requests von Dependabot (Nr. 2, 4, 6) per `gh pr list` gelesen |
| Google-Cloud-Budget-Alert fürs Firebase-Projekt | aktiv laut Stand 2026-07-16 | 2026-07-16 per gcloud verifiziert; seither nicht neu gemessen |
