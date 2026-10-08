# ADR-0007: Beamer-Ansicht als zweite, umschaltbare Darstellung

Status: Vorgeschlagen (in Erprobung auf Zweig `feat/beamer-ansicht`) · Datum: 2026-10-08

## Kontext

Im Workshop läuft die Simulation über einen Beamer. Der Handy-Rahmen hat feste
Maße (393 × 852 CSS-Pixel) und wächst nicht mit dem Bild. Messung vom 2026-10-08
gegen Commit `5364d4b` (Chromium, 1920 × 1080): Das Handy belegt 20,5 % der
Bildbreite, ein Großbuchstabe der Chat-Schrift ist 0,95 % der Bildhöhe hoch.

Einsatzbedingungen laut Betreiber: Kinder sitzen bis zu 10–15 m entfernt, der
Beamer hat teils eine schlechte Auflösung. Nach der Planungsregel der
Veranstaltungstechnik (Zeichenhöhe = Abstand ÷ 200) braucht es dafür rund
3,5–5 % der Bildhöhe, also das Vier- bis Fünffache. Ausgeschlossen hat der
Betreiber: die Schrift im Handy einfach zu vergrößern und Scrollen von Hand.

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
- **Bedienelemente wachsen mit:** Pausesymbol und Impressum wachsen in beiden
  Ansichten mit dem Fenster und unterschreiten nie eine Größe, die am Handy
  taugt (22 und 15 CSS-Pixel). In der Beamer-Ansicht sind sie wie Ton-Regler
  und Umschalter in der Einheit der Bildfläche bemessen und an ihr ausgerichtet.
  Der Text „Pausiert …" steht rechts neben dem Pausesymbol.
- **Höchstens zwei Nachrichten gleichzeitig groß** (einschließlich zwei), bei den
  Mitteilungen höchstens drei; die nächste verdrängt die älteste. Hinweise wie
  „… hat einen Screenshot gemacht" haben eine eigene Zeile und verdrängen keine
  Nachricht.
- **Maße nur in Anteilen der Bildfläche.** Die Ansicht ist eine 16:9-Fläche, die
  in jedes Fenster eingepasst wird; alle Größen hängen an einer Einheit
  (`--u`, 1 % der Flächenbreite). Auflösung und Browser-Zoom ändern die
  Proportionen nicht. Die Schriftgröße der Nachrichten ist eine einzige
  Stellgröße (`--st-text` in `css/styles.css`).
- **Umschalter als zwei Vorschaubilder:** ein Mini-Handy und eine Mini-Leinwand,
  am Startbildschirm als Kacheln, während des Laufs klein unten rechts. Dazu die
  Taste B und der Link-Zusatz `?beamer=1`. Der gewählte Zustand steht nur in
  der Adresszeile, es kommt kein weiterer `localStorage`-Wert hinzu. Der
  Teilen-Knopf gibt den Link ohne diesen Zusatz weiter.
- **Nicht eigens groß gezeigt** wird reine Dekoration der App-Oberflächen:
  Statusleiste, Eingabe- und Navigationsleisten, Uhrzeiten und Lesehäkchen an
  Nachrichten, die Datumsmarke im Chat. Sie sind im Handy links zu sehen.
- **Accessibility:** Der Umschalter gehört zum Rahmen-UI (WCAG 2.2 AA,
  ADR-0005). Die Beamer-Ansicht selbst ist wie die Szenen eine filmartige,
  nicht interaktive Darstellung und fällt unter die dort dokumentierte Ausnahme.

## Betrachtete Alternativen

- **Tablet-Querformat originalgetreu nachbauen:** verworfen. Ein Tablet zeigt
  mehr Inhalt bei fast gleicher Schriftgröße; der Gewinn läge rechnerisch bei
  etwa dem 1,5-Fachen.
- **Handy auf volle Bildhöhe skalieren:** verworfen, gemessen 1,17 % statt 0,95 %.
- **Browser-Zoom:** verworfen, bei 200 % werden Mitteilungs-Szene und Schlusstext
  abgeschnitten.
- **Handy am Rand und nur Text daneben:** verworfen, weil das Foto dabei nur im
  Handy und damit klein zu sehen ist.
- **Bild und Text ohne Handy:** zunächst gebaut, auf Wunsch des Betreibers
  verworfen. Es gäbe mehr Platz für Bild und Text, aber das Handy als
  Wiedererkennung fehlt.
- **Ein einzelner Schalter in Pillenform:** verworfen, weil er neben „Simulation
  starten" und „Simulation teilen" wie ein weiterer gleichartiger Knopf wirkt.

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
  Stellen (`.phone` in `css/styles.css` und `STAGE_PHONE_PX` in `js/stage.js`);
  ein Test hält den Wert fest.

## Bedingung für Neubewertung

Rückmeldung aus dem ersten Einsatz im Saal. Ob die Schriftgröße reicht, lässt
sich nur vor Ort mit echtem Beamer und echtem Abstand beurteilen.
