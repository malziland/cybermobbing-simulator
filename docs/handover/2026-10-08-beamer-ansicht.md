# Übergabe: Version 2.0.0 — Beamer-Ansicht, Steuerleiste mit Zeitleiste, Auslieferung nur der Seite

Datum: 2026-10-09 · Abläufe: `/aendern` (FEATURE, danach AUDIT-REMEDIATION),
`/release` · Stufe SCHWER (öffentlich erreichbare Fläche, Auslieferkette)
Zweig: `feat/beamer-ansicht` · Vergleichsanker: `5364d4b` (`main`, v1.2.1)

Die Zahlen aller Läufe stehen an genau einer Stelle: `docs/VERIFICATION.md`.
Diese Übergabe nennt die Prüfungen beim Namen und verweist dorthin.

## 1. Scope und Akzeptanzkriterien

Scope: eine zweite Darstellung des unveränderten Ablaufs für Beamer und große
Räume; ein Ton-Regler; eine Steuerleiste mit Zeitleiste zum Springen und Ziehen,
bis zur letzten Seite; eine Handy-Fassung für schmale Fenster; Kontaktadresse
und Uhrzeit im Impressum; Behebung der Befunde zweier Audits; Auslieferung nur
der Seite selbst.

| Nr. | Kriterium | Prüfung im Ablauftest (`scripts/run-e2e.js`) oder in QUnit |
|---|---|---|
| 1 | Ohne Beamer-Ansicht läuft der Ablauf wie zuvor | „phone view is the default, stage hidden", „CTA screen appears after full simulation" |
| 2 | Ansicht am Startbildschirm per Tastatur wählbar | „Tab runs through the start screen in reading order", axe-Scan des Startbildschirms |
| 3 | `?beamer=1` schaltet ein, nur genau dieser Wert | QUnit „stageFromUrl() accepts exactly beamer=1" |
| 4 | Jeder Szenentext erscheint groß; höchstens zwei Nachrichten, nichts abgeschnitten | „all 33 messages appeared", „all 9 notices appeared", „with 30% wider text no live message is cut off …", „… after a jump either" |
| 5 | Gleiche Proportionen in jeder Fenstergröße und Zoomstufe | „phone beside the stage is 49% …" in sechs Größen |
| 6 | Ton aus und ein, Lautstärke, kein Geräusch am Regler vorbei | QUnit-Modul „volume", „every sound ends at the master gain, none goes past it" |
| 7 | Eine Leiste, in beiden Ansichten gleich, ohne Zeiten | „the bar sits at exactly the same place …", „the bar shows no time" |
| 8 | Klick landet an der geklickten Stelle, nahe einer Marke auf der Marke | „a click lands where it was made", „a click before the knob inside the same scene …", „a click one second next to a mark lands on the mark"; QUnit „ctlSnap() …" |
| 9 | Beim Ziehen läuft das Bild mit, Handy und Beamer-Ansicht zeigen dasselbe, jeder Eintrag sichtbar | „while dragging, phone and stage already show the spot under the pointer, every entry visible", „while the knob is held the simulation stands still" |
| 10 | Nach einem Sprung derselbe Stand wie ohne Sprung, sofort sichtbar | „jump to … s: phone shows the same entries as a normal run", „… every entry can be seen at once", „… the music jumps along" (je fünf Ziele) |
| 11 | Marken stimmen mit den Szenenwechseln überein, letzte Seite eingeschlossen | „all seven marks sit exactly on the switches, the help page included" |
| 12 | Letzte Seite ist Teil der Zeitleiste; von dort zurück ohne Neustart | „dragging into the last part shows the help page …", „from the help page one click goes back into the run …", „at the end the bar is full and the clock stops …" |
| 13 | Tasten auf der Leiste | „keyboard: arrows right/up +5 s, left/down -5 s, Page Up next and Page Down previous scene, End the help page, Home the start" |
| 14 | Schmale Fenster: Handy-Fassung bis 700 Pixel, Regler ab 901, Springen ab 501 | „… view tiles are shown/hidden, projector view is on/off" (sieben Proben), „…: view switch, volume slider, jumping on, timeline takes N% of the bar" (15 Größen), „700 px wide: the projector view gives way …" |
| 15 | Impressum pausiert und setzt fort; zeigt die Uhrzeit der Simulation; Kontaktadresse | „opening the legal notice during the run pauses it", „closing it lets the run continue by itself", „if the run was paused before …", „… shows the same time as the phone", „legal notice gives info@malziland.at …" |
| 16 | Nichts überdeckt sich: Startbildschirm, Lauf, letzte Seite | „start screen has no overlaps" (zwölf Größen), „bar, phone and legal notice do not overlap" (15), „help page with the bar has no overlaps" (acht), „every part of the help page can be scrolled into view" (zwei) |
| 17 | Start ohne Zähler | „SDK host refused …", „SDK host does not answer …", „config.js missing …" |
| 18 | Ausgeliefert wird nur die Seite | `node scripts/deploy-files.js` (Sperre vor dem Deploy), `bash scripts/verify-live.sh` (Prüfung danach) |

## 2. Beweise

Läufe, Zahlen und Stände: `docs/VERIFICATION.md`.

Gegenproben (Rückbau einer Stelle im Produktcode in einer Kopie, Tests
unverändert, die zuständige Prüfung muss rot werden):

- Runde 1, 32 Rückbauten am Stand `b54d710`: alle 32 von den Tests gemeldet, 31
  an der erwarteten Prüfung, einer (Uhr stoppt zu früh) an zwei anderen.
- Runde 2, 25 Rückbauten am Stand `48de3d7`, darunter die zehn folgenreichen
  Stellen, die das tiefe Audit als unbemerkt gemeldet hatte: Ergebnis in
  `docs/VERIFICATION.md`.
- Einzeln: Hinweis-Zeitgeber (QUnit rot, zwei Zusicherungen), Sperre vor dem
  Deploy (mit der alten Ausschlussliste Rückgabewert 1, 133 von 166 Dateien
  gehören nicht zur Seite), Suche nach Schlüsseln (erfundene Schlüssel im echten
  Format: Rückgabewert 1, zwei Funde).

Lehre aus dem Abend: Drei Fehler fand der Betreiber, nicht die Tests (leeres
Handy beim Ziehen, überdeckte Zeile am Startbildschirm, Stummel-Zeitleiste im
schmalen Fenster). Ursache war jedes Mal dieselbe: Die Prüfung maß, ob etwas
vorhanden ist, nicht ob man es sieht, oder sie ließ die mittleren Fenstergrößen
aus. Beides ist jetzt Regel in `AGENTS.md` und in den Prüfungen umgesetzt.

## 3. Befunde der Audits

Zwei Berichte liegen in `docs/audit/`, je mit einem datierten Nachtrag, der zu
jedem Befund den Stand und den Nachweis nennt:

- `2026-10-08-kurz-1c498c1.md`: elf Befunde, keine der Stufen P0 und P1.
- `2026-10-08-tief-7c49271.md`: ein Befund P1 (versteckte Ordner auf der
  Live-Seite, Bestand seit 2026-07-16), zwei P2, elf P3.

Kurzfassung des Standes: Der P1-Befund und beide P2-Befunde sind behoben. Offen
bleiben zwei Punkte als Entscheidung (Abschnitt 6, Punkte 2 und 3) und ein
Restpunkt, der nicht prüfbar war (Abschnitt 6, Punkt 6).

## 4. Entscheidungen, die ich getroffen habe

Der Betreiber hat am Abend des 2026-10-08 gebeten, offene Entscheidungen selbst
zu treffen und bis zum Morgen auszuliefern. Jede steht hier, damit er sie
nachlesen und ändern kann.

| Entscheidung | Warum | Rückweg |
|---|---|---|
| Version 2.0.0 | Vorgabe des Betreibers | — |
| Schmale Fassung bis einschließlich 700 Pixel Fensterbreite (keine Beamer-Ansicht, keine Umschalter), Lautstärke-Regler in der Handy-Ansicht erst ab 901 | Die Zeitleiste war im schmalen Fenster 0 bis 71 Pixel breit; 700 statt eines höheren Werts, damit alte Beamer (800 × 600, 1024 × 768 bei 125 %) die Beamer-Ansicht behalten | `STAGE_MIN_WIDTH` in `js/stage.js` und zwei Zeilen in `css/styles.css` |
| Springen bleibt bis 500 Pixel gesperrt, die Sperre hängt an der Fensterbreite | So war es dokumentiert; ein quer gehaltenes Handy darf damit springen | ADR-0008, Bedingung für Neubewertung |
| Zeitleiste reicht bis 140 Sekunden, die letzte Seite beginnt bei 134 | Die Leiste blieb bei 2:00 stehen, während der Schlusstext lief; die letzte Seite braucht ein Stück zum Anklicken | `CTL_TOTAL`, `CTL_SCENES` |
| Klick rastet nur innerhalb von 1,5 Sekunden neben einer Marke ein | Sonst lässt sich der Anfang einer Szene kaum treffen | `CTL_SNAP` |
| Hinweise stehen ihre volle Zeit oder bis der nächste sie ablöst | Altfehler: Drei Hinweise waren nur eine halbe Sekunde zu sehen, auch am Beamer | `toast()` in `js/helpers.js` |
| Kontaktadresse auch in `llms.txt`, `SECURITY.md`, `CONTRIBUTING.md` und der Issue-Vorlage umgestellt | Der Auftrag nannte das Impressum; derselbe Fakt stand an sechs Stellen | je eine Zeile |
| Ausgeliefert wird nur die Seite; Doku, Tests und Skripte nicht mehr | Bis v1.2.1 war das ganze Projektverzeichnis abrufbar, samt `.git/` | `hosting.ignore`, `scripts/deploy-files.js` |
| Das Firebase-SDK lädt als Letztes; die Seite wartet beim Start nicht mehr darauf | Altfehler: In einem Netz, das den Host sperrt oder hängen lässt, tat „Simulation starten" nichts | Reihenfolge der Skripte in `index.html`, `initPage()` in `js/main.js` |
| Uhr der Leiste nach echter Zeit | Sie ging in Firefox und WebKit 4 bis 6 % nach | `tick()` in `js/timer.js` |
| Startbildschirm und letzte Seite enden oberhalb des Hinweistexts und lassen sich in niedrigen Fenstern rollen | Am quer gehaltenen Handy lief der Inhalt unter dem Hinweistext durch | `css/styles.css`, `#start` und `.cta-screen` |
| Impressum übernimmt den Tastaturfokus; dahinter ist nichts bedienbar | Befund des tiefen Audits zur Barrierefreiheit | `openImpressum()` in `js/main.js` |
| Unbenutztes entfernt: `.fin-msg`, `startMusic()` | Auftrag „ohne Altlasten"; beide schon am Anker ohne Verwendung | — |
| Tiefes Audit vor der Auslieferung abgewartet, danach eine Nachprüfung der Behebungen | Regel des Projekts für größere Releases; es fand den P1-Befund | — |
| Kein Eintrag unter „Releases" auf GitHub, nur Tag und CHANGELOG | wie bei v1.2.0 und v1.2.1 | `gh release create` |
| Datenschutztext im Impressum nicht verändert | Rechtstext des Betreibers; siehe Abschnitt 6, Punkt 2 | — |
| Alte Hosting-Releases nicht gelöscht | Löschen in der Cloud-Konsole war nicht freigegeben, und der schnelle Rückweg bleibt so für den ersten Tag erhalten; siehe Abschnitt 6, Punkt 1 | — |

## 5. Auffälligkeiten außerhalb des Auftrags

- Auf GitHub liegen drei offene Zweige von Dependabot (Aktualisierungen für
  GitHub Actions, npm, `scripts/video-export`). Nicht angefasst.
- `ffmpeg` auf dem Rechner des Betreibers startet nicht („Library not loaded:
  /opt/homebrew/opt/x265/lib/libx265.215.dylib"). Der Video-Export ist angepasst,
  aber nicht ausgeführt.
- Zweimal am Abend hing das Laden der Seite im Testbrowser länger als 30
  Sekunden. Das tiefe Audit hat die Ursache gefunden: Die Seite wartete auf das
  Firebase-SDK (jetzt behoben).
- Im Testbrowser nachgeladen: die Firefox-Version von Playwright (rund 99 MB im
  Zwischenspeicher der Testwerkzeuge).

## 6. Offene Punkte

1. **Entscheidung: alte Hosting-Releases löschen.** Die Releases vor v2.0.0
   enthalten `.git/` und `.claude/settings.local.json`. Abrufbar sind sie nicht
   mehr, ein Rollback über die Konsole stellte sie aber wieder ins Netz.
   Empfehlung: löschen, sobald v2.0.0 einen Tag läuft (Firebase-Konsole →
   Hosting → Release-Verlauf → je Release „Löschen"). Ohne Entscheidung bleibt
   dieser Rückweg eine Falle.
2. **Entscheidung: ein Satz im Datenschutztext stimmt nicht.** Das Impressum
   sagt, die Seite lege zwei Werte im Browserspeicher ab, darunter die gewählte
   Sprache. Gemessen wird die Sprache nie gespeichert, nur gelesen. Empfehlung:
   den Satz auf den einen Wert kürzen und den Lesezugriff entfernen. Ohne
   Entscheidung bleibt die Aussage zu weit gefasst (zu Ungunsten niemandes).
3. **Entscheidung: Springen und Beamer-Ansicht am quer gehaltenen Handy.** Beides
   ist dort möglich; die Knöpfe sind in der Beamer-Ansicht dann 17 bis 18 Pixel
   groß. Empfehlung des Audits: beides zusätzlich an „Gerät ohne Maus" hängen,
   nach dem ersten Workshop. Ohne Entscheidung bleibt es, wie in ADR-0007 und
   ADR-0008 begründet.
4. **Entscheidung: Schriftgröße der Beamer-Ansicht.** `--st-text: 3.5` reicht
   nach der Regel Abstand ÷ 200 für 15 m bei 3 m breiter Leinwand. Beispiel knapp
   darunter: 14 m, erfüllt. Knapp darüber: 15 m bei 2,5 m Leinwand, nicht
   erfüllt. Empfehlung: im größten Raum ansehen. Ohne Entscheidung bleibt 3.5.
5. **Entscheidung: die drei Zweige von Dependabot.** Empfehlung: nach diesem
   Release einzeln ansehen und übernehmen. Ohne Entscheidung veralten die
   Werkzeuge weiter.
6. **Jetzt nicht prüfbar: Lesbarkeit im Saal, Klang, Windows, echtes Safari und
   Firefox, Loslassen der Maus außerhalb des Fensters.** Gemessen ist in den
   Testbrowsern ohne Bildschirm. Prüfbar am ersten Einsatzort.

## 7. Eingang für das nächste Audit

- Vergleichsanker: Tag `v2.0.0`; Berichte in `docs/audit/` samt Nachträgen.
- Entschieden und nicht neu zu diskutieren: ADR-0007, ADR-0008, die Tabelle in
  Abschnitt 4, der Vorfall in `docs/SECURITY-MODEL.md`.
- Ansehen: ob die alten Hosting-Releases gelöscht sind; ob die Pipeline nach
  jedem Push grün war; die Sperre `scripts/deploy-files.js` hängt an einer
  inneren Funktion der Firebase-CLI (`lib/listFiles.js`) und endet mit
  Rückgabewert 2, falls die sich ändert.
- Nicht gemessen und deshalb zuerst: echte Geräte (Abschnitt 6, Punkt 6).

## 8. Abnahme

- `3de601b`: unabhängig abgenommen (sieben Befunde, behoben).
- `1c498c1`: Audit KURZ durch eine Instanz, die den Code nicht geschrieben hat.
- `7c49271`: Audit TIEF, ebenso; dabei wurden die Behebungen des Kurz-Audits
  nachgemessen (acht behoben, zwei teilbehoben, eine als Entscheidung offen).
- Behebungen nach `7c49271`: Nachprüfung durch eine weitere Instanz, Ergebnis im
  Nachtrag des tiefen Berichts.
- Diese Übergabe und `docs/VERIFICATION.md`: selbst abgenommen. Ihre
  Vollständigkeit gilt als unbestätigt, bis ein späterer Lauf sie prüft.

## 9. Rückmeldung an die Familie

- Mit Schaden belegt: Ein Ausschlussmuster, das richtig aussieht, hat drei
  Monate lang `.git/` ausgeliefert. Eine Negativliste braucht eine Prüfung der
  tatsächlichen Dateiliste vor dem Deploy und eine Probe verbotener Pfade danach.
- Mit Schaden belegt: Prüfen, ob etwas vorhanden ist, statt ob man es sieht. Drei
  Fehler fand der Betreiber, nicht die Tests.
- Fehlerklasse ohne Regel: Eine Gegenprobe mit einem bekannten Beispielwert kann
  stumm bleiben, weil das Werkzeug ihn als harmlos kennt (gitleaks und die
  Beispiel-Schlüssel von AWS).
- Fehlerklasse ohne Regel: Ein Testserver, der weniger kann als der echte (keine
  Teilabrufe), lässt eine Prüfung grundlos rot werden oder grundlos grün.
- Aufwand ohne Ertrag: keiner. Das tiefe Audit hat den wichtigsten Befund des
  Abends geliefert.
