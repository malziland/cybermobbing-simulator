# ADR-0008: Eine Steuerleiste mit Zeitleiste zum Vor- und Zurückspringen

Status: Vorgeschlagen (in Erprobung auf Zweig `feat/beamer-ansicht`) · Datum: 2026-10-08

## Kontext

Mit der Beamer-Ansicht (ADR-0007) waren die Bedienelemente auf fünf Stellen
verteilt: Pausesymbol mit Pausentext unten in der Mitte, Impressum darunter,
Ton-Regler links, Umschalter rechts, ein dünner Fortschrittsstrich ganz unten.
Der Betreiber wünschte eine durchgängige, in beiden Ansichten gleiche Bedienung
und eine Zeitleiste, mit der sich im Workshop zu einer Szene springen lässt,
vor und zurück.

Die Simulation ist kein Film. Sie ist eine Kette zeitgesteuerter Schritte
(`simTimeout`), die das Handy nur nach vorn verändern: Nachricht anfügen, Zähler
erhöhen, App wechseln. Kein Schritt kennt den Zustand davor, und jede Szene hält
ihren Zwischenstand (Zähler, nächste Nachricht) in eigenen Variablen.

## Entscheidung

**Eine Leiste** am unteren Rand ersetzt die Einzelteile. Reihenfolge von links:
Pause, Zeit und Name der Szene, Zeitleiste mit Marken an den fünf Szenenwechseln,
Endzeit, Ton, Umschalter der Ansicht, Impressum.

- Aufbau, Symbole und Größe sind in Handy- und Beamer-Ansicht gleich. In der
  Beamer-Ansicht ist die Leiste an der Bildfläche ausgerichtet und rein
  proportional (3,6 % der Flächenbreite hoch); in der Handy-Ansicht hat sie
  dieselbe Formel mit einer Mindesthöhe von 40 CSS-Pixeln.
- Rot bedeutet in der Leiste nur „gewählt" oder „aktiv" (gewählte Ansicht,
  Pause, Ton aus). Impressum und Lautstärke-Regler sind dort weiß.
- Die Leiste zeigt 0:00 bis 2:00. Der Schlusstext läuft bei voller Leiste noch
  weiter, bis die Hilfsangebote erscheinen; so war es beim bisherigen
  Fortschrittsstrich auch.
- **Bis einschließlich 500 CSS-Pixel Fensterbreite** (dieselbe Grenze wie die
  übrigen Handy-Anpassungen) gilt die kurze Fassung: Pause, Fortschritt, Ton.
  Die Zeitleiste ist dort reine Anzeige, das Impressum steht als Zeile darunter,
  der Umschalter fehlt. Beispiel: 500 Pixel Breite ergibt die kurze, 501 die
  volle Fassung. Grund: Schüler am eigenen Handy sollen die 120 Sekunden nicht
  überspringen, und die Beamer-Ansicht ist hochkant unbrauchbar.

**Springen** heißt: Neustart und stummes Durchlaufen bis zur Zielzeit.

- `simRestart()` hält alle Timer an, setzt den Handy-Bildschirm und die
  Beamer-Ansicht auf den gesicherten Ausgangszustand zurück und startet die
  erste Szene.
- `simAdvance()` führt danach alle Schritte, die bis zur Zielzeit fällig wären,
  sofort und in ihrer Reihenfolge aus, auch solche, die unterwegs neu entstehen.
  Töne und der Kamerablitz bleiben dabei aus.
- Das gilt für beide Richtungen. Auch ein Sprung nach vorn läuft über den
  Neustart; so gibt es nur einen Weg, und das Ergebnis hängt nicht davon ab, wo
  man vorher war.
- Die Beamer-Ansicht braucht keine eigene Sprunglogik. Sie liest weiterhin nur
  mit, was im Handy geschieht; `stageReset()` hängt sie vor dem Neustart neu an.
- Ein Klick auf einen Abschnitt springt an dessen Anfang, Ziehen und die
  Pfeiltasten auf der fokussierten Leiste landen frei. Im Pausezustand bleibt die
  Simulation nach dem Sprung pausiert.

## Betrachtete Alternativen

- **Jedem Schritt einen Gegen-Schritt geben (echtes Rückwärts-Abwickeln):**
  verworfen. Es verdoppelt jede Szene, jetzt und bei jeder späteren Änderung, und
  ein vergessener Gegen-Schritt fällt erst beim Zurückspringen auf.
- **Laufend Abbilder speichern und zurückholen:** verworfen. Das Bild ließe sich
  so zurückholen, der innere Stand der Szenen aber nicht; die Simulation liefe
  nach dem Sprung an der alten Stelle weiter. Dafür müssten drei Szenen umgebaut
  werden, damit sie ihren Stand herausgeben.
- **Sprung nach vorn ohne Neustart:** verworfen. Die Zeitanzeige läuft über ein
  Intervall und kann gegenüber den Timern nachgehen; ein Sprung „auf die Marke"
  hätte dann knapp davor landen können.
- **Springen auch am Handy:** verworfen, siehe oben.

## Konsequenzen

- **Regel für Szenen:** Eine Szene muss sich von vorn stumm durchlaufen lassen.
  Zeitsteuerung nur über `simTimeout`; sichtbarer Zustand nur im Handy-Bildschirm
  (`#phone .scr`), denn nur der wird beim Neustart zurückgesetzt.
- Die Startzeiten der Szenen stehen als Marken in `CTL_SCENES` (`js/controls.js`)
  und wiederholen damit die Dauern in `js/scenes/`. Der Ablauftest prüft jede
  Marke gegen den tatsächlichen Szenenwechsel.
- Zähler mit Zufall (Likes, Aufrufe, App-Zähler) werden bei jedem Sprung neu
  gewürfelt. Sie zeigen nach einem Sprung an dieselbe Stelle leicht andere
  Zwischenwerte.
- Gemessen am 2026-10-08 in Chromium: Ein Sprung dauert 1 bis 9 Millisekunden.
- **Noch nicht aufgeräumt:** Der frühere Pausentext (`#pauseOverlay`) und der
  Fortschrittsstrich (`.tbar`) stehen unsichtbar weiter in der Seite, weil
  `togglePause()` und `tick()` noch hineinschreiben. Sie werden entfernt, sobald
  der Betreiber die Leiste abgenommen hat (Liste in `docs/handover/`).

## Bedingung für Neubewertung

Rückmeldung aus dem ersten Workshop: ob das Springen zu Szenen genutzt wird, ob
die Marken reichen und ob die Sperre am Handy sinnvoll ist.
