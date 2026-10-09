# Verifikationsmatrix

Je Anforderung der Nachweisweg. Diese Datei ist die einzige Stelle, an der die
Zahlen der Läufe stehen; andere Dokumente verweisen hierher. Jede Zeile nennt
den Stand (Commit) und das Datum ihrer Messung. Eine Zeile mit älterem Stand
ist seither nicht neu gemessen worden.

Werkzeuge der Messungen vom 2026-10-09: Node v24.21.0 / npm 11.19.0 ·
ESLint 10.7.0 · Playwright 1.61.1 · gitleaks 8.30.1 · firebase-tools 15.32.0 ·
Xcode 27.0 mit den Simulatoren iPhone 18 Pro, iPhone 17 und iPad mini (A17 Pro),
je iOS 27.0. Messungen ab 17:03 Uhr (Stand `a9c8cb3`) mit den aktualisierten
Werkzeugen: Playwright 1.63.0 (Chromium 153, WebKit 26.6), ESLint 10.12.0,
Prettier 3.9.9.

## Prüfungen vor der Auslieferung

| Anforderung | Befehl | Ergebnis | Stand |
|---|---|---|---|
| Lint | `npm run lint` | Rückgabewert 0 | `ac26a5e`, 2026-10-09 19:47 |
| Unit-Tests (QUnit, headless) | `npm run test` | Rückgabewert 0, „QUnit: 2261/2261 assertions passed, 0 failed" | `ac26a5e`, 2026-10-09 19:47 |
| Unit-Tests in zufälliger Reihenfolge, ganze Suite und jedes der neun Module allein | Testseite mit `?seed=true` und `&module=…` (Wegwerfskript) | zehn Läufe, je 0 fehlgeschlagen; ganze Suite 2261/2261 | `ac26a5e`, 2026-10-09 19:55 |
| Ablauftest mit Barrierefreiheit (axe-core, WCAG 2.x A/AA), hermetisch ohne die echte Datenbank; darin Handys in Chromium und WebKit | `npm run test:e2e` | Rückgabewert 0, „E2E: all checks passed", 400 Zeilen „ok", 0 Zeilen „FAIL" | `ac26a5e`, 2026-10-09 19:50 |
| iPhone und iPad in echtem mobilem Safari (Simulator von Xcode), hermetisch | `npm run test:ios` | Rückgabewert 0, „iOS: all checks passed", 22 Zeilen „ok", 0 Zeilen „FAIL". iPhone 18 Pro: als Handy erkannt, Fenster 402 × 714 sichtbar bei 100vh = 754, in allen fünf Szenen „phone 8 to 678.2, legal notice from 692.1" (36 Pixel höher als in v2.0.1). iPad mini: kein Handy, 744 × 1001 sichtbar | `ac26a5e`, 2026-10-09 19:51 |
| Abhängigkeiten | `npm audit --audit-level=high` im Wurzelverzeichnis und in `scripts/video-export` | je Rückgabewert 0, „found 0 vulnerabilities" | `ac26a5e`, 2026-10-09 19:52 |
| Geheimnisse in der Historie | `gitleaks git --redact .` | Rückgabewert 0, „83 commits scanned", „no leaks found". Gegenprobe vom 2026-10-09 01:40 an `c79f02d` mit zwei erfundenen Schlüsseln im echten Format: Rückgabewert 1, „leaks found: 2" | `ac26a5e`, 2026-10-09 19:52 |
| Ausgeliefert wird nur die Seite (Sperre vor dem Deploy) | `node scripts/deploy-files.js` | Rückgabewert 0, „deploy-files: 33 files, all part of the page; all 25 files the page loads are among them". So auch an `bcf5bd7` am 2026-10-09 16:45. Gegenproben: mit der Ausschlussliste von `85ee8b4` Rückgabewert 1, „133 file(s) that do not belong to the page … (of 166 files)"; fünf Köder in einer Kopie (Sicherungskopie `js/config.js.bak`, Verknüpfung nach außen, fehlendes Icon, fehlendes Skript, neuer Ordner) je Rückgabewert 1 | `c79f02d`, 2026-10-09 01:40 |
| Live-Seite vor dem Deploy (Beleg, dass die Prüfung anschlagen kann) | `bash scripts/verify-live.sh` | Rückgabewert 1, „live site differs (35 problem(s) in 33 files and 21 hidden paths)"; darunter `.git/HEAD`, `.git/config`, `.git/index`, `.claude/settings.local.json`, `.github/workflows/ci.yml` je „EXPOSED … (HTTP 200)". Probe mit einem Prüfsummen-Werkzeug, das nichts liefert: Rückgabewert 2 | Live-Seite v1.2.1 gegen `c79f02d`, 2026-10-09 01:40 |
| Live-Seite vor dem Deploy von v2.0.1 | `bash scripts/verify-live.sh` | Rückgabewert 1, „live site differs (5 problem(s) in 33 files and 21 hidden paths)" | Live-Seite v2.0.0 gegen `bcf5bd7`, 2026-10-09 16:45 |
| Live-Seite vor dem Deploy von v2.0.2 | `bash scripts/verify-live.sh` | Rückgabewert 1, „live site differs (7 problem(s) in 33 files and 21 hidden paths)" | Live-Seite v2.0.1 gegen `ac26a5e`, 2026-10-09 19:52 |
| Pipeline | GitHub Actions, Workflow `ci`, auf dem Pull Request | siehe Abschnitte „Version 2.0.1" und „Auslieferung von v2.0.0" | — |

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
| 6 | `5002054` (Arbeitsstand davor), 2026-10-09 | 17 für die Handy-Fassung ohne Leiste: 14 im Ablauftest, 2 in QUnit, 1 im Simulator | 16 gemeldet, davon zwei an einer anderen Prüfung als erwartet (bei einer brach der Lauf mit 24 „FAIL" ab); 1 nicht gemeldet (die Höhe für die Leiste blieb auf der letzten Seite frei). Dafür eine Prüfung nachgeschrieben, danach gemeldet: „the disclaimer ends 48.0 px above the legal notice". Eine Regel erwies sich dabei als überflüssig und ist entfernt |
| 7 | `ac26a5e` (Arbeitsstand davor), 2026-10-09 | 16 für die Behebungen nach der Abnahme: 12 im Ablauftest, 3 in QUnit, 1 im Simulator; dazu 1 für den Startbildschirm | alle 17 gemeldet, je an der erwarteten Prüfung; die Läufe ohne Rückbau grün. Beispiele: ohne Schonfrist „two quick taps on the start button" rot; Knopf nimmt wieder Gesten an: „nothing lies over the phone" rot; ohne „tabindex": „764 px - entered: igB, igB"; Startzeile: „-7.0 px below the share button" |
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
| Fehler von v2.0.0 am Handy, vor der Behebung | Wegwerf-Messung im Simulator iPhone 17 (iOS 27.0, Safari), Seite mit Beispiel-Konfiguration | Fenster 402 × 714 sichtbar, 100vh = 754; nachgebautes Handy 16,5 bis 657,4, Leiste ab 650,3: 7,1 Pixel Überstand, Eingabeleiste 3,1 von 54 Pixel verdeckt. Für die zweizeilige Safari-Leiste am eigenen Handy (aus einem Foto rund 655 Pixel sichtbar) gerechnet: rund 37 Pixel Überstand, rund 33 von 54 verdeckt | `9b796b3`, 2026-10-09 15:30 |
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
- **Drehen und Tippen in echtem Safari.** Geprüft in Chromium und WebKit mit
  Handy-Kennung, hochkant zusätzlich im Simulator. Der Simulator ließ sich
  weder drehen noch antippen: `xcrun simctl help` kennt kein Drehen, die
  Geräte-App von Xcode 27 heißt DeviceHub, und `osascript` meldete „keine
  Berechtigung für den Hilfszugriff". Entscheidung vom 2026-10-09: nach der
  Auslieferung am eigenen Handy testen.
- Android-Handys und Android-Tablets an echten Geräten: Die Erkennung stützt
  sich dort auf Bildschirmgröße, Kennung und Zeigegerät; gemessen ist keines.
- Echtes Safari und Firefox am Rechner (gemessen sind die Testbrowser von
  Playwright; echtes mobiles Safari deckt `npm run test:ios` ab).
- Loslassen der Maus außerhalb des Fensters und Ruhezustand an einem echten Gerät.
- Die Behebungen in `c79f02d` und alle Behebungen von v2.0.1: nur selbst
  geprüft, nicht unabhängig abgenommen. Für v2.0.2 siehe Abschnitt „Version 2.0.2", Abnahme.

## Version 2.0.2

Prüfungen und Gegenproben stehen in den Tabellen oben, Stand `ac26a5e`.

**Unabhängige Abnahme vor der Auslieferung** (ein zweiter Prüflauf, der die
Ergebnisse der eigenen Prüfungen nicht kannte):

| Schritt | Was | Ergebnis | Zeit (CEST) |
|---|---|---|---|
| Abnahme des Stands `5002054` | elf eigene Sonden in Chromium, WebKit und Firefox, 254 Bilder; dazu `npm run lint`, `npm run test`, `npm run test:e2e` | die fünf Anforderungen erfüllt; sieben Fehler und Lücken, zwei Bestandsfehler; Rückgabewerte 0 / 0 / 0, 2251/2251, 382 „ok" | 2026-10-09 18:29 bis 19:11 |
| Behebung | Commit `ac26a5e` | alle sieben und beide Bestandsfehler bearbeitet, je mit eigener Prüfung; Liste in `docs/handover/2026-10-09-handy-ohne-leiste.md`, Abschnitt 4a | 19:12 bis 19:52 |
| Nachmessung durch denselben Prüflauf | seine eigenen Sonden am Stand `ac26a5e` | alle sieben Funde und beide Bestandsfehler behoben, nichts neu kaputt. Handy: Chromium 37 „ok", WebKit 34; Tablets 234 „ok"; Rechner 14 Fälle gegen v2.0.1, Startbild bytegleich. Nicht nachgemessen: Firefox und ein Handy, das seinen Bildschirm in Gerätepixeln meldet | 19:52 bis 19:59 |

Zwischen der Nachmessung (`ac26a5e`) und dem ausgelieferten Stand liegen nur
`docs/VERIFICATION.md` und `scripts/run-e2e.js` (`git diff --stat ac26a5e
951f6c4`); die Dateien der Seite sind dieselben.

**Auslieferung.** Ausgelieferter Stand: Merge-Commit `0ba12bf` auf `main`
(Inhalt gleich `951f6c4`, `git diff` leer), dazu der Cache-Stempel
`?v=1791570079` in `index.html`.

| Schritt | Befehl | Ergebnis | Zeit (CEST) |
|---|---|---|---|
| Pull Request Nr. 9, Pipeline | `gh pr checks 9` | am Kopf `951f6c4`: `lint-and-test`, `secret-scan`, `dependency-audit` je SUCCESS (Lauf 37972209691). Davor zwei rote Läufe (37969787707, 37970712479) an genau einer Prüfung in WebKit unter Linux: Die Testhilfe wartete nach dem Zurückdrehen feste 150 ms und tippte dann, der Hinweis stand dort noch. Belegt durch die Ausgabe des dritten Laufs (37971…, grün): ein Tipp, ein Klick, Impressum offen. Die Hilfe wartet jetzt auf den Zustand; an der Seite ist dafür nichts geändert | 19:56 bis 20:20 |
| Zusammengeführt | `gh pr merge 9 --merge`; nachgemessen mit `git diff HEAD 951f6c4` | Merge-Commit `0ba12bf`, 0 Zeilen Unterschied zum geprüften Stand | 20:21 |
| Sperre und Deploy | `npm run deploy` von `main` | „deploy-files: 33 files, all part of the page; all 25 files the page loads are among them"; Rückgabewert 0, „found 33 files in .", „release complete", „Deploy complete!" | 20:21 |
| Live-Seite zeigt diesen Stand | `bash scripts/verify-live.sh` | Rückgabewert 0, Fehlerausgabe leer; „live site serves this state (33 of 33 files identical, 21 of 21 tooling files not reachable)"; Cache-Stempel live und lokal `?v=1791570079`. Vor dem Deploy: Rückgabewert 1, sieben Dateien verschieden (Zeile in der Tabelle oben) | 20:21 |
| Kennzeichen der neuen Fassung in den Live-Dateien | `curl` und `grep -c` | `js/helpers.js`: 2 Treffer für `PHONE_DEVICE`; Startseite: 1 Treffer für `id="rotateHint"`; `css/styles.css`: 11 Treffer für `html.phone-device`, 0 für die alte Regel `pointer:coarse` | 20:22 |
| Werkzeuge und versteckte Ordner nicht abrufbar | `curl -s -o /dev/null -w '%{http_code}'` je Pfad | `/.git/HEAD`, `/.claude/settings.local.json`, `/scripts/check-ios.js`, `/docs/VERIFICATION.md`: je 404; `/`: 200 | 20:22 |
| Kopfzeilen | `curl -s -D - -o /dev/null https://cybermobbing.web.app/` | „HTTP/2 200", „cache-control: no-store, must-revalidate", „x-frame-options: DENY" | 20:22 |
| Die ausgelieferten Dateien in echtem mobilem Safari | `npm run test:ios` am Stand `main` nach dem Deploy | Rückgabewert 0, 22 Zeilen „ok" | 20:23 |
| Aufrufzähler unberührt | lesender Abruf von `/views` vor dem Deploy und nach dem letzten Lauf | 361 und 361 | 20:21 und 20:23 |

Rückweg: `docs/RUNBOOK.md`, Abschnitt „Rollback". Sauber sind die Releases von v2.0.1
und v2.0.0 (beide enthalten nur die Seite); die älteren sind seit dem
2026-10-09 22:11 gelöscht. Gezogen wird der Rückweg, wenn Tippen oder Drehen am echten Handy nicht
tun, was hier beschrieben ist.

## Version 2.0.1

Prüfungen, Gegenproben und Messungen stehen in den Tabellen oben, Stand
`bcf5bd7`. Ausgelieferter Stand: Merge-Commit `21ccc6a` auf `main` (Inhalt
gleich `05ebd86`, `git diff` leer; `05ebd86` fügt `bcf5bd7` nur Dokumentation
hinzu), dazu der Cache-Stempel `?v=1791557563` in `index.html`.

| Schritt | Befehl | Ergebnis | Zeit (CEST) |
|---|---|---|---|
| Zweig hochgeladen, Pull Request Nr. 8 | `git push -u origin fix/handy-leiste`, `gh pr create` | Rückgabewert 0; Kopf des Pull Requests `05ebd86` wie lokal | 2026-10-09 16:48 |
| Pipeline auf dem Pull Request | `gh pr checks 8` | `lint-and-test`, `secret-scan`, `dependency-audit`: je SUCCESS (Lauf 37946909806). Im Protokoll: WebKit 26.5 installiert, QUnit 2229/2229, der Abschnitt in WebKit mit fünf Zeilen „ok" unter Linux | 16:52 |
| Zusammengeführt | `gh pr merge 8 --merge`; nachgemessen mit `git diff HEAD 05ebd86` | Merge-Commit `21ccc6a`, 0 Zeilen Unterschied zum geprüften Stand | 16:52 |
| Sperre vor dem Deploy | läuft als `hosting.predeploy`, im Protokoll des Deploys | „deploy-files: 33 files, all part of the page; all 25 files the page loads are among them" | 16:52 |
| Deploy | `npm run deploy` von `main` | Rückgabewert 0; „found 33 files in .", „release complete", „Deploy complete!" | 16:52 |
| Live-Seite zeigt diesen Stand | `bash scripts/verify-live.sh` | Rückgabewert 0, Fehlerausgabe leer; „live site serves this state (33 of 33 files identical, 21 of 21 tooling files not reachable)"; Cache-Stempel live und lokal `?v=1791557563`. Vor dem Deploy: Rückgabewert 1, fünf Dateien verschieden (Zeile in der Tabelle oben) | 16:53 |
| Kennzeichen der Behebung in den Live-Dateien | `curl` und `grep -c` | `css/styles.css`: 4 Treffer für die Handy-Abfrage, `--wh:100dvh` und `body.jumping`; `js/controls.js`: 1 Treffer für `pointer:coarse`; `js/i18n.js`: 0 Treffer für `sim_lang` | 16:53 |
| Werkzeuge und versteckte Ordner nicht abrufbar | `curl -s -o /dev/null -w '%{http_code}'` je Pfad | `/.git/HEAD`, `/.claude/settings.local.json`, `/scripts/check-ios.js`, `/docs/VERIFICATION.md`: je 404; `/` und `/css/styles.css`: je 200 | 16:53 |
| Kopfzeilen | `curl -s -D - -o /dev/null https://cybermobbing.web.app/` | „HTTP/2 200", „cache-control: no-store, must-revalidate", CSP und „x-frame-options: DENY" wie in `firebase.json` | 16:53 |
| Die ausgelieferten Dateien in echtem mobilem Safari | `npm run test:ios` am Stand `main` nach dem Deploy (die Dateien sind laut Prüfsummenvergleich die der Live-Seite) | Rückgabewert 0, „iOS: all checks passed", 22 Zeilen „ok" | 16:55 |
| Aufrufzähler unberührt | lesender Abruf von `/views` vor dem Deploy und nach dem letzten Lauf | 361 und 361 | 16:52 und 16:55 |
| Stempel und Markierung | `git push origin main`, `git tag -a v2.0.1`, `git push origin v2.0.1`; nachgemessen mit `git ls-remote` | `main` und `v2.0.1` auf GitHub je `fcbb963`; Markierung annotiert; `verify-live.sh` danach Rückgabewert 0 | 16:55 |
| Pipeline auf `main` | `gh run list --workflow ci --branch main` | Lauf 37947857745 an `fcbb963`: success. Der Lauf 37947456457 am Merge-Commit `21ccc6a` (Inhalt gleich dem grünen Kopf des Pull Requests) hing 15 Minuten im Schritt „playwright install" und wurde um 17:09 abgebrochen und neu gestartet; der Neustart endete um 17:13 mit success in allen drei Teilen | 17:13 |

Die Live-Seite selbst wurde im Simulator nicht gestartet: Ein Start dort zählt
einen Aufruf. Der Beleg am Gerät ist ein Foto vom echten Handy (Abschnitt „Nicht
belegt").

Rückweg: `docs/RUNBOOK.md`, Abschnitt „Rollback". Für diesen Release ist auch
Weg 1 sauber, solange er auf das Release von v2.0.0 zeigt (das erste, das nur
die Seite enthält). Die älteren Releases sind seit dem 2026-10-09 22:11
gelöscht. Gezogen
wird der Rückweg, wenn die Seite am Handy schlechter aussieht als mit v2.0.0
oder Fehler wirft.

Außerhalb des Repositorys, am 2026-10-09 miterledigt:

| Punkt | Stand |
|---|---|
| Alte Hosting-Releases gelöscht (sie enthielten `.git/` und `.claude/settings.local.json`) | Über den Client der Firebase-CLI: vorher 68 Releases, alle Versionen `FINALIZED`, davon 65 vor dem 2026-10-09 01:44 (28.03. bis 16.07.2026, bis zu 433 Dateien). Gelöscht um 22:11: „Geloescht: 65 | fehlgeschlagen: 0". Nachgezählt um 22:13: „{"FINALIZED":3,"DELETED":65}", die drei Stände vom 2026-10-09 mit je 35 Dateien bleiben; `verify-live.sh` Rückgabewert 0, `/` 200, `/.git/HEAD` 404. Das Skript brach ab, wenn nicht genau diese drei Stände übrig geblieben wären |
| `ffmpeg` auf dem Entwicklungsrechner | `brew upgrade ffmpeg`: 8.1 auf 9.0.2 (die alte Fassung suchte `libx265.215`, installiert war `libx265.217`); `ffmpeg -version` startet, 2026-10-09 16:51 |
| Video-Export einmal ausgeführt | `node export-video.js` in `scripts/video-export`, 16:57 bis 17:01: Rückgabewert 0, „Aufnahme beendet nach 165.0s"; `ffprobe`: h264 und aac, 2160 × 4680, 169 s; dazu die FHD-Fassung. Sichtprüfung an sechs Einzelbildern (8, 25, 60, 85, 125, 160 s): Handy bildfüllend, keine Steuerleiste im Bild, wie im Video vom 2026-05-16. Die zwei alten Videos liegen als Kopie in `output/sicherung-2026-05-16/` (bytegleich geprüft). Der erste Versuch brach ab, weil der Anschluss 8765 von einem fremden Programm belegt war (`server.py 8765`, nicht aus diesem Projekt); der Lauf nutzte deshalb eine Wegwerfkopie des Skripts mit Anschluss 8791. Das fremde Programm blieb unberührt |
| Drei Vorschläge von Dependabot | je Versionshinweise gelesen, Änderung und Bezugsquellen geprüft, Pipeline auf dem neu aufgesetzten Vorschlag grün, dann `gh pr merge`: Nr. 2 `actions/checkout` 7.0.0 auf 7.0.1 (festgeschriebene Kennung gleich der Markierung `v7.0.1`); Nr. 4 Playwright 1.61.1 auf 1.63.0 in `scripts/video-export`; Nr. 6 im Wurzelverzeichnis `@axe-core/playwright` 4.13.0, ESLint 10.12.0, `globals` 17.13.0, Playwright 1.63.0, Prettier 3.9.9, dazu acht neue und zwei entfallene Unterpakete, alle 22 Bezugsquellen `registry.npmjs.org`. Zusammengeführt um 17:02 (`95198ef`, `708c5cf`, `a9c8cb3`). Danach am Stand `a9c8cb3`, 17:03 bis 17:07: `npm run lint` 0; QUnit 2229/2229; Ablauftest 356 „ok", 0 „FAIL"; `npm run test:ios` 22 „ok"; `npm audit` zweimal 0; `verify-live.sh` Rückgabewert 0 (die Seite ist unverändert); Pipeline-Lauf 37948757684 success |
| Alter Zweig `feat/beamer-ansicht` | vorher: `git rev-list --count origin/main..origin/feat/beamer-ansicht` ergibt 0. Gelöscht auf GitHub und lokal um 16:56; `git ls-remote origin refs/heads/feat/beamer-ansicht` liefert 0 Zeilen, derselbe Befehl für `main` 1 Zeile |

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
wie auf den Bildschirmfotos vom Abend; gezählt wurde also nicht.
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
| 2FA auf GitHub-Account | aktiv laut Stand 2026-07-16 | 2026-07-16 per Sichtprüfung; seither nicht neu gemessen |
| Dependabot-Alerts + automatische Sicherheits-Updates | aktiv | 2026-10-09: drei offene Pull Requests von Dependabot (Nr. 2, 4, 6) per `gh pr list` gelesen |
| Google-Cloud-Budget-Alert fürs Firebase-Projekt | aktiv laut Stand 2026-07-16 | 2026-07-16 per gcloud verifiziert; seither nicht neu gemessen |
