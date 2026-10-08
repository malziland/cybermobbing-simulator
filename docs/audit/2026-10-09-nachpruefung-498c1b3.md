# Nachprüfung der Behebungen nach dem tiefen Audit — Commit `498c1b3`

Gegenstand: nur das Delta `7c49271..498c1b3` (Zweig `feat/beamer-ansicht`) und der Behebungsstand der Befunde aus
`2026-10-08-tief-7c49271.md`. Kein neues Voll-Audit. Abgenommen von einer Instanz, die die Behebungen nicht geschrieben hat
(KERN 9). Am Projekt wurde nichts verändert außer dieser einen neuen Datei. **Abgabekontrolle selbst abgenommen** (KERN 17); die
Formprüfung `abgabe-check.sh` ist nicht angewandt, weil der Auftrag eine Kurzform vorgibt.

## 0. Ergebnis

**Nicht unverändert ausliefern: eine Stelle vorher ändern.** `js/main.js:241` setzt beim Öffnen des Impressums den Fokus auf den
Schließen-Knopf; der steht am Ende des rollbaren Textes (`index.html:178`), und der Browser rollt dorthin. Das Impressum öffnet
deshalb in jedem Browser, jeder Fenstergröße und auf jedem Weg **am Ende statt am Anfang** (neu durch dieses Delta, Befund
BUG-2026-10-09-01). In einer Kopie erprobte Abhilfe: `closeBtn.focus({ preventScroll: true })` und den Rollstand von `.imp-scroll`
auf 0 setzen; dazu eine Prüfung im Ablauftest.

Alles andere steht der Auslieferung nicht entgegen: Die Auslieferkette ist geschlossen (33 Dateien, keine fremde), der Start hängt
nicht mehr am fremden Skript, der Zähler ist unbeschädigt, die Riegel sind grün. Ist die eine Änderung heute Nacht nicht mehr
möglich, ist das Ausliefern von `498c1b3` dem Nichtausliefern vorzuziehen: `.git/` ist bis zum Deploy weiter öffentlich, und das
wiegt schwerer als ein falsch gerolltes Impressum.

## 1. Prüfstand

| Angabe | Gemessen |
|---|---|
| Systemzeit | Beginn 2026-10-09 00:26:38 CEST, letzte Messung 01:23:06 (`HEAD` = `357560e`, Arbeitsbaum: nur diese Datei unverfolgt, kein Testprozess) |
| Commit, Zweig | 00:26: `HEAD` = `498c1b3`, `feat/beamer-ansicht`, Arbeitsbaum `?? docs/audit/`. **01:18: `HEAD` = `357560e`**: drei neue Commits des Autors (`5aee659` 00:41, `136e795` 00:54, `357560e` 00:57). Sie ändern nur `scripts/run-e2e.js`, `docs/VERIFICATION.md` und `docs/audit/`. `git diff --quiet 498c1b3 357560e -- index.html css js assets favicon.svg llms.txt robots.txt sitemap.xml LICENSE firebase.json database.rules.json scripts/deploy-files.js scripts/verify-live.sh scripts/cache-bust.sh package.json tests .github`: Rückgabewert 0 |
| Ausgeliefert | `https://cybermobbing.web.app`: `/.git/HEAD` HTTP 200, `/js/stage.js` HTTP 404 (00:30, über `verify-live.sh`): weiter v1.2.1 |
| Fremdprozesse | 00:26 drei Ablauftests des Autors gleichzeitig, 00:50 und 00:54 noch einer, 01:07 und 01:23 keiner (`ps`). Testserver auf Port 5056 nicht berührt |
| Werkzeuge | Node v24.21.0, Playwright aus `node_modules` des Projekts (Chromium, Firefox, WebKit), **firebase-tools 15.32.0** (der tiefe Bericht nennt 15.28.2) |
| Stufe | SCHWER (Auslieferkette); Messtiefe MESSEND, nur an Kopien aus `git archive` |

Abweichungen zum Auftrag: (1) Der Stand hat sich bewegt (siehe oben); alle Messungen gelten für `498c1b3`, die Riegel zusätzlich
für `357560e`. (2) Sitzungsprotokolle sind nicht gelesen (KERN 7); Gegenevidenz ist an Code, Doku, ADRs und Tests gesucht.

Hermetik: Geladen wurden nur Kopien. `js/config.js` war immer `js/config.example.js`; für „wie live" wurde nur der Block
`helplineConfig` maschinell übernommen, nie ausgegeben. Datenbank-Hosts wurden in jedem Lauf abgebrochen; der echte Zähler war
nicht erreichbar. Echte Abrufe gingen nur an `www.gstatic.com` (Sonde 2d) und lesend an die Live-Seite (`verify-live.sh`).
Wegwerfskripte und Rohausgaben: `…/scratchpad/nachpruefung/skripte/` und `…/aus/` (flüchtig).

## 2. Punkt 1 — SEC-2026-10-08-01, die Auslieferung

| Befehl | Wogegen | Ergebnis | Stand |
|---|---|---|---|
| `deployliste.js` (ruft `listFiles()` aus `$(npm root -g)/firebase-tools/lib/listFiles.js` mit `hosting.ignore`) | Arbeitsverzeichnis, nur lesend | „firebase-tools 15.32.0 … 33 Dateien", je Ordner `(Wurzel) 6, assets/ 11, css/ 1, js/ 15`, „Pfade mit Punkt-Teil: 0". Liste: `LICENSE`, `favicon.svg`, `index.html`, `llms.txt`, `robots.txt`, `sitemap.xml`, `css/styles.css`, 15 Skripte samt `js/config.js`, 11 Dateien in `assets/` | 00:29 |
| `grep` nach `src=`, `href=`, `url(` und Dateiendungen | `index.html`, `css/styles.css`, `js/` | jede geladene Datei steht in der Liste (5 Icons, `bgm.mp3`, `photo.jpg`, `sticker.png`, 14 eigene Skripte, `styles.css`, `favicon.svg`, `og-image.png`); `robots.txt` nennt `sitemap.xml`, beide dabei | 00:29 |
| `cut -d, -f1 .firebase/hosting..cache` | letzter Deploy | 63 Dateien außerhalb der Punkt-Ordner; die neue Liste ist dieselbe ohne Doku, Tests, Werkzeug, plus `js/stage.js` und `js/controls.js`. Keine Bestätigungsdatei für Suchmaschinen dabei | 00:29 |
| `node scripts/deploy-files.js`, 32 Proben (Köderdateien, fehlende Dateien, Symlinks, fehlende CLI, veränderte Konfiguration) | Kopie mit Attrappe als `js/config.js` | Rückgabewert 1 bei: neuem Ordner, Wurzeldatei, Leerzeichen im Namen, Großbuchstaben, `google1234.html`, Symlink auf Datei oder Ordner in der Wurzel, fehlender `js/config.js`, fehlendem `hosting.ignore`, `hosting` als Liste, **zurückgebauter Regel `"**/.*/**"`** („6 file(s) that do not belong to the page … (of 39 files)"). Rückgabewert 2 bei fehlender CLI und leerem Ordner. Rückgabewert 0 und **nicht in der Uploadliste**: `js/.geheim`, `assets/.env`, `.geheim/schluessel.pem`, `js/.cache/tief/a.js`, `NOTIZ.MD` | 00:31–00:33 |
| dieselbe | dieselbe | **Rückgabewert 0 und in der Uploadliste:** `js/config.js.bak`, `assets/kundenliste.csv`, `js/mit leer.js`, `css/Entwurf/ALT.CSS`, Symlink `assets/extern` auf einen Ordner außerhalb. **Rückgabewert 0, obwohl die Seite unvollständig wäre:** ohne `assets/icons/`, ohne Logo, ohne `js/stage.js`, ohne `robots.txt`, `js/main.js` leer (OPS-2026-10-09-02) | 00:32 |
| Quelltext `deploy/index.js:139-200`, `deploy/lifecycleHooks.js:12-45`, `commands/hosting-channel-deploy.js:91` | firebase-tools 15.32.0 | `await chain(predeploys, …)` steht vor `prepares`, `deploys`, `releases`; `code !== 0` → `reject(new Error("Command terminated with non-zero exit code " + code))`; der Kanal-Deploy ruft dieselbe Funktion. Suche nach einer Option zum Überspringen in vier Dateien: 0 Treffer (Positivkontrolle „predeploy": 4) | 00:30 |
| `haken.js` (ruft `lifecycleHooks('hosting','predeploy')` der CLI auf, kein Deploy, kein Netz) | Kopie in einem Ordner mit Leerzeichen im Pfad | sauber: „deploy-files: 33 files, all part of the page", erfüllt. Mit Köder: „FirebaseError: hosting predeploy error: Command terminated with non-zero exit code 1"; ebenso mit `--only hosting` und `--only hosting:cybermobbing` | 01:08 |
| `bash scripts/verify-live.sh` | Live-Seite, lesend, aus dem Arbeitsverzeichnis | **Rückgabewert 1**, stderr leer: 16 „same" (darunter `js/config.js`), 15 „DIFFERENT", 2 „MISSING" (`js/controls.js`, `js/stage.js`), 18 „EXPOSED" (darunter `.git/HEAD`, `.git/config`, `.git/index`, `.claude/settings.local.json`, `.github/workflows/ci.yml`), 3 „hidden"; „RESULT: live site differs (35 problem(s) in 33 files and 21 hidden paths)". `git status` danach unverändert | 00:30 |
| dasselbe mit einem `PATH` ohne `shasum` | Live-Seite, aus der Köderkopie | **31 „same", 0 „DIFFERENT"** (mit `shasum`: 15 und 16); die Prüfsummen sind dann beide leer und gelten als gleich (OPS-2026-10-09-01) | 01:09 |

Ergebnis: **behoben.** Aus dem Arbeitsverzeichnis gingen heute 33 Dateien hoch, alle Teil der Seite, nichts fehlt. Der Haken läuft
bei jedem Deploy mit Hosting-Ziel und bricht ihn vor dem ersten Upload ab. Außerhalb der Reichweite der Sperre: ein Deploy mit
`--public` oder `--config` an `firebase.json` vorbei (AGENTS.md verbietet es; eine Kontrolle dafür gibt es nicht), und ein
Arbeitsbaum mit nicht eingecheckten Änderungen in `js/`, `css/`, `assets/` (ausgeliefert wird das Verzeichnis, nicht der Commit).

## 3. Punkt 2 — BUG-2026-10-08-06, Start ohne Zähler

| Befehl | Wogegen | Ergebnis | Stand |
|---|---|---|---|
| `sonde2a-start.js` | Kopie `498c1b3`; Chromium, Firefox, WebKit; echte Geschwindigkeit | 18 von 18 Lagen gestartet („Start weg=true Handy=true sec=2.4 bis 2.5 WhatsApp an=true"): SDK abgelehnt, SDK antwortet nicht, `config.js` fehlt (mit und ohne SDK), nur das zweite SDK-Skript abgelehnt, erstes SDK-Skript hängt. In der Lage „nur das zweite abgelehnt" 1 Seitenfehler des Zähler-Skripts („firebase.database is not a function"), der Start ist unberührt | 00:35 |
| dieselbe | Kopie `7c49271` (Positivkontrolle) | 12 von 12 „Start weg=false Handy=false" | 00:37 |
| `sonde2b-zaehler.js` (Ersatz-SDK) | Kopie, drei Browser | 39 von 39 ok: Zahl „1.234" sichtbar; ein Start schreibt genau „daily/2026-10-08=42, views=42"; nach Pause, 4 Sprüngen und zweimal `go()` weiter 2 Zählungen; zweiter Start am selben Tag 0 Zählungen; Tageszähler 999 → Startbildschirm, 1000 und 1001 → Grenzseite (Grenze einschließlich); antwortet die Datenbank nie, steht „--" nach 4,0 s und ist nach 5,8 s weg; ebenso bei hängendem und abgelehntem SDK | 00:38 |
| `sonde2c-wettlauf.js` | Kopie und Anker, drei Browser | Klick 73 bis 169 ms nach Erscheinen des Knopfs, SDK 1,5 s und 6 s verzögert: Simulation läuft, **„Zaehlungen []", Tagesmerker leer**; nie doppelt. Nach Neuladen mit bereitem Zähler zählt derselbe Browser einmal. Bei 6 s Verzögerung ist der Kasten der letzten Seite ausgeblendet, obwohl die Zahl ankommt. Tagesgrenze im Wettlauf: Grenzseite liegt über der laufenden Simulation, Musik spielt; am Anker bei später Antwort der Datenbank genauso | 00:41 |
| `sonde2d-fenster.js` (echter SDK-Host, kalter Cache) | Kopie, drei Browser, je 4 Läufe | Knopf bedienbar bis Zähler bereit: 80 bis 207 ms, „bereit=true" in allen 12 | 00:43 |

Ergebnis: **behoben**, der Zähler ist unbeschädigt. Wettlauf: Wer startet, bevor das Zähler-Skript da ist, wird nicht gezählt; die
Zählung wird in diesem Lauf nicht nachgeholt (BUG-2026-10-09-03). Kein Hindernis: Das Fenster ist auf dieser Leitung höchstens
0,2 s lang, und vor dem Umbau startete in derselben Lage gar nichts.

## 4. Punkt 3 — die übrigen Behebungen

| Befund | Messung (Kopie `498c1b3`; Positivkontrolle an `7c49271`) | Ergebnis |
|---|---|---|
| BUG-07 | `sonde3` Teil C, drei Browser: pausiert auf der letzten Seite, Teilen: „nach 0,3 s da=true, nach 3,3 s da=false". Anker: „nach 3,3 s da=true Deckkraft 1" | behoben |
| BUG-08 | `sonde8-uhr.js`, jeder Browser allein, ein fremder Ablauftest lief nebenher: 30 s Lauf Chromium −0,04 s, **Firefox −0,03 s, WebKit −0,06 s** (Takt im Mittel 101,0 und 104,1 ms); Wechsel zu Instagram bei Uhr 28,00 / 27,96 / 27,96 s. Anker: Firefox −0,32 s, WebKit −1,23 s, Wechsel bei 27,70 und 26,90 s. Pause 2 s: Uhr steht (3,00 → 3,00); Sprung auf 20 s, 2,00 s später 21,92 bis 22,00; Ziehen auf 25 s, 1 s gehalten: steht; Wechsel danach bei 27,93 bis 28,00. `?testspeed=10`: 27,92 bis 28,02; `=60`: 27,94 bis 28,12. Takt auf 1 s gedrosselt, 24 s: Uhr 22,1 s bei 22,6 s echter Zeit, Pfeil rechts landet bei 27,1 | behoben |
| BUG-09 | `sonde3` Teil A, WebKit, Beamer-Ansicht, 228 Sprungziele: „Ziele mit unsichtbarer oder leerer Nachricht 0" (Anker: 145, „Deckkraft 0, Hoehe 0"). Rest (`sonde5b`): Die ältere Nachricht steht in WebKit im ersten Bild mit Deckkraft 1,00 und dimmt in 0,4 s auf 0,50 („Uebergang opacity running"); in Chromium sofort 0,50 | behoben, kosmetischer Rest |
| BUG-10 | `sonde3` Teil A, Verdana, drei Browser: „oben abgeschnitten 0 Ziele" in Deutsch und Englisch. Anker: „19 Ziele (hoechstens 41 px)" und „11 Ziele (hoechstens 26 px)" | behoben |
| BUG-11 | `sonde3` Teil D, drei Browser: nach `blur`, `visibilitychange` und einer Bewegung ohne gedrückte Taste „gezogen=false … in 1,5 s lief die Uhr 1.46 bis 1.55 s weiter, Pause wirkt=true"; spätes Loslassen springt nicht (sec 61,4 bis 61,6). Anker: jeweils „gezogen=true … 0.00 s weiter, Pause wirkt=false". Kommt keines der drei Ereignisse, bleibt es stehen wie zuvor. Normales Ziehen arbeitet in allen drei Browsern | behoben, soweit ohne Bildschirm messbar; echte Fensterwechsel bleiben Handprobe |
| UX-03 | `sonde3` Teil B, drei Browser, Handy-Ansicht: 26 Sprungziele mit Hinweis, „im ersten Bild nicht voll sichtbar: 0", stehen gebliebene 0; beim Ziehen Deckkraft 1,00. Anker: 18 von 18 nicht voll sichtbar (0,01), 2 stehen geblieben | behoben |
| UX-04 | `sonde5-impressum.js`, drei Browser: Fokus auf `impCloseBtn`, sieben Bereiche abgeschaltet, 12-mal Tab landet nie dahinter (Chromium: 10-mal Dialog, 2-mal Fensterrahmen; Firefox: 12-mal Dialog; WebKit nicht gemessen, dort geht Tab ab Werk nur zu Eingabefeldern), nach Escape, Knopf oder Hintergrundklick nichts mehr abgeschaltet, Fokus zurück; Pfeiltasten, B, M ohne Wirkung dahinter. axe-core auf Impressum und auf die letzte Seite mit zwei Links und Logo: je 0 Verstöße; Links 24/24 px. `lang`: „(ohne) → de, ?lang=en → en, ?lang=xx → de". Fokus von Pause geht am Ende auf `ctlSeek` (Anker: `BODY`). **Nebenwirkung: BUG-2026-10-09-01** | behoben mit neuer Nebenwirkung |
| UX-05 | `sonde4-layout.js`, drei Browser, je 128 Lagen (19 Fenstergrößen von 320×568 bis 2560×1080, zwei Sprachen, beide Ansichten, Start und letzte Seite, Hilfsblock wie live): „mit Meldung: 0"; jedes Teil lässt sich in den sichtbaren Bereich rollen und ist dann unverdeckt, der Anfang ist erreichbar. Anker: Logo bei 568×320 nicht erreichbar („Anfang (ctaLogo) 84 px oberhalb"). **Nebenwirkung: UX-2026-10-09-01** | behoben mit neuer Nebenwirkung |
| DOC-03 | Sichtprüfung: `docs/RUNBOOK.md:11-15` neu und richtig; ADR-0008 nennt die 36 Pixel bis 500 Pixel Breite (`css/styles.css:813`); `CONTRIBUTING.md:17-18` nennt `cybermobbing-simulator`. (c) Datenschutztext: beim Betreiber | behoben, (c) Entscheidung |
| DOC-01 | `grep -rn -E "[0-9]{1,3} ?(-\|bis) ?[0-9]{2,3} ?s" js`: 0 Treffer (Anker: 2) | behoben |
| BUG-05 | Normallauf (unten): Hinweisdauern 2,50 / 1,50 / 2,00 / 1,50 / 1,50 / 2,00 / 2,00 s; die drei mit 1,50 s werden vom nächsten Hinweis abgelöst. Anker: 2,50 / 1,50 / 0,50 / 1,50 / 0,50 / 0,50 / 2,00 s | behoben; drei Hinweise 1,5 s durch die Taktung |
| TEST-02 | `rueckbau.py zehn`, je eigene Kopie, Tests unverändert: **9 von 10 erkannt** (x06, x19, x09, x11, x24, x02, x04, x27, x18, je mit „FAIL …" oder QUnit rot). **Nicht erkannt: x37** (`js/main.js:282-283`, Platz für den Hinweistext folgt einer Fensteränderung nicht): „eslint 0, QUnit 2227/2227, E2E exit 0, 261 ok". Der Ablauftest läuft weiter nur in Chromium | teilbehoben |

Rückbauten der neuen Behebungen (`rueckbau.py neu`): erkannt b06c (Start wartet wieder auf das Dokument), b06e (Tagesmerker),
b08 (Uhr zählt Takte), b05 (Hinweis-Zeitgeber), b04 (`inert`). Nicht erkannt: Schutz in `go()` allein, `counterReady` allein,
`defer` am SDK allein, `stageFitLists()` in `ctlSettle()` allein (jeweils doppelt gesichert, kein Mangel) und der Zeitgeber in
`js/main.js:376-380`, der „--" nach 5 s ausblendet, wenn das Zähler-Skript nie kommt (nur der Linter schlug an).

## 5. Punkt 4 — neue Fehler durch die Behebungen

| Befehl | Wogegen | Ergebnis | Stand |
|---|---|---|---|
| `sonde1-normal.js`, echte Geschwindigkeit, 141,5 s | Kopie und Anker; Handy-Ansicht 1280×800, Beamer-Ansicht 1920×1080 | Chromium beide Ansichten: 88 Ereignisse, „Folge der Ereignisarten gleich=true, groesste Zeitabweichung 0.00 s" gegen den Anker. Firefox: gleich, 0,04 und 0,09 s. WebKit: gleich bis auf die Uhr beim Erscheinen der letzten Seite (133,9 statt 134,0), 0,01 s. Szenenwechsel 28,5 / 56,5 / 80,5 / 95,5 / 114,5 s nach dem Klick, letzte Seite 134,5 bis 134,7; Uhr am Ende 140,0 bis 140,1; 2 Zählungen; 0 Seitenfehler; große Nachrichten 34, davon ohne Einblendung 0 | 01:07–01:12 |
| `sonde5c-rollen.js` | Kopie; drei Browser, vier Fenstergrößen, drei Wege | **36 von 36: „Text gerollt um 834 von 834 px, Ueberschrift zu sehen=false"** (1280×720; sonst 716 bis 942 px). Anker: „gerollt um 0 …, Ueberschrift zu sehen=true". Mit der Abhilfe in einer Kopie: 27 von 27 ausgewerteten Lagen (drei Fenstergrößen) „gerollt um 0", Fokus weiter auf `impCloseBtn` | 01:12–01:17 |
| `sonde4b-ohne-rollen.js` | Kopie und Anker, Chromium, 17 Fenstergrößen von 960×540 bis 1920×1080 | ab 1024×600 an beiden Ständen alles ohne Rollen zu sehen. **960×540, letzte Seite, Deutsch:** neu „footerReplayBtn 35%, .fin-views 0%" (Beamer-Ansicht 49 % und 0 %), Anker „.fin-views 73%" und 95 % | 01:04 |
| `sonde8-uhr.js` Teil 5 | Kopie, drei Browser | Springt die Wanduhr um 60 s, ohne dass die Zeitgeber mitspringen: „Uhr 4.5 -> 65.5 s, App aWa"; 25 s später „Uhr 90.5 s, Knopf bei 64.6%, App aIg" | 00:55 |

**Neue Befunde**

| ID | Fundort | Auslöser | Folge | Beleglage | Vor oder nach der Auslieferung | Verifikation |
|---|---|---|---|---|---|---|
| BUG-2026-10-09-01 | `js/main.js:240-241`, `index.html:143`, `:178` | Impressum öffnen, gleich wie | Man sieht den Schluss des Datenschutz-Absatzes und den Schließen-Knopf; Überschrift und Anbieterangaben liegen oberhalb. Kein Test bemerkt es: Riegel an `357560e` grün (266 ok). Gegenevidenz: Suche nach `preventScroll`, `imp-scroll`, `scrollTop` in Doku, Tests und Code ohne Treffer zu einer Entscheidung (Positivkontrolle: 5 Treffer in `index.html` und CSS) | **reproduziert**, 36 von 36 | **vorher** | `sonde5c` oder von Hand: Impressum öffnen, die Überschrift „Impressum" steht oben |
| UX-2026-10-09-01 | `css/styles.css:304-317` | Fenster um 960×540 (auch 701×500, 800×600 in der Beamer-Ansicht), letzte Seite | „Nochmal" zu 35 bis 49 % und der Zähler gar nicht zu sehen, bis man rollt; vorher fehlten nur bis zu 27 % des Zählers. Die Verdichtung greift erst unter 480 Pixel Höhe. Ab 1024×600 ohne Unterschied | **reproduziert** (Chromium) | danach | `sonde4b`, Zeile 960×540: „alles" |
| BUG-2026-10-09-02 | `js/timer.js:41-47` | Die Wanduhr springt, die Zeitgeber nicht (Rechner im Ruhezustand während des Laufs, Zeitkorrektur) | Der Knopf der Zeitleiste steht um die Sprungweite vor den Szenen, Pfeiltasten rechnen vom falschen Stand; heilt beim nächsten Klick auf die Zeitleiste. Vor der Behebung von BUG-08 trat es nicht auf | Mechanik **reproduziert**, Auslöser im echten Browser **plausibel** | danach | `sonde8` Teil 5: Uhr bleibt bei der Szene |
| BUG-2026-10-09-03 | `js/main.js:95-96`, `js/firebase-counter.js:81-84`, `js/main.js:376-380` | Start, bevor das Zähler-Skript geladen ist (hier 0,08 bis 0,21 s; in langsamen Netzen länger) | Der Start wird nicht gezählt und nicht nachgeholt; braucht das SDK länger als 5 s, bleibt die Zahl auf der letzten Seite ausgeblendet | **reproduziert** | danach | `sonde2c`: nach spätem Laden genau eine Zählung |
| OPS-2026-10-09-01 | `scripts/verify-live.sh:18`, `:48` | `shasum` fehlt auf dem Rechner | Alle erreichbaren Dateien gelten als gleich; ein falscher Deploy bliebe unbemerkt. Auf diesem Rechner ist `shasum` vorhanden (Lauf von 00:30 mit 15 „DIFFERENT") | **reproduziert** | danach | `PATH` ohne `shasum`: Rückgabewert 2 |
| OPS-2026-10-09-02 | `scripts/deploy-files.js:31`, `:33`, `:65-69` | Fremde Datei in `js/`, `css/` oder `assets/`; oder Deploy ohne Icons, Logo oder ein Skript | Die Sperre meldet Erfolg; die Datei geht live, oder die Seite geht unvollständig live, und `verify-live.sh` meldet „serves this state". Heute liegt im Arbeitsverzeichnis nichts dergleichen (33 Dateien geprüft) | **reproduziert** | danach | Köder `js/config.js.bak` und fehlendes `assets/icons/`: Rückgabewert 1 |
| TEST-2026-10-09-01 | `scripts/run-e2e.js` | Rückbau von `js/main.js:282-283` oder `:376-380`; Rollstand des Impressums | Kette bleibt grün | **reproduziert** | danach, bis auf die Prüfung zu BUG-2026-10-09-01 | Rückbauten wiederholen |

Gelesen und ohne Befund: `stageJumping` und `st-still` (im Normallauf 0 von 34 Nachrichten ohne Einblendung, die erste reguläre
Nachricht nach einem Sprung blendet wieder ein), `inert` (bleibt auf keinem Weg hängen), `e.buttons`, `blur`,
`visibilitychange` (normales Ziehen unverändert in drei Browsern), `overflow-y:auto` an `#start` und `.cta-screen` (unter der
Seite liegen nur Hinweistext, Leiste und Impressum-Link; Fensteränderung 1280×720 → 360×640: `--disc-h` 57px → 100px, Seite endet
bei 515, Hinweistext beginnt bei 516). Nicht gemessen: Browser ohne das Schlüsselwort `safe` (ältere Safari); dort gälte für
niedrige Fenster wieder die mittige Ausrichtung mit abgeschnittenem Anfang.

## 6. Punkt 5 — die drei Riegel

| Befehl | Wogegen | Ergebnis | Stand |
|---|---|---|---|
| `npm run lint`, `npm run test`, `npm run test:e2e` | Kopie `498c1b3` mit Icons und Logo | Rückgabewerte 0 / 0 / 0; „All matched files use Prettier code style!"; „QUnit: 2227/2227 assertions passed, 0 failed"; 261 Zeilen „ok", 0 „FAIL", „E2E: all checks passed"; stderr leer | 00:28–00:30, unter Fremdlast |
| dieselben | dieselbe Kopie (`diff -rq` gegen `git archive 498c1b3`: nur Icons, Logo, `node_modules`) | 0 / 0 / 0; 2227/2227; 261 „ok", 0 „FAIL"; stderr leer | 01:15–01:17, ohne Fremdlast |
| dieselben | Kopie `357560e` | 0 / 0 / 0; 2227/2227; 266 „ok", 0 „FAIL"; stderr leer | 01:18–01:20 |

## 7. Stand der Befunde des tiefen Audits

| Befund | Stand |
|---|---|
| SEC-2026-10-08-01 | behoben im Repository; an der Live-Seite erst mit dem Deploy (Nachweis: `verify-live.sh` Rückgabewert 0, stderr leer) |
| BUG-2026-10-08-06 | behoben |
| TEST-2026-10-08-02 | teilbehoben (9 von 10; ein Browser) |
| BUG-2026-10-08-07 | behoben |
| BUG-2026-10-08-08 | behoben |
| BUG-2026-10-08-09 | behoben, kosmetischer Rest in WebKit |
| BUG-2026-10-08-10 | behoben |
| BUG-2026-10-08-11 | behoben, soweit messbar; Handprobe am echten Browser offen |
| UX-2026-10-08-03 | behoben |
| UX-2026-10-08-04 | behoben, mit neuer Nebenwirkung BUG-2026-10-09-01 |
| UX-2026-10-08-05 | behoben, mit neuer Nebenwirkung UX-2026-10-09-01 |
| DOC-2026-10-08-03 | behoben; (c) Entscheidung des Betreibers |
| BUG-2026-10-08-05 | behoben |
| DOC-2026-10-08-01 | behoben |

## 8. Offene Punkte

1. **Entscheidung:** BUG-2026-10-09-01 vor dem Deploy beheben? Empfehlung: ja, eine Zeile und eine Prüfung, danach die Riegel.
   Folge des Nichtstuns: Jeder, der das Impressum öffnet, sieht zuerst dessen Ende.
2. **Jetzt nicht prüfbar:** das Verhalten in echten Browsern mit Bildschirm (Fensterwechsel beim Ziehen, Ruhezustand, Safari).
   Prüfbar am ersten Einsatzort.
3. **Nach dem Deploy nachzumessen:** `bash scripts/verify-live.sh` endet mit 0, und die Fehlerausgabe ist leer.

## 9. Eigene Fehlgriffe und Grenzen

(1) Sonde 3 lief am Anker zuerst ins Leere, weil dort ohne SDK nichts startet; mit Ersatz-SDK wiederholt. (2) Ein Vergleichsbefehl
endete wegen eines leeren Dateimusters vor dem `diff` und meldete trotzdem „gleich"; sauber wiederholt (`diff` Rückgabewert 1,
nur Icons, Logo, `node_modules`). (3) Der erste Vergleich der Ereignisfolgen schlug in Firefox und WebKit an, weil die Uhrzeit in
den Nachrichten steckt und die Läufe drei Minuten auseinanderlagen; ohne den Textanteil wiederholt. (4) In Sonde 5 schloss ein
Klick auf die Stelle des Pause-Knopfs den Dialog über dessen Hintergrund; Tasten und Klick sind danach getrennt gemessen.
(5) Die Layout-Sonde erkennt Überdeckung durch den Hinweistext nicht über den obersten Treffer, weil der Text keine Klicks
annimmt; dafür steht die Messung „ohne Rollen" (Sonde 4b). Alle Browser liefen ohne Bildschirm; „WebKit" ist die Technik von
Playwright, nicht Safari.

## 10. Rückmeldung an die Familie

- Fehlerklasse ohne Regel: Eine Behebung für die Tastatur (Fokus setzen) verändert, was die Maus sieht. Beleg: Fokus auf den
  letzten Knopf eines rollbaren Dialogs, 36 von 36 Öffnungen am Ende. Gemessen wurde bei der Behebung nur, wo der Fokus liegt.
- Fehlerklasse ohne Regel: Ein Vergleich über ein Werkzeug, dessen leere Ausgabe auf beiden Seiten gleich ist. Beleg:
  `verify-live.sh` ohne `shasum`, 31 von 31 „same".
- Aufwand mit Ertrag: Positivkontrolle am alten Stand zu jeder Sonde; ohne sie hätte Sonde 3 „0 Befunde" aus einem Lauf
  gemeldet, der nie startete.

Nicht an `~/.claude/skills/audit-familie/LEHREN.md` angehängt: Die Datei liegt außerhalb dessen, was dieser Auftrag zu schreiben erlaubt. Entscheidung beim Auftraggeber; Folge des Nichtstuns: Die zwei Fehlerklassen stehen nur in diesem Bericht.
