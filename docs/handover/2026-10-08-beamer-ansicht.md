# Übergabe: Beamer-Ansicht und Ton-Regler

Datum: 2026-10-08 · Ablauf: `/aendern`, Modus FEATURE, Stufe STANDARD
Zweig: `feat/beamer-ansicht` · Commits: `3de601b`, `1ded32f`, `ddccf72` · Vergleichsanker: `5364d4b` (`main`, v1.2.1)
Nicht gepusht, nicht zusammengeführt, nicht ausgeliefert.

## 1. Scope und Akzeptanzkriterien

Scope: eine zweite, umschaltbare Darstellung des unveränderten Ablaufs für Beamer
und große Räume, vollständig für alle Szenen, lokal testbar. Nach dem ersten
Test des Betreibers ergänzt: Handy links daneben, Umschalter mit Vorschaubildern,
einheitlicher Aufbau in allen Apps, größere Bedienelemente, Ton-Regler.

| Nr. | Kriterium | Beleg |
|---|---|---|
| 1 | Ohne Beamer-Ansicht verhält sich alles wie bisher | bestehende Tests unverändert grün; Ablauftest „phone view is the default, stage hidden", „phone view: pause button keeps its size …" |
| 2 | Einschalten am Startbildschirm per Tastatur, WCAG AA | Ablauftest „projector option reachable via Tab", „all four view buttons carry an accessible name", axe-Scan „start screen with projector switch on" |
| 3 | `?beamer=1` schaltet ein, nur genau dieser Wert | QUnit „stageFromUrl() accepts exactly beamer=1" |
| 4 | Umschalten im Lauf ohne Sprung (Taste B, Knopf) | Ablauftest „switching does not touch the running timers" |
| 5 | Jeder Szenentext erscheint groß | Ablauftest „all 33 messages appeared", „all 9 notices appeared", Sticker, Tipp-Anzeige, Schlusszeilen, Zähler |
| 6 | Höchstens zwei Nachrichten (drei Mitteilungen) gleichzeitig; Hinweise verdrängen keine Nachricht | QUnit „stagePush() keeps at most STAGE_MAX_ITEMS", „notices get their own row" |
| 7 | Gleiche Proportionen in jeder Fenstergröße und Zoomstufe | Ablauftest, 6 Größen |
| 8 | Handy steht vollständig sichtbar links neben Bild und Text | Ablauftest „stage is shown with the phone beside it", „phone beside the stage is 49% …" |
| 9 | Zweisprachig, kein neuer `localStorage`-Wert, Teilen ohne `?beamer=1` | QUnit „new i18n keys exist in both languages", „stageUrl()"; `grep -c 'localStorage\.' js/stage.js js/audio.js` ergibt 0 Zugriffe, Positivkontrolle in `js/i18n.js`: 1 |
| 10 | Bild und Zahlen sitzen in WhatsApp, Instagram und TikTok an derselben Stelle | Ablauftest „picture and counters sit at the same place …", 6 Größen |
| 11 | Bedienelemente wachsen in der Beamer-Ansicht mit und überdecken nichts | Ablauftest „pause symbol is 2.2% and legal notice 1.3% …", „controls are inside the picture and do not overlap", 6 Größen |
| 12 | Ton aus und ein, Lautstärke regelbar, per Tastatur bedienbar | QUnit-Modul „volume"; Ablauftest „M key switches the sound off", „sound button switches the sound back on", „two steps down on the slider …" |
| 13 | Pausesymbol und Impressum auch in der Handy-Ansicht größer, ohne etwas zu überdecken | Ablauftest in vier Größen, gemessen: 1280×720 25,6 px und 15,4 px; 1920×1080 38,4 px und 23,0 px; 393×852 und 375×667 je 22,0 px und 15,0 px; „paused - … do not overlap" |

## 2. Beweise

Format: Befehl · wogegen · Ergebnis wörtlich · Stand.

| Befehl | Wogegen | Ergebnis | Stand |
|---|---|---|---|
| `npm run lint` | Inhalt von `ddccf72` | Rückgabewert 0 | 2026-10-08 20:36 CEST |
| `npm run test` | wie oben | Rückgabewert 0, „QUnit: 2005/2005 assertions passed, 0 failed" | 2026-10-08 20:36 CEST |
| `npm run test:e2e` | wie oben | Rückgabewert 0, „E2E: all checks passed", 96 Zeilen „ok", 0 Zeilen „FAIL" | 2026-10-08 20:36 CEST |
| QUnit mit `?seed=true`: ganze Suite, Modul „stage (projector view)", Modul „volume" | `1ded32f` | „2005/2005 bestanden, 0 fehlgeschlagen", „125/125 …", „37/37 …" | 2026-10-08 |
| Ausgangszustand: dieselben drei Befehle | `5364d4b` | Rückgabewerte 0; „QUnit: 1723/1723 assertions passed, 0 failed"; Ablauftest 15 Zeilen „ok" | 2026-10-08 19:20 CEST |
| Gegenprobe 1: Mitleser für TikTok entfernt und Schrift fest auf 60 px, Tests unverändert, `node scripts/run-e2e.js` | Zwischenstand vor `3de601b` | Rückgabewert 1; „FAIL all 33 messages appeared on the stage - missing: tk.lukas, tk.sara, …"; „FAIL 1920x1080 @1: message size is 3.5% of the stage width (measured 3.125%)"; danach wiederhergestellt (Prüfsumme gleich), Rückgabewert 0 | 2026-10-08 |
| Gegenprobe 2: Handy-Skalierung und Mitleser für Mitteilungen entfernt | Inhalt von `3de601b` | Rückgabewert 1, 9 Zeilen „FAIL", darunter „FAIL stage is shown with the phone beside it" und „… missing: hs.n1, …, hs.n8"; wiederhergestellt (Prüfsumme gleich) | 2026-10-08 |
| Gegenprobe 3: Stummschaltung der Musik entfernt, WhatsApp-Bild wieder mittig, Impressum nicht vergrößert | Inhalt von `1ded32f` | Rückgabewert 1, 12 Zeilen „FAIL", darunter „FAIL M key switches the sound off", „FAIL 1024x768 @1: picture and counters sit at the same place …", „FAIL 1024x768 @1: pause symbol is 2.2% and legal notice 1.3% …"; wiederhergestellt (Prüfsumme gleich) | 2026-10-08 |
| Gegenprobe 4: Pausesymbol wieder 14 px, Pausentext wieder hinter dem Symbol | Inhalt von `ddccf72` | Rückgabewert 1, 8 Zeilen „FAIL", darunter „FAIL 1280x720: pause symbol 14.0px, legal notice 15.4px (at least 22px / 15px)" und „FAIL 1280x720: paused - … do not overlap"; wiederhergestellt (Prüfsumme gleich) | 2026-10-08 |
| Sichtprüfung mit Wegwerfskript (nicht im Repository): Volllauf mit Messung alle 40 ms | `1ded32f`, Chromium, 1920×1080 | Großbuchstabe 4,38 % der Flächenhöhe; gleichzeitig groß höchstens 2/2/2/3/2 je Szene; kein Element abgeschnitten oder außerhalb; kein Seitenfehler | 2026-10-08 |
| Dieselbe Sichtprüfung | `3de601b`, Chromium, zusätzlich 1024×768 und 960×540 bei Faktor 2 | wie oben, in allen drei Größen | 2026-10-08 |
| Volllauf in anderen Browser-Techniken | `1ded32f`, WebKit 26.5 und Firefox 151.0, 1920×1080 | je: Schrift 3,5 % der Flächenbreite, Handy 49 %, Handy links vom Text und ganz im Bild, nichts abgeschnitten, 0 Seitenfehler | 2026-10-08 |

Nicht belegt: der Pipeline-Lauf (es wurde nichts gepusht), die Lesbarkeit im
echten Saal und der Klang. Beim Ton sind nur die eingestellten Werte gemessen
(Lautstärke und Stummschaltung des Musik-Elements, Wert des Reglers für die
Geräusche), gehört hat ihn niemand.

## 3. Getroffene Vorgaben und Auffälligkeiten

Vorgaben, die ich gesetzt habe und die der Betreiber noch nicht bestätigt hat:

- Schriftgröße der Nachrichten: `--st-text: 3.5`, das sind Großbuchstaben von rund
  4,4 % der Flächenhöhe.
- Gleichzeitig groß: zwei Nachrichten, drei Mitteilungen.
- Handy neben der Fläche: 49 % der Flächenbreite hoch.
- Zahlen in der Kopfzeile zeigen nur Symbol und Zahl; der Wortlaut („… Gefällt
  mir-Angaben") steht weiterhin im Handy.
- Größe von Pausesymbol und Impressum in der Handy-Ansicht: 2 % und 1,2 % der
  Einheit `--u`, mindestens 22 und 15 CSS-Pixel. Das ist rund 10 % kleiner als
  in der Beamer-Ansicht, weil unter dem Handy weniger Platz ist.
- Ton: Einstellung wird nicht gespeichert; auf schmalen Bildschirmen nur der
  Knopf, kein Schieber.
- „Eigenständige Version" ausgelegt als eigener Zweig, nicht als eigene Datei.

Abweichung vom gezeigten Stand, die zu einer Runde Nacharbeit führte: Die erste
Umsetzung ließ das Handy weg, obwohl die Vorschau es zeigte, ohne Rückfrage.
Korrigiert in `3de601b`.

Auffälligkeiten außerhalb des Auftrags, nicht verändert:

- Der axe-Scan erfasst den Pause-Knopf und die Bedienelemente im Lauf nicht,
  obwohl ADR-0005 sie unter den Flächen mit WCAG AA führt. Der Pause-Knopf hatte
  bis `1ded32f` Weiß mit 35 % Deckkraft (gerechnet etwa 3,0 : 1), seit `ddccf72`
  62 % (gerechnet etwa 7,6 : 1). Gerechnet, nicht mit Werkzeug gemessen.
- `ffmpeg` auf dem Rechner des Betreibers startet nicht („Library not loaded:
  /opt/homebrew/opt/x265/lib/libx265.215.dylib"). `scripts/video-export` braucht es.
- `js/scenes/p1-whatsapp.js` beschreibt im Kopfkommentar, dass Leon den Screenshot
  macht; der angezeigte Text nennt Sara.

Auf dem Rechner des Betreibers verändert, außerhalb des Repositorys: Für den Lauf
in Firefox wurde die passende Testversion nachgeladen
(`npx playwright install firefox`, rund 99 MB im Zwischenspeicher der
Testwerkzeuge).

## 4. Offene Punkte

1. **Entscheidung: sieben Befunde der unabhängigen Abnahme beheben?** Siehe
   Abschnitt 7. Empfehlung: ja, alle. Sichtbar ändern sich dabei der
   Startbildschirm in niedrigen Fenstern und die Breite der Textspalte. Ohne
   Entscheidung bleiben die Befunde bestehen; Befund 1 ist bei 1280 × 720 am
   Startbildschirm zu sehen.
2. **Entscheidung: einzelne Buchstaben als Tastenkürzel (B, M).** WCAG 2.1.4
   verlangt, dass solche Kürzel abschaltbar sind. Empfehlung: behalten und die
   Ausnahme in ADR-0007 festhalten, weil die Seite keine Texteingabe hat und
   moderiert bedient wird. Alternative: ein Schalter „Tastenkürzel aus". Ohne
   Entscheidung bleibt eine undokumentierte Abweichung vom eigenen Ziel.
3. **Entscheidung: Gestaltung abnehmen.** Umschalter mit zwei Vorschaubildern,
   Aufbau Handy, Bild, Text, Ton-Regler, größere Pause. Empfehlung: im Vollbild
   einmal ganz durchlaufen lassen und den Ton anhören. Ohne Entscheidung bleibt
   der Zweig liegen.
4. **Entscheidung: durchgehende Steuerleiste mit Zeitleiste zum Vor- und
   Zurückspringen.** Vom Betreiber gewünscht, noch nicht beauftragt. Empfehlung:
   zuerst ein Schaubild in beiden Ansichten zur Abnahme, dann bauen; Springen
   über Neustart und stummes Durchlaufen bis zur Zielzeit. Ohne Entscheidung
   bleiben die Bedienelemente einzeln verteilt.
5. **Entscheidung: Zielraum für die Schriftgröße.** Mit dem jetzigen Wert reicht
   es nach der Regel Abstand ÷ 200 für 15 m bei 3 m breiter Leinwand. Beispiel
   knapp darunter: 14 m bei 3 m Leinwand, erfüllt. Beispiel knapp darüber: 15 m
   bei 2,5 m Leinwand, nicht erfüllt; dafür müsste der Wert auf etwa 4,2 steigen,
   dann passt bei langen Nachrichten nur noch eine. Empfehlung: Wert lassen, im
   größten Raum prüfen. Ohne Entscheidung bleibt 3.5.
6. **Entscheidung: Übernahme und Auslieferung.** Zusammenführen nach `main`, Push
   und Deploy brauchen eine Freigabe. Ohne Freigabe bleibt die Live-Seite auf
   v1.2.1.
7. **Jetzt nicht prüfbar: Lesbarkeit im Saal und Klang.** Geht erst mit echtem
   Beamer, echtem Abstand und Lautsprechern, beim nächsten Workshop.
8. **Jetzt nicht prüfbar: Pipeline.** Läuft erst nach einem Push.

## 5. Eingang für das nächste Audit

- Vergleichsanker: `5364d4b` → `1ded32f`.
- Neu: `js/stage.js`; Abschnitt „VOLUME" in `js/audio.js`; Abschnitt „PROJECTOR
  VIEW", Umschalter und Ton-Regler in `css/styles.css`; Gerüst in `index.html`;
  Verdrahtung in `js/main.js`; `tests/test-stage.js`, `tests/test-volume.js`;
  erweiterter Ablauftest.
- Entschieden und nicht neu zu diskutieren: `docs/adr/ADR-0007`.
- Neue Angriffsfläche zum Ansehen: der Link-Zusatz `?beamer=1` (wird nur als
  Ja/Nein ausgewertet) und das Nachzeichnen von Handy-Inhalten per `innerHTML`
  (Quelle sind ausschließlich die eigenen Übersetzungstexte).
- Geändertes Bestandsverhalten: Alle Geräusche laufen jetzt über einen
  gemeinsamen Lautstärke-Knoten (`audioOut()`), die Musik-Lautstärke wird über
  `applyVolume()` gesetzt statt fest auf 0,4.

## 6. Empfehlung

Vor einer Auslieferung ein `/audit` in der Tiefe KURZ: Es ist neuer Code auf
einer öffentlich erreichbaren Seite, der beim letzten Audit nicht geprüft wurde.

## 7. Abnahme

**Unabhängig abgenommen wurde nur `3de601b`**, durch eine Instanz, die den Code
nicht geschrieben hat (lesend, mit eigenen Messungen an einer Kopie des
Commit-Inhalts; Kontrolllauf dort: QUnit 1917/1917, Ablauftest 59 Zeilen „ok").
`1ded32f` und `ddccf72` sowie diese Übergabe sind **selbst abgenommen**; ihre
Vollständigkeit gilt als unbestätigt, bis ein späterer Lauf sie prüft.

Ohne Befund: werfende Handler und Reihenfolge (alle Knotenarten der sechs Szenen
gegen die Handler gelesen, zwölf Läufe in Echtzeit ohne Seitenfehler), Leitplanken
aus `AGENTS.md`, zugängliche Namen.

Befunde der Abnahme an `3de601b`, alle noch offen:

| Nr. | Befund | Nachweis des Prüfers |
|---|---|---|
| 1 | Startbildschirm: Die Kacheln und ihr Hinweis überlappen in niedrigen Fenstern den Fußbereich (1280×720: 9 px; 1366×657; 375×553). Bei 1280×600 und 375×553 trifft ein Klick auf die Kachelmitte den Teilen-Knopf | reproduziert |
| 2 | Umschalten von Beamer auf Handy bei Fensterhöhe bis 768: Die neuesten Nachrichten liegen 172 bis 270 px unter der Sichtkante, in der Pause dauerhaft | reproduziert |
| 3 | Vier Tests ohne Beweiskraft: Teilen-Test ruft `shareSimulation()` nicht auf; die Sichtbarkeitsprüfung des Handys kann nicht scheitern (Rückbau von `z-index` blieb grün); der Test zur Pixelhöhe vergleicht eine Konstante mit einer Zahl; Taste B bei offenem Impressum und die Adresszeile nach Taste B sind ungeprüft | reproduziert durch Rückbau |
| 4 | Video-Export blendet die neuen Bedienelemente nicht aus (`scripts/video-export/export-video.js`) | reproduziert mit dem CSS des Skripts, Export nicht ausgeführt |
| 5 | Tastatur: Die Start-Kacheln bleiben nach dem Start unsichtbar anwählbar und wirksam; die Einzeltaste B widerspricht WCAG 2.1.4 und schaltet bei gehaltener Taste je Wiederholung um; bis 500 px Breite fehlt der Umschalter im Lauf | reproduziert |
| 6 | Doku: Verweis in `docs/VERIFICATION.md` auf diese Datei, die in `3de601b` fehlte; die Pixelhöhe des Handys steht an drei Stellen und der Test sichert sie nicht; „ohne Sprung" im CHANGELOG gegen Befund 2 | gelesen |
| 7 | Textspalten ohne Reserve: Mit einer rund 10 % breiteren Ersatzschrift wird der Absender des älteren TikTok-Kommentars oben abgeschnitten. Windows nicht geprüft | plausibel |

Durch spätere Commits verändert, vom Prüfer nicht gesehen: Befund 5 betrifft
seit `1ded32f` auch die Taste M und den Ton-Regler; der Pausentext aus Befund 5
steht seit `ddccf72` rechts neben dem Pausesymbol.

## 8. Rückmeldung an die Familie

- Fehlende Regel, mit Schaden belegt: Eine gezeigte Vorschau bindet. Vor der
  Umsetzung wird die Liste der sichtbaren Abweichungen zur letzten Vorschau als
  Entscheidungsfrage vorgelegt. Beleg: eine Runde Nacharbeit am 2026-10-08.
- Mehrdeutig: Die Grenzwert-Nachfrage bei gestalterischen Stellgrößen. Hier
  vorbelegt und als offene Entscheidung geführt statt angehalten.
- Fehlerklasse ohne Regel: Rückgabewerte hinter einer Pipe. In zsh blieb
  `${PIPESTATUS[0]}` leer, die Zeile sah aus wie ein Ergebnis.
- Fehlerklasse ohne Regel: Ein Bearbeitungsskript brach an einer Zusicherung ab,
  nachdem es eine von drei Dateien schon geschrieben hatte; die nachfolgenden
  Befehle liefen trotzdem. Aufgefallen nur, weil ein Test rot wurde.
