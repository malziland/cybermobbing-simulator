# Übergabe: Version 2.0.2 — Handy ohne Leiste, Dreh-Hinweis im Querformat

Stand: 2026-10-09 · Modus FEATURE · Stufe STANDARD · Abgabekontrolle selbst
abgenommen · Vorgänger: `docs/handover/2026-10-09-handy-leiste.md` (v2.0.1)

Alle Zahlen, Befehle und Gegenproben stehen in `docs/VERIFICATION.md`,
Abschnitt „Version 2.0.2"; hier stehen sie nicht noch einmal.

## 1. Anlass und Scope

Nach der Auslieferung von v2.0.1 schickte der Betreiber ein Foto seines Handys
im Querformat: Das nachgebaute Handy ist dort winzig. Dazu sein Wunsch für das
Hochformat: keine Leiste, Tippen für Pause, voller Platz für das Handy. Am
Rechner sollen Handy- und Beamer-Ansicht bleiben, ein Tablet soll im Querformat
nicht als Handy gelten.

Scope, vom Betreiber am 2026-10-09 über Auswahlfragen mit Skizzen festgelegt
und nach Simulator-Bildern zur Auslieferung freigegeben:

1. Handy quer: Hinweis „Bitte dreh dein Handy hochkant", die Simulation
   pausiert und läuft nach dem Drehen weiter, außer sie war vorher pausiert;
   auch am Startbildschirm und auf der letzten Seite.
2. Handy hochkant: keine Leiste; Tippen pausiert, nochmal Tippen setzt fort;
   Pause-Zeichen, solange pausiert ist; Impressum als Zeile unter dem Handy.
3. Dreh-Symbol: Variante A (liegendes Handy gestrichelt, stehendes kräftig,
   roter Pfeil), aus drei vorgelegten gewählt.
4. Erkennung des Handys über den Browser statt über eine Fenstergröße. Die
   Einzelheiten hat der Betreiber dem Autor überlassen („da kenn ich mich nicht
   aus"); sie stehen in ADR-0008.

## 2. Akzeptanzkriterien und ihre Prüfung

| Kriterium | Prüfung |
|---|---|
| Ein Handy wird erkannt: Browser meldet sich als Handy, kürzere Bildschirmseite unter 600 (599 ja, 600 nein) | QUnit „phoneFrom(): a phone says so itself and has a small screen"; Ablauftest „phones - who counts as one" (fünf Geräte); `npm run test:ios` „Safari in the simulator is recognised as a phone", iPad „not a phone" |
| Hochkant: keine Leiste, Handy füllt die Höhe bis zur Impressum-Zeile, die antippbar bleibt | Ablauftest „no control bar …", „the phone fills the room above the legal notice …" (Chromium und WebKit, dazu ein 540 Pixel breites Handy); `npm run test:ios`, fünf Szenen |
| Tippen pausiert, Pause-Zeichen in der Mitte; zweiter Tipp setzt fort; dasselbe mit der Tastatur | Ablauftest „a tap on the phone pauses; the pause sign stands in the middle", „a second tap continues", „the same with the keyboard"; axe-core auf der Tippfläche |
| Quer: Hinweis über dem ganzen Fenster, Lauf pausiert, dahinter nichts erreichbar; kein Springen, keine Beamer-Ansicht | Ablauftest „held sideways the page shows …", „… the run pauses, nothing behind the hint can be reached", „… wider than 700 px and still has no jumping and no projector view"; axe-core auf dem Hinweis |
| Nach dem Drehen läuft es weiter; von Hand pausiert bleibt pausiert | Ablauftest „turned upright again … continues by itself", „a run paused by hand stays paused …" |
| Quer geöffnet: Hinweis vor dem Startbildschirm; hochkant lässt sich starten | Ablauftest „opened sideways: …" |
| Letzte Seite am Handy: keine Tippfläche über den Knöpfen | Ablauftest „on the last page there is no tap area, "again" can be tapped …"; `npm run test:ios` „help page" |
| Tablets und Rechner unverändert, auch mit Fingerbedienung und niedrigem Fenster | Ablauftest, Größen mit „touch" in den Abschnitten zur Leiste und zu den Kacheln; `npm run test:ios`, iPad |

## 3. Was sich im Code geändert hat

| Stelle | Änderung |
|---|---|
| `js/helpers.js` | `phoneFrom()`, `isPhoneDevice()`, `PHONE_DEVICE`; setzt die Klasse `phone-device` am `<html>` |
| `js/controls.js`, `js/stage.js` | `ctlSeekAllowed()` und `stageFits()` fragen `PHONE_DEVICE`; die Regel „Fingerbedienung und Fenster bis 500 Pixel hoch" aus v2.0.1 ist entfernt |
| `js/main.js` | `rotateSync()`: Dreh-Hinweis zeigen, dahinter alles sperren, pausieren und fortsetzen |
| `index.html`, `js/i18n.js` | Element `#rotateHint` mit dem Symbol, Text `ui.rotate` in beiden Sprachen |
| `css/styles.css` | Abschnitt „PHONE DEVICES": Leiste wird zur Tippfläche, nur das Pause-Zeichen bleibt; `.rotate-hint`; die Medienabfragen von v2.0.1 mit `pointer:coarse` sind entfernt |
| `scripts/run-e2e.js`, `scripts/check-ios.js`, `tests/test-helpers.js` | Prüfungen wie oben; `phoneOptions()` stellt ein Handy nach |

## 4. Entscheidungen

| Entscheidung | Von wem | Warum |
|---|---|---|
| Querformat am Handy: Hinweis statt Darstellung | Betreiber | quer ist das Handy winzig |
| Hochkant ohne Leiste, Tippen für Pause, Impressum unten | Betreiber | voller Platz; Lautstärke haben die Tasten des Handys |
| Symbol A | Betreiber | zeigt, wohin gedreht wird |
| Handy = Browser meldet sich als Handy UND kürzere Bildschirmseite unter 600 | Autor, vom Betreiber überlassen | Tablets dürfen nie als Handy gelten; der Bildschirm sichert gegen einen Tablet-Browser ab, der sich als Handy meldet. 600 ist die Grenze, ab der Android selbst von Tablets spricht |
| Kein Fortschrittsstrich am Handy | Autor | der Betreiber nannte die Zeitleiste dort überflüssig |
| Die Tippfläche ist der vorhandene Pause-Knopf, über die Fläche gelegt | Autor | Beschriftung, Tastatur und Zustand bleiben an einer Stelle |
| Das Pause-Zeichen zeigt den Zustand (pausiert), nicht die nächste Aktion | Autor, nach der gezeigten Skizze | so stand es in der Vorschau |
| Schmale Fenster am Rechner behalten die kurze Leiste | Autor | der Betreiber wollte den Rechner unverändert |
| Wer am Handy die Desktop-Website anfordert, bekommt sie | Autor | das ist dann eine Entscheidung des Besuchers |

## 5. Auffälligkeiten außerhalb des Auftrags

- Der Simulator lässt sich nicht drehen. Das Querformat ist in den Testbrowsern
  mit Handy-Kennung geprüft (Chromium und WebKit), nicht in echtem Safari.
- Im Ablauftest stand seit dem Nachmittag eine Überschrift doppelt; bereinigt.

## 6. Offene Punkte

1. **Jetzt nicht prüfbar: Querformat und Tippen am echten Handy.** Geprüft in
   den Testbrowsern und, hochkant, im Simulator. Prüfbar am Handy des
   Betreibers nach der Auslieferung: einmal tippen, einmal drehen.
2. **Jetzt nicht prüfbar: Android-Handys und Android-Tablets.** Die Erkennung
   stützt sich dort auf die Kennung des Browsers, wie Google sie beschreibt;
   gemessen ist kein Android-Gerät. Prüfbar an einem Gerät. Wird ein Tablet als
   Handy eingeordnet oder umgekehrt, steht die Regel in ADR-0008 wieder an.
3. **Unverändert offen** aus der Übergabe zu v2.0.1: alte Hosting-Releases in
   der Firebase-Konsole löschen (Betreiber); Saal, Ton und Windows-Rechner vor
   Ort; voller Ablauftest in einer zweiten Browser-Technik.

## 7. Eingang für das nächste Audit

- Vergleichsanker: Tag `v2.0.1` (`fcbb963`).
- Geändert: Erkennung des Handys, Handy-Fassung ohne Leiste, Dreh-Hinweis;
  entfernt: die Regel mit `pointer:coarse` aus v2.0.1.
- Nicht neu zur Diskussion: die vier Entscheidungen des Betreibers in
  Abschnitt 4.
- Alles selbst abgenommen. Ein Audit sollte vor allem die Erkennung an echten
  Geräten nachmessen.

## 8. Rückmeldung an die Familie

Eingetragen in `~/.claude/skills/audit-familie/LEHREN.md` unter dem Datum
dieser Übergabe.
