# ADR-0007: Beamer-Ansicht als zweite, umschaltbare Darstellung

Status: Angenommen · Datum: 2026-10-08 · ausgeliefert mit v2.0.0

## Kontext

Im Workshop läuft die Simulation über einen Beamer. Der Handy-Rahmen hat feste
Maße (393 × 852 CSS-Pixel) und wächst nicht mit dem Bild. Messung vom 2026-10-08
gegen Commit `5364d4b` (Chromium, 1920 × 1080): Das Handy belegt 20,5 % der
Bildbreite, ein Großbuchstabe der Chat-Schrift ist 0,95 % der Bildhöhe hoch.

Einsatzbedingungen in den Workshops: Kinder sitzen bis zu 10–15 m entfernt, der
Beamer hat teils eine schlechte Auflösung. Nach der Planungsregel der
Veranstaltungstechnik (Zeichenhöhe = Abstand ÷ 200) braucht es dafür rund
3,5–5 % der Bildhöhe, also das Vier- bis Fünffache. Ausgeschlossen waren von
Anfang an: die Schrift im Handy einfach zu vergrößern und Scrollen von Hand.

## Entscheidung

Es gibt eine zweite Darstellung desselben Ablaufs, die **Beamer-Ansicht**:

- **Das Handy bleibt die einzige Quelle.** Die Szenen (`js/scenes/`) und ihre
  Zeitsteuerung bleiben unverändert. `js/stage.js` liest mit, was im Handy
  erscheint, und zeigt es in der Beamer-Ansicht groß an. Dadurch lässt sich
  jederzeit ohne Sprung umschalten: Beide Ansichten zeigen denselben Lauf.
- **Aufbau in drei Teilen:** links das Handy selbst, vollständig sichtbar; in der
  Mitte das Bild der Szene (Foto oder Video); rechts der Text. Das Handy ist
  dasselbe Element wie in der Handy-Ansicht, nur an den Rand gerückt und als
  Ganzes skaliert.
- **Derselbe Aufbau in jeder App:** Das Bild sitzt immer an derselben Stelle
  direkt unter der Kopfzeile; nur seine Form folgt der App (quer, quadratisch,
  hochkant). Zahlen stehen immer am rechten Ende der Kopfzeile als Symbol mit
  Zahl, Zusatztexte immer klein unter dem Bild. In der Mitteilungs-Szene stehen
  Uhr und App-Symbole mit ihren Zählern als Zeile über den Mitteilungen; die
  Szene „Nachrichten" und der Schlusstext haben kein eigenes Bild und nutzen die
  ganze Breite neben dem Handy.
- **Höchstens zwei Nachrichten gleichzeitig groß** (einschließlich zwei), bei den
  Mitteilungen höchstens drei; die nächste verdrängt die älteste. Hinweise wie
  „… hat einen Screenshot gemacht" haben eine eigene Zeile und verdrängen keine
  Nachricht. Passen zwei Nachrichten nicht in die Spalte, etwa mit einer
  breiteren Ersatzschrift, weicht die ältere, bevor die neue eingeblendet wird;
  abgeschnitten wird nichts.
- **Maße nur in Anteilen der Bildfläche.** Die Ansicht ist eine 16:9-Fläche, die
  in jedes Fenster eingepasst wird; alle Größen hängen an einer Einheit
  (`--u`, 1 % der Flächenbreite). Auflösung und Browser-Zoom ändern die
  Proportionen nicht. Die Schriftgröße der Nachrichten ist eine einzige
  Stellgröße (`--st-text` in `css/styles.css`).
- **Wahl der Ansicht:** am Startbildschirm zwei Kacheln mit Vorschaubildern (ein
  Mini-Handy, eine Mini-Leinwand), während des Laufs dieselben zwei Symbole in
  der Steuerleiste (ADR-0008), dazu die Taste B und der Link-Zusatz `?beamer=1`.
  Der gewählte Zustand steht nur in der Adresszeile, es kommt kein weiterer
  `localStorage`-Wert hinzu. Der Teilen-Knopf gibt den Link ohne diesen Zusatz
  weiter.
- **Erst ab 701 CSS-Pixel Fensterbreite** (einschließlich; 700 Pixel hat sie
  nicht) **und nie am Handy** gibt es die Beamer-Ansicht und ihre Umschalter.
  Sonst ist die Seite die Handy-Fassung, auch wenn die Beamer-Ansicht gewählt
  oder im Link angegeben ist: Kacheln und Umschalter fehlen, die Taste B tut
  nichts. Die Wahl bleibt erhalten und gilt wieder, sobald das Fenster breiter
  wird. Die Grenze liegt bewusst niedrig, damit alte Beamer (800 × 600, oder
  1024 × 768 bei 125 % Skalierung) die Beamer-Ansicht behalten. Ein quer
  gehaltenes Handy ist breiter als 700 Pixel und hatte die Beamer-Ansicht bis
  v2.0.0, mit Knöpfen von 17 bis 18 Pixel. Seit dem 2026-10-09 gibt es sie am
  Handy nicht mehr; was als Handy gilt, steht in ADR-0008. Beides entscheidet
  `stageFits()` in `js/stage.js`; der Ablauftest prüft beide Seiten der Grenzen
  und Tablets in beiden Lagen.
- **Höhen folgen der sichtbaren Fensterhöhe.** Auf Tablets und Handys ist
  `100vh` die Höhe mit eingefahrenen Browserleisten, also mehr, als zu sehen
  ist. Die Beamer-Ansicht rechnet deshalb mit `--wh` und `--u` (beide aus
  `dvh`, mit `vh` als Rückfall für ältere Browser), das Handy mit Prozent des
  Fensters. Bis v2.0.0 saßen Leiste und Handy am Tablet versetzt, und am Handy
  lag die Leiste über dem unteren Rand des nachgebauten Handys.
- **Nicht eigens groß gezeigt** wird reine Dekoration der App-Oberflächen:
  Statusleiste, Eingabe- und Navigationsleisten, Uhrzeiten und Lesehäkchen an
  Nachrichten, die Datumsmarke im Chat. Sie sind im Handy links zu sehen.
- **Accessibility:** Die Wahl der Ansicht gehört zum Rahmen-UI (WCAG 2.2 AA,
  ADR-0005). Die Beamer-Ansicht selbst ist wie die Szenen eine filmartige,
  nicht interaktive Darstellung und fällt unter die dort dokumentierte Ausnahme.

## Bewusste Abweichung: Tastenkürzel aus einem Buchstaben

Die Tasten B (Ansicht) und M (Ton) sind Kürzel aus einem einzelnen Buchstaben.
WCAG 2.1.4 (Stufe A) verlangt, dass solche Kürzel abschaltbar oder umlegbar
sind; das ist hier nicht der Fall.

- Entscheidung vom 2026-10-08: Die Kürzel bleiben.
- Begründung: Die Seite hat kein Eingabefeld, in dem die Tasten versehentlich
  ausgelöst würden, und wird im Workshop von einer Person moderiert. Beide
  Funktionen sind zusätzlich über sichtbare, per Tastatur erreichbare Knöpfe
  bedienbar. Eine gehaltene Taste löst nur einmal aus.
- Betrachtete Alternative: ein Schalter „Tastenkürzel aus".
- Bedingung für Neubewertung: Einsatz außerhalb moderierter Workshops oder eine
  Rückmeldung von Nutzern mit Sprachsteuerung.

## Betrachtete Alternativen

- **Tablet-Querformat originalgetreu nachbauen:** verworfen. Ein Tablet zeigt
  mehr Inhalt bei fast gleicher Schriftgröße; der Gewinn läge rechnerisch bei
  etwa dem 1,5-Fachen.
- **Handy auf volle Bildhöhe skalieren:** verworfen, gemessen 1,17 % statt 0,95 %.
- **Browser-Zoom:** verworfen, bei 200 % werden Mitteilungs-Szene und Schlusstext
  abgeschnitten.
- **Handy am Rand und nur Text daneben:** verworfen, weil das Foto dabei nur im
  Handy und damit klein zu sehen ist.
- **Bild und Text ohne Handy:** zunächst gebaut, dann wieder verworfen. Es gäbe mehr Platz für Bild und Text, aber das Handy als
  Wiedererkennung fehlt.
- **Ein einzelner Schalter in Pillenform:** verworfen, weil er neben „Simulation
  starten" und „Simulation teilen" wie ein weiterer gleichartiger Knopf wirkt.
- **Beamer-Ansicht in jedem Fenster anbieten:** zuerst so gebaut, verworfen. Am
  Handy waren die Bedienelemente dann 10 bis 14 Pixel groß (Audit vom
  2026-10-08, UX-2026-10-08-01), und im schmalen Fenster blieb für die
  Zeitleiste kein Platz.

## Konsequenzen

- Jeder neue Szeneninhalt muss auch in `js/stage.js` berücksichtigt werden. Der
  Ablauftest (`npm run test:e2e`) prüft deshalb, dass jeder Szenentext in der
  Beamer-Ansicht erschienen ist.
- Ältere Nachrichten sind rechts nicht mehr groß zu sehen, nur noch klein im
  Handy. Das ist der Preis der Schriftgröße.
- Durch das Handy ist die Textspalte schmaler: Lange Nachrichten laufen über
  drei Zeilen.
- Kleine Texte auf dem Foto sind auch in der Beamer-Ansicht kleiner als die
  Nachrichten und aus der letzten Reihe nicht sicher lesbar.
- Das Handy wird per Skript skaliert (`stageFit()`), weil CSS eine Länge nicht
  durch eine Länge teilen kann. Die Pixelhöhe des Handys steht deshalb an zwei
  Stellen: in der Regel `.phone` in `css/styles.css` und als `STAGE_PHONE_PX` in
  `js/stage.js`. Der Ablauftest vergleicht beide.
- Beim Wechsel der Ansicht ändert das Handy seine Höhe; `stageScrollPhone()`
  bringt die Chats danach wieder auf die neueste Nachricht.

## Bedingung für Neubewertung

Rückmeldung aus dem ersten Einsatz im Saal. Ob die Schriftgröße reicht, lässt
sich nur vor Ort mit echtem Beamer und echtem Abstand beurteilen.
