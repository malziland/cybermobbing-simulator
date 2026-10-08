# ADR-0008: Eine Steuerleiste mit Zeitleiste zum Vor- und Zurückspringen

Status: Angenommen · Datum: 2026-10-08 · ausgeliefert mit v2.0.0

## Kontext

Mit der Beamer-Ansicht (ADR-0007) waren die Bedienelemente auf fünf Stellen
verteilt: Pausesymbol mit Pausentext unten in der Mitte, Impressum darunter,
Ton-Regler links, Umschalter rechts, ein dünner Fortschrittsstrich ganz unten.
Der Betreiber wünschte eine durchgängige, in beiden Ansichten gleiche Bedienung
und eine Zeitleiste, mit der sich im Workshop jede Stelle wieder aufrufen lässt,
auch von der letzten Seite aus.

Die Simulation ist kein Film. Sie ist eine Kette zeitgesteuerter Schritte
(`simTimeout`), die das Handy nur nach vorn verändern: Nachricht anfügen, Zähler
erhöhen, App wechseln. Kein Schritt kennt den Zustand davor, und jede Szene hält
ihren Zwischenstand (Zähler, nächste Nachricht) in eigenen Variablen.

## Entscheidung

**Eine Leiste** am unteren Rand ersetzt die Einzelteile. Reihenfolge von links:
Pause, Name der Szene, Zeitleiste mit Marken an den Szenenwechseln, Ton,
Umschalter der Ansicht, Impressum.

- Aufbau, Symbole und Größe sind in Handy- und Beamer-Ansicht gleich. In der
  Beamer-Ansicht ist die Leiste an der Bildfläche ausgerichtet und rein
  proportional (3,6 % der Flächenbreite hoch); in der Handy-Ansicht hat sie
  dieselbe Formel mit einer Mindesthöhe von 40 CSS-Pixeln, in der kurzen
  Fassung bis 500 Pixel Fensterbreite fest 36.
- Rot bedeutet in der Leiste nur „gewählt" oder „aktiv" (gewählte Ansicht,
  Pause, Ton aus). Impressum und Lautstärke-Regler sind dort weiß.
- **Die Leiste zeigt keine Zeiten.** Der Titel verspricht 120 Sekunden, der
  Ablauf dauert mit Schlusstext länger; eine mitlaufende Sekundenanzeige macht
  daraus einen Widerspruch. Zu sehen sind der Name der Szene und der Stand auf
  der Zeitleiste.
- **Die Zeitleiste reicht bis zur letzten Seite.** Ihr letzter Abschnitt ist
  die Seite mit den Hilfsangeboten. Die Leiste bleibt dort stehen, sodass man
  von der letzten Seite an jede Stelle zurückkommt, ohne neu zu starten. Der
  Pause-Knopf ist dort abgeschaltet, behält aber seinen Platz, damit sich die
  Zeitleiste nicht unter dem Zeiger verschiebt.

**Springen** heißt: Neustart und stummes Durchlaufen bis zur Zielzeit.

- `simRestart()` hält alle Timer an, nimmt die letzte Seite zurück
  (`p6Reset()`), setzt den Handy-Bildschirm und die Beamer-Ansicht auf den
  gesicherten Ausgangszustand und startet die erste Szene.
- `simAdvance()` führt danach alle Schritte, die bis zur Zielzeit fällig wären,
  sofort und in ihrer Reihenfolge aus, auch solche, die unterwegs neu entstehen.
  Töne und der Kamerablitz bleiben dabei aus.
- Das gilt für beide Richtungen. Auch ein Sprung nach vorn läuft über den
  Neustart; so gibt es nur einen Weg, und das Ergebnis hängt nicht davon ab, wo
  man vorher war.
- Nach jedem Sprung werden alle laufenden Einblendungen beendet (`ctlSettle()`).
  Einträge im Handy sind anfangs unsichtbar und werden erst durch ihre
  Einblendung sichtbar; ohne diesen Schritt stünde das Handy nach einem Sprung
  kurz leer.
- Die Beamer-Ansicht braucht keine eigene Sprunglogik. Sie liest weiterhin nur
  mit, was im Handy geschieht; `stageReset()` hängt sie vor dem Neustart neu an.
- Ein Sprung in den letzten Abschnitt lässt die letzte Seite bis zu ihrem Ende
  durchlaufen. Sie ist damit auch im Pausezustand und beim Ziehen vollständig.

**Bedienung der Zeitleiste:**

- Ein Klick landet dort, wo er gemacht wurde. Liegt er höchstens 1,5 Sekunden
  neben einer Marke (einschließlich), landet er auf der Marke, damit sich eine
  Szene leicht von ihrem ersten Moment an starten lässt. Beispiel: 57,5 s
  ergibt 56 s, 57,6 s bleibt 57,6 s.
- Beim Ziehen läuft das Bild sofort mit, in Handy und Beamer-Ansicht. Solange
  der Knopf gehalten wird, steht die Simulation und die Musik wartet; nach dem
  Loslassen läuft sie von dort weiter. Im Pausezustand bleibt sie pausiert.
- Tasten auf der fokussierten Leiste: Pfeile ±5 Sekunden, Bild auf und Bild ab
  zur nächsten und vorigen Szene, Pos1 zum Anfang, Ende zur letzten Seite.
- Nur die Haupttaste der Maus springt.

**Schmale Fenster** (Breite in CSS-Pixeln, Grenzen jeweils einschließlich):

| Fensterbreite | Was die Leiste zeigt |
|---|---|
| ab 901 | alles |
| 701 bis 900 | in der Handy-Ansicht ohne Lautstärke-Regler (der Ton-Knopf bleibt); die Zeitleiste braucht den Platz |
| 501 bis 700 | zusätzlich ohne Umschalter der Ansicht: Dort gibt es die Beamer-Ansicht nicht (ADR-0007) |
| bis 500 | kurze Fassung: Pause, Fortschritt, Ton. Die Zeitleiste ist reine Anzeige, das Impressum steht als Zeile darunter |

Beispiele: 900 Pixel ohne, 901 mit Regler; 700 ohne, 701 mit Umschalter; 500
ohne, 501 mit Springen. Grund für die Sperre bis 500 Pixel: Wer die Simulation
am eigenen Handy ansieht, soll den Ablauf nicht überspringen, und auf der
flachen Leiste eines Handys ist ein Sprung mit dem Finger leicht versehentlich
ausgelöst.

**Impressum:** Wird es während des Laufs geöffnet, pausiert die Simulation; beim
Schließen läuft sie weiter, außer sie war schon vorher pausiert.

## Betrachtete Alternativen

- **Jedem Schritt einen Gegen-Schritt geben (echtes Rückwärts-Abwickeln):**
  verworfen. Es verdoppelt jede Szene, jetzt und bei jeder späteren Änderung, und
  ein vergessener Gegen-Schritt fällt erst beim Zurückspringen auf.
- **Laufend Abbilder speichern und zurückholen:** verworfen. Das Bild ließe sich
  so zurückholen, der innere Stand der Szenen aber nicht; die Simulation liefe
  nach dem Sprung an der alten Stelle weiter.
- **Sprung nach vorn ohne Neustart:** verworfen. Die Uhr läuft über ein
  Intervall und kann gegenüber den Timern nachgehen; ein Sprung „auf die Marke"
  hätte dann knapp davor landen können.
- **Klick rastet immer auf den Anfang der Szene:** zuerst so gebaut, vom
  Betreiber verworfen. Ein Klick vor dem Knopf sprang damit weiter zurück als
  gemeint.
- **Sprung erst beim Loslassen:** zuerst so gebaut, vom Betreiber verworfen.
  Beim Ziehen war nicht zu sehen, wo man landet.
- **Zeitanzeige und Endzeit in der Leiste:** zuerst so gebaut, vom Betreiber
  verworfen, siehe oben.
- **Leiste endet mit dem Schlusstext, die letzte Seite steht für sich:** zuerst
  so gebaut, vom Betreiber verworfen. Zum Wiederholen einer Stelle hätte man
  neu starten müssen.

## Konsequenzen

- **Regel für Szenen:** Eine Szene muss sich von vorn stumm durchlaufen lassen.
  Zeitsteuerung nur über `simTimeout`; sichtbarer Zustand nur im Handy-Bildschirm
  (`#phone .scr`), denn nur der wird beim Neustart zurückgesetzt.
- **Eine Ausnahme davon:** Die letzte Seite (`p6()` in `js/scenes/p5-finale.js`)
  verändert Elemente außerhalb des Handys. Ihr Gegenstück `p6Reset()` steht
  direkt daneben und muss alles zurücknehmen, was `p6()` dort verändert.
- Die Startzeiten der Abschnitte stehen als Marken in `CTL_SCENES`
  (`js/controls.js`) und wiederholen damit die Dauern in `js/scenes/`. Der
  Ablauftest prüft jede Marke gegen den tatsächlichen Wechsel, die letzte Seite
  eingeschlossen. An anderer Stelle werden diese Zeiten nicht mehr genannt.
- Zähler mit Zufall (Likes, Aufrufe, App-Zähler) werden bei jedem Sprung neu
  gewürfelt. Sie zeigen nach einem Sprung an dieselbe Stelle leicht andere
  Zwischenwerte.
- Beim Ziehen wird je Bild einmal neu gestartet und durchlaufen. Messwerte dazu
  stehen in der Übergabe (`docs/handover/`).
- Die Musik springt mit. Dafür muss der Server die Musikdatei abschnittsweise
  liefern; Firebase Hosting tut das, der Testserver (`scripts/static-server.js`)
  ebenfalls.

## Bedingung für Neubewertung

Rückmeldung aus dem ersten Workshop: ob das Springen genutzt wird, ob die Marken
reichen und ob die Sperre des Springens auf Handys sinnvoll ist. Die Sperre
hängt an der Fensterbreite; ein quer gehaltenes Handy ist breiter als 500 Pixel
und darf springen.
