# Verifikationsmatrix

Je Anforderung der Nachweisweg. Diese Datei ist die einzige Stelle, an der die
Zahlen der Läufe stehen; andere Dokumente verweisen hierher. Jede Zeile nennt
den Stand (Commit) und das Datum ihrer Messung. Eine Zeile mit älterem Stand
ist seither nicht neu gemessen worden.

Werkzeuge der Messungen vom 2026-10-09: Node v24.21.0 / npm 11.19.0 ·
ESLint 10.7.0 · Playwright 1.61.1 · gitleaks 8.30.1 · firebase-tools 15.32.0.

## Prüfungen vor der Auslieferung

| Anforderung | Befehl | Ergebnis | Stand |
|---|---|---|---|
| Lint | `npm run lint` | Rückgabewert 0 | `c79f02d`, 2026-10-09 01:37 |
| Unit-Tests (QUnit, headless) | `npm run test` | Rückgabewert 0, „QUnit: 2229/2229 assertions passed, 0 failed" | `c79f02d`, 2026-10-09 01:38 |
| Unit-Tests in zufälliger Reihenfolge, ganze Suite und jedes der neun Module allein | Testseite mit `?seed=true` und `&module=…` (Wegwerfskript) | zehn Läufe, je 0 fehlgeschlagen; ganze Suite 2229/2229 | `c79f02d`, 2026-10-09 01:39 |
| Ablauftest mit Barrierefreiheit (axe-core, WCAG 2.x A/AA), hermetisch ohne die echte Datenbank | `npm run test:e2e` | Rückgabewert 0, „E2E: all checks passed", 268 Zeilen „ok", 0 Zeilen „FAIL" | `c79f02d`, 2026-10-09 01:38 |
| Abhängigkeiten | `npm audit --audit-level=high` im Wurzelverzeichnis und in `scripts/video-export` | je Rückgabewert 0, „found 0 vulnerabilities" | `c79f02d`, 2026-10-09 01:39 |
| Geheimnisse in der Historie | `gitleaks git --redact .` | Rückgabewert 0, „74 commits scanned", „no leaks found". Gegenprobe mit zwei erfundenen Schlüsseln im echten Format: Rückgabewert 1, „leaks found: 2" | `c79f02d`, 2026-10-09 01:40 |
| Ausgeliefert wird nur die Seite (Sperre vor dem Deploy) | `node scripts/deploy-files.js` | Rückgabewert 0, „deploy-files: 33 files, all part of the page; all 25 files the page loads are among them". Gegenproben: mit der Ausschlussliste von `85ee8b4` Rückgabewert 1, „133 file(s) that do not belong to the page … (of 166 files)"; fünf Köder in einer Kopie (Sicherungskopie `js/config.js.bak`, Verknüpfung nach außen, fehlendes Icon, fehlendes Skript, neuer Ordner) je Rückgabewert 1 | `c79f02d`, 2026-10-09 01:40 |
| Live-Seite vor dem Deploy (Beleg, dass die Prüfung anschlagen kann) | `bash scripts/verify-live.sh` | Rückgabewert 1, „live site differs (35 problem(s) in 33 files and 21 hidden paths)"; darunter `.git/HEAD`, `.git/config`, `.git/index`, `.claude/settings.local.json`, `.github/workflows/ci.yml` je „EXPOSED … (HTTP 200)". Probe mit einem Prüfsummen-Werkzeug, das nichts liefert: Rückgabewert 2 | Live-Seite v1.2.1 gegen `c79f02d`, 2026-10-09 01:40 |
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

## Audits

| Audit | Stand | Ergebnis | Bericht |
|---|---|---|---|
| KURZ | `1c498c1`, 2026-10-08 | elf Befunde (vier P2, sieben P3), kein P0 oder P1 | `docs/audit/2026-10-08-kurz-1c498c1.md` mit Nachtrag |
| TIEF | `7c49271`, 2026-10-08 | ein P1 (versteckte Ordner auf der Live-Seite, Bestand), zwei P2, elf P3 | `docs/audit/2026-10-08-tief-7c49271.md` mit Nachtrag |
| Nachprüfung der Behebungen | `498c1b3`, 2026-10-09 | Auslieferung geschlossen, Behebungen bestätigt, ein neuer Fehler (Impressum öffnete am Ende), behoben in `c79f02d`; Einzelheiten im Nachtrag des tiefen Berichts, Abschnitt „Abnahme" | `docs/audit/2026-10-09-nachpruefung-498c1b3.md` |

## Nicht belegt

- Lesbarkeit im echten Saal, Klang, Windows-Schulrechner.
- Echtes Safari und Firefox (gemessen sind die Testbrowser von Playwright).
- Loslassen der Maus außerhalb des Fensters und Ruhezustand an einem echten Gerät.
- Die Behebungen in `c79f02d` nach der Nachprüfung: nur vom Autor geprüft
  (Prüfungen und Gegenproben oben), nicht fremd abgenommen.
- Video-Export (`scripts/video-export`): angepasst, nicht ausgeführt, weil
  `ffmpeg` auf dem Rechner nicht startet.

## Auslieferung von v2.0.0

Wird beim Ausliefern gefüllt (Pipeline, Deploy, Vergleich mit der Live-Seite).

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
