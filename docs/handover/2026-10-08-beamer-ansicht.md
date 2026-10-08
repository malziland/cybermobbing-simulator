# Übergabe: Beamer-Ansicht, Ton-Regler, Steuerleiste mit Zeitleiste

Datum: 2026-10-08 · Ablauf: `/aendern`, Modus FEATURE, Stufe STANDARD
Zweig: `feat/beamer-ansicht` · Vergleichsanker: `5364d4b` (`main`, v1.2.1)
Commits: `3de601b` (Beamer-Ansicht), `1ded32f` (Ton, einheitlicher Aufbau),
`ddccf72` (größere Pause, größeres Impressum), `c7a8106` (Steuerleiste,
Zeitleiste, Befunde der Abnahme), `152c990` (Platzprüfung vor dem Einblenden),
`f282e19` (Doku). Geprüfter Stand der Beweise unten: `f282e19`.
Nicht gepusht, nicht zusammengeführt, nicht ausgeliefert.

## 1. Scope und Akzeptanzkriterien

Scope: eine zweite, umschaltbare Darstellung des unveränderten Ablaufs für Beamer
und große Räume, vollständig für alle Szenen; dazu ein Ton-Regler und eine
durchgehende Steuerleiste mit Zeitleiste zum Vor- und Zurückspringen. Lokal
testbar bis zur Auslieferungsreife, ohne Auslieferung.

| Nr. | Kriterium | Beleg |
|---|---|---|
| 1 | Ohne Beamer-Ansicht bleibt der Ablauf, wie er war | bestehende Tests grün; Ablauftest „phone view is the default, stage hidden" |
| 2 | Ansicht am Startbildschirm per Tastatur wählbar, WCAG AA | „projector option reachable via Tab", „all four view buttons carry an accessible name", axe-Scan „start screen with projector switch on" |
| 3 | `?beamer=1` schaltet ein, nur genau dieser Wert | QUnit „stageFromUrl() accepts exactly beamer=1" |
| 4 | Umschalten im Lauf ohne Sprung (Taste B, Leiste) | „switching does not touch the running timers", „holding the B key toggles once, not on every repeat" |
| 5 | Jeder Szenentext erscheint groß | „all 33 messages appeared", „all 9 notices appeared", Sticker, Tipp-Anzeige, Schlusszeilen, Zähler |
| 6 | Höchstens zwei Nachrichten (drei Mitteilungen) gleichzeitig; nichts wird abgeschnitten | QUnit „stagePush() keeps at most STAGE_MAX_ITEMS", „stageFitList() pushes the older message out …"; Ablauftest „with 30% wider text no live message is cut off" |
| 7 | Gleiche Proportionen in jeder Fenstergröße und Zoomstufe | Ablauftest, 6 Größen |
| 8 | Handy steht vollständig sichtbar links neben Bild und Text | „stage is shown with the phone beside it" (geprüft am obersten Element in der Handymitte), „phone beside the stage is 49% …" |
| 9 | Bild und Zahlen sitzen in WhatsApp, Instagram und TikTok an derselben Stelle | „picture and counters sit at the same place …", 6 Größen |
| 10 | Ton aus und ein, Lautstärke regelbar, per Tastatur | QUnit-Modul „volume"; „M key switches the sound off", „two steps down on the slider …" |
| 11 | Eine Steuerleiste, in beiden Ansichten gleich, überdeckt nichts | „control bar is 3.6% of the stage width high, inside the stage, clear of the phone" (6 Größen), „the bar sits at exactly the same place in phone view and projector view" (3 Größen), „bar, phone and legal notice do not overlap …" (5 Größen) |
| 12 | Springen vor und zurück; danach derselbe Stand wie ohne Sprung | „jump to … s: phone shows the same entries as a normal run" (5 Ziele, vor und zurück gemischt), „all six scene marks sit exactly on the scene switches" |
| 13 | Nach einem Sprung zeigen Handy und rechte Seite dasselbe | „jump to … s: stage shows the same scene and the same newest message as the phone" (5 Ziele), „after a jump and resume the run continues, phone and stage stay together" |
| 14 | Springen per Maus und Tastatur; im Pausezustand bleibt es pausiert | „click inside the TikTok part jumps to its start", „dragging to 0:40 lands there", „keyboard: arrow +5 s, Page Up next scene, Home …", „stays paused at that second, no camera flash" |
| 15 | Am Handy (bis einschließlich 500 Pixel Breite) nur Anzeige | „393 px wide: timeline is a progress display, a tap does not jump, no view picker" |
| 16 | Startbildschirm ohne Überlappung | „start screen has no overlaps", 7 Größen |
| 17 | Zweisprachig, kein neuer `localStorage`-Wert, Teilen ohne `?beamer=1` | QUnit i18n-Tests, „shareSimulation() passes the link on without the projector switch"; `grep -c 'localStorage\.'` in `js/stage.js`, `js/audio.js`, `js/controls.js`: je 0, Positivkontrolle `js/i18n.js`: 1 |

## 2. Beweise

Format: Befehl · wogegen · Ergebnis wörtlich · Stand.

| Befehl | Wogegen | Ergebnis | Stand |
|---|---|---|---|
| `npm run lint` | `f282e19`, Arbeitsbaum ohne Abweichung | Rückgabewert 0 | 2026-10-08 21:21 CEST |
| `npm run test` | wie oben | Rückgabewert 0, „QUnit: 2209/2209 assertions passed, 0 failed" | 2026-10-08 21:21 CEST |
| `npm run test:e2e` | wie oben | Rückgabewert 0, „E2E: all checks passed", 130 Zeilen „ok", 0 Zeilen „FAIL" | 2026-10-08 21:22 CEST |
| QUnit mit `?seed=true`: ganze Suite und die Module „controls (timeline)", „stage (projector view)", „volume" je allein | wie oben | „2209/2209", „70/70", „127/127", „37/37", je „0 fehlgeschlagen" | 2026-10-08 21:23 CEST |
| Ausgangszustand: dieselben drei Befehle | `5364d4b` | Rückgabewerte 0; „QUnit: 1723/1723 assertions passed, 0 failed"; Ablauftest 15 Zeilen „ok" | 2026-10-08 19:20 CEST |
| Gegenprobe A: 13 Stellen im Produktcode zurückgebaut, Tests unverändert (falsche Marke, Springen überall erlaubt, Beamer-Ansicht beim Neustart nicht neu angehängt, Handy-Bildschirm nicht zurückgesetzt, keine Platzprüfung, kein Nachscrollen, Tastenwiederholung, Teilen mit Zusatz, Blitz beim Springen, Timer immer scharf, Fußbereich wieder fest, Handy hinter der Fläche, Leiste mit Mindesthöhe) | Inhalt von `c7a8106` | QUnit Rückgabewert 1, 3 Tests rot; Ablauftest Rückgabewert 1, 32 Zeilen „FAIL". **Zwei Rückbauten blieben unentdeckt:** Tastenwiederholung und Platzprüfung | 2026-10-08 |
| Gegenprobe B nach Schärfung der zwei Tests: dieselben zwei Rückbauten | Inhalt von `152c990` | Rückgabewert 1, 2 Zeilen „FAIL": „holding the B key toggles once, not on every repeat", „with 30% wider text no live message is cut off at the top (worst 60.3 px in 666 samples)"; aus dem Commit wiederhergestellt, 0 Abweichungen | 2026-10-08 |
| Frühere Gegenproben (Mitleser je Szene, Schrift-Einheit, Handy-Skalierung, Stummschaltung, Bildposition, Größe von Pause und Impressum) | Zwischenstände bis `ddccf72` | je Rückgabewert 1 mit den passenden Zeilen „FAIL", danach wiederhergestellt | 2026-10-08 |
| Sprungdauer, gemessen mit `performance.now()` um `simSeek()` | Zwischenstand vor `c7a8106`, Chromium 1920×1080 | 1,3 bis 8,7 ms für sieben Sprünge vor und zurück | 2026-10-08 |
| Volllauf mit Sprüngen in anderen Browser-Techniken (Wegwerfskript) | `f282e19`, WebKit 26.5 und Firefox 151.0, 1920×1080 | je vier Sprünge „ok" (gleiche Szene, gleiche neueste Nachricht, pausiert, Zielzeit), 5 bis 19 ms; Leiste 3,6 % der Flächenbreite, in der Fläche, unter dem Handy, Teile überlappen nicht; Volllauf ohne abgeschnittene Nachricht; 0 Seitenfehler | 2026-10-08 |
| Sichtprüfung: 15 Bilder (alle Szenen in der Beamer-Ansicht, Handy-Ansicht groß und am Laptop, zwei Handygrößen, 4:3-Fenster, Startbildschirm in drei Größen) | Inhalt von `c7a8106`, Chromium | angesehen; entspricht dem vom Betreiber gesehenen Schaubild; 0 Seitenfehler | 2026-10-08 |

Der Befund aus Gegenprobe A ist der Grund für `152c990`: Der geschärfte Test
zeigte, dass die ältere Nachricht bei viel breiterem Text bis zu 60 Pixel
abgeschnitten wurde, weil die Platzprüfung erst nach dem Einblenden lief.

Nicht belegt: der Pipeline-Lauf (es wurde nichts gepusht), die Lesbarkeit im
echten Saal und der Klang. Beim Ton sind nur die eingestellten Werte gemessen,
gehört hat ihn niemand. Windows wurde nicht geprüft; die Platzprüfung ist dafür
mit künstlich verbreitertem Text getestet, nicht mit einer Windows-Schrift.

## 3. Getroffene Vorgaben und Auffälligkeiten

Vom Betreiber entschieden (2026-10-08):

- Handy bleibt in der Beamer-Ansicht links sichtbar.
- Wahl der Ansicht über zwei Vorschaubilder statt eines Schalters.
- Steuerleiste nach gezeigtem Schaubild, mit Zeitleiste zum Springen.
- Pause und Impressum in beiden Ansichten größer.
- Tasten B und M bleiben; die Abweichung von WCAG 2.1.4 steht in ADR-0007.
- Die sieben Befunde der Abnahme werden mit dem Umbau der Leiste behoben.

Von mir gesetzt, noch nicht bestätigt:

- Schriftgröße der Nachrichten `--st-text: 3.5` (Großbuchstaben rund 4,4 % der
  Flächenhöhe); zwei Nachrichten, drei Mitteilungen gleichzeitig; Handy 49 % der
  Flächenbreite hoch.
- Leiste: 3,6 % der Flächenbreite hoch, in der Handy-Ansicht mindestens 40
  CSS-Pixel, am Handy 36. Im Schaubild war die Leiste am Handy 40 hoch und saß am
  kleinen Handy 2 Pixel unter dem Rahmen; angekündigt war „etwas flacher".
- Zeitleiste endet bei 2:00; der Schlusstext läuft danach weiter.
- Auch Sprünge nach vorn laufen über den Neustart.
- Ton: Einstellung wird nicht gespeichert; am Handy nur der Knopf.
- In sehr niedrigen Fenstern (unter 620 Pixel Höhe) entfällt die Hinweiszeile
  unter den Kacheln am Startbildschirm.
- „Eigenständige Version" ausgelegt als eigener Zweig, nicht als eigene Datei.

Abweichung vom gezeigten Stand, die zu einer Runde Nacharbeit führte: Die erste
Umsetzung ließ das Handy weg, obwohl die Vorschau es zeigte, ohne Rückfrage.
Korrigiert in `3de601b`.

Auffälligkeiten außerhalb des Auftrags, nicht verändert:

- Zweimal in etwa 60 Läufen hing das Laden der Seite im Testbrowser länger als
  30 bzw. 60 Sekunden und brach ab; die Wiederholung lief jeweils sofort. Ursache
  nicht ermittelt. Die Seite lädt zwei Skripte von `gstatic.com` ohne `async`
  mitten im Seitenaufbau; ein direkter Abruf danach antwortete in 0,2 bis 0,3
  Sekunden.
- `ffmpeg` auf dem Rechner des Betreibers startet nicht („Library not loaded:
  /opt/homebrew/opt/x265/lib/libx265.215.dylib"). `scripts/video-export` braucht
  es; die dortige CSS-Anpassung ist deshalb nicht durch einen Export geprüft.
- `js/scenes/p1-whatsapp.js` beschreibt im Kopfkommentar, dass Leon den Screenshot
  macht; der angezeigte Text nennt Sara. Die Zeitangaben in den Kopfkommentaren
  von `p4-homescreen.js`, `p4b-messages.js` und `p5-finale.js` (78–93, 93–112,
  112–130 s) weichen von den Timern ab (80–95, 95–114, 114–134 s).
- Der axe-Scan erfasst die Bedienelemente im Lauf nicht, obwohl ADR-0005 den
  Pause-Knopf unter den Flächen mit WCAG AA führt.

Auf dem Rechner des Betreibers verändert, außerhalb des Repositorys: Für den Lauf
in Firefox wurde die passende Testversion nachgeladen
(`npx playwright install firefox`, rund 99 MB im Zwischenspeicher der
Testwerkzeuge). In `~/.claude/skills/audit-familie/LEHREN.md` steht ein Abschnitt
mit den Lehren dieses Laufs.

## 4. Aufräumen nach Abnahme

Der Betreiber will die alte Bedien-Lösung erst entfernen lassen, wenn er mit der
neuen zufrieden ist. Sichtbar ist sie nicht mehr. Diese Reste stehen noch:

| Rest | Fundstelle | Warum er noch steht |
|---|---|---|
| Pausentext „Pausiert – tippe um fortzufahren" | `index.html` (`#pauseOverlay`, `.pause-text`); Texte `ui.paused` in `js/i18n.js` (de, en) | `togglePause()` in `js/audio.js` und `go()` in `js/main.js` setzen an ihm die Klasse `hidden`; `js/main.js` hängt einen Klick daran |
| Fortschrittsstrich | `index.html` (`.tbar`, `#tf`, `#tl`) | `tick()` in `js/timer.js` schreibt Breite und Text hinein |
| Regel zum Verstecken | `css/styles.css`: `.pause-overlay,.tbar{display:none}` | hält beide unsichtbar |
| Tests | `tests/test-audio.js`, `tests/test-timer.js`, `tests/test-main.js`, `tests/test-runner.html`, `scripts/run-e2e.js` | benutzen `pauseOverlay`, `tf`, `tl` als Fixture oder als Anzeige für „pausiert" |

Aufräumen heißt: `togglePause()`, `go()` und `tick()` von diesen Zugriffen
befreien, die Elemente, die zwei Texte und die Regel entfernen, die Tests auf den
Zustand der Leiste umstellen.

## 5. Offene Punkte

1. **Entscheidung: Abnahme der Steuerleiste und der Zeitleiste.** Empfehlung: im
   Vollbild in beiden Ansichten ausprobieren, zu Szenen springen, Ton anhören.
   Ohne Entscheidung bleiben der Zweig und die Reste aus Abschnitt 4 liegen.
2. **Entscheidung: Kacheln „Handy" und „Beamer" am Startbildschirm auf Handys.**
   Sie sind dort noch sichtbar, die Leiste zeigt den Umschalter auf Handys nicht.
   Empfehlung: am Handy weglassen. Ohne Entscheidung bleibt die Unstimmigkeit.
3. **Entscheidung: Zielraum für die Schriftgröße.** Mit dem jetzigen Wert reicht
   es nach der Regel Abstand ÷ 200 für 15 m bei 3 m breiter Leinwand. Beispiel
   knapp darunter: 14 m bei 3 m Leinwand, erfüllt. Beispiel knapp darüber: 15 m
   bei 2,5 m Leinwand, nicht erfüllt; dafür müsste der Wert auf etwa 4,2 steigen,
   dann passt bei langen Nachrichten nur noch eine. Empfehlung: Wert lassen, im
   größten Raum prüfen. Ohne Entscheidung bleibt 3.5.
4. **Entscheidung: Übernahme und Auslieferung.** Zusammenführen nach `main`,
   Versionsnummer, Push und Deploy brauchen eine Freigabe. Ohne Freigabe bleibt
   die Live-Seite auf v1.2.1.
5. **Jetzt nicht prüfbar: Lesbarkeit im Saal, Klang, Windows.** Geht erst mit
   echtem Beamer, echtem Abstand, Lautsprechern und einem Schulrechner.
6. **Jetzt nicht prüfbar: Pipeline.** Läuft erst nach einem Push.

## 6. Eingang für das nächste Audit

- Vergleichsanker: `5364d4b` → `f282e19`.
- Neu: `js/stage.js`, `js/controls.js`; Abschnitt „VOLUME" und die Funktionen
  `simFreezeTimers()`, `simAdvance()` in `js/audio.js`; Abschnitte „CONTROL BAR"
  und „PROJECTOR VIEW" sowie der Startbildschirm in `css/styles.css`; Leiste und
  Gerüst der Beamer-Ansicht in `index.html`; Verdrahtung in `js/main.js`;
  `tests/test-stage.js`, `tests/test-volume.js`, `tests/test-controls.js`;
  erweiterter Ablauftest.
- Entschieden und nicht neu zu diskutieren: `docs/adr/ADR-0007`,
  `docs/adr/ADR-0008`, darunter die Abweichung von WCAG 2.1.4.
- Geändertes Bestandsverhalten: `simTimeout()` plant einen Timer nicht mehr, wenn
  pausiert ist oder gesprungen wird; alle Geräusche laufen über `audioOut()`; die
  Musik-Lautstärke setzt `applyVolume()`; `flash()` bleibt beim Springen aus;
  `tick()` und `togglePause()` rufen `ctlUpdate()`.
- Neue Angriffsfläche zum Ansehen: der Link-Zusatz `?beamer=1` (wird nur als
  Ja/Nein ausgewertet); das Nachzeichnen von Handy-Inhalten per `innerHTML` in
  `js/stage.js` und das Zurücksetzen des Handy-Bildschirms per `innerHTML` in
  `simRestart()` (Quelle ist in beiden Fällen der eigene Seiteninhalt und die
  eigenen Übersetzungstexte).

## 7. Empfehlung

Vor einer Auslieferung ein `/audit` in der Tiefe KURZ: Es ist neuer Code auf
einer öffentlich erreichbaren Seite, der beim letzten Audit nicht geprüft wurde,
und er greift in die Zeitsteuerung ein.

## 8. Abnahme

**Unabhängig abgenommen ist bisher nur `3de601b`**, durch eine Instanz, die den
Code nicht geschrieben hat (lesend, mit eigenen Messungen an einer Kopie des
Commit-Inhalts). Ihre sieben Befunde sind in `c7a8106` behoben:

| Nr. | Befund an `3de601b` | Behebung | Prüfung, die es absichert |
|---|---|---|---|
| 1 | Startbildschirm überlappt in niedrigen Fenstern | Fußbereich steht im Fluss statt fest über dem Titelblock | „start screen has no overlaps", 7 Größen; in Gegenprobe A rot |
| 2 | Wechsel von Beamer auf Handy verliert die Chat-Position | `stageScrollPhone()` nach jedem Wechsel und bei Größenänderung | „after switching to the phone view the newest message is inside the chat"; in Gegenprobe A rot (176 px) |
| 3 | Vier Tests ohne Beweiskraft | Teilen-Test ruft `shareSimulation()` auf; Sichtbarkeit des Handys über das oberste Element in der Handymitte; Pixelhöhe gegen das Stylesheet; Taste B bei offenem Impressum und Adresszeile nach Taste B geprüft | je in Gegenprobe A rot, soweit zurückgebaut |
| 4 | Video-Export zeigt die neuen Bedienelemente | Ausblendliste und Titelblock im Export-CSS angepasst | nicht ausgeführt, `ffmpeg` startet nicht |
| 5 | Start-Kacheln unsichtbar anwählbar; Taste B bei gehaltener Taste; Umschalter fehlt bis 500 Pixel | Startbildschirm nach dem Start auch für die Tastatur ausgeblendet; Wiederholungen ignoriert; das Fehlen bis 500 Pixel ist dokumentiert (ADR-0007, ADR-0008, README) | „start screen is hidden for the keyboard …", „holding the B key toggles once …" |
| 6 | Doku passt an drei Stellen nicht | Verweis in `docs/VERIFICATION.md` zeigt auf diese Datei; Pixelhöhe steht in zwei statt drei Stellen und wird verglichen; „ohne Sprung" stimmt seit Befund 2 | „pixel height of the phone in the stylesheet matches STAGE_PHONE_PX" |
| 7 | Textspalte ohne Reserve bei breiterer Schrift | Platzprüfung vor dem Einblenden; die ältere Nachricht weicht | „with 30% wider text no live message is cut off"; in Gegenprobe B rot (60,3 px) |

Alles nach `3de601b` sowie diese Übergabe sind **selbst abgenommen**. Ihre
Vollständigkeit gilt als unbestätigt, bis eine andere Instanz sie prüft.

## 9. Rückmeldung an die Familie

- Fehlende Regel, mit Schaden belegt: Eine gezeigte Vorschau bindet. Vor der
  Umsetzung wird die Liste der sichtbaren Abweichungen zur letzten Vorschau als
  Entscheidungsfrage vorgelegt. Beleg: eine Runde Nacharbeit am 2026-10-08.
- Mehrdeutig: Die Grenzwert-Nachfrage bei gestalterischen Stellgrößen. Hier
  vorbelegt und als offene Entscheidung geführt statt angehalten.
- Fehlerklasse ohne Regel: Ein Testserver ohne Verbot der Zwischenspeicherung.
  Der Browser mischte alte und neue Dateien, „Simulation starten" tat nichts.
  Aufgefallen beim Betreiber, nicht in den Tests.
- Fehlerklasse ohne Regel: Eine Gegenprobe mit ungerader Wiederholung. Drei
  Tastenereignisse endeten im selben Zustand wie eines, der Test blieb bei
  entferntem Schutz grün.
- Fehlerklasse ohne Regel: Eigene Hilfsbefehle in zsh (leeres `PIPESTATUS`,
  Dateiliste in einer Variablen wird nicht getrennt, Skript bricht nach der
  ersten von drei Dateien ab). Seither: erst alle Anker prüfen, dann schreiben;
  Folgebefehle an den Rückgabewert koppeln; Sicherung über einen Commit.
