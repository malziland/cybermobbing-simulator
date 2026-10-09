# Übergabe: Version 2.0.1 — Handy und Tablet, einheitliche Handy-Regel

Stand: 2026-10-09 · Modus BUGFIX mit AUDIT-REMEDIATION · Stufe STANDARD ·
Abgabekontrolle selbst abgenommen · Vorgänger:
`docs/handover/2026-10-08-beamer-ansicht.md`

Alle Zahlen, Befehle und Gegenproben stehen in `docs/VERIFICATION.md`,
Abschnitt „Version 2.0.1"; hier stehen sie nicht noch einmal.

## 1. Anlass und Scope

Der Betreiber meldete am 2026-10-09 vom eigenen iPhone (Foto): Die
Eingabeleiste des Chats ist abgeschnitten, und auf der Zeitleiste lässt sich
nicht springen. Auf Nachfrage kam dazu: Quer gehalten ließ sich springen,
hochkant nicht.

Scope, vom Betreiber am 2026-10-09 freigegeben, einschließlich Auslieferung als
2.0.1 ohne weitere Rückfrage:

1. Abgeschnittene Eingabeleiste beheben.
2. Am Handy nie springen und keine Beamer-Ansicht, egal wie es gehalten wird.
3. Tests erweitern: Handy in echten Fenstergrößen, zweite Browser-Technik,
   iPhone-Simulator vor jeder Auslieferung.
4. Letzte Seite in niedrigen Fenstern ohne Rollen.
5. Beamer-Ansicht in Safari nach einem Sprung ansehen und beheben.
6. Lehren nachtragen.
7. Satz im Datenschutztext berichtigen.

Außerhalb des Repositorys, ebenfalls freigegeben: die drei Vorschläge von
Dependabot, der alte Zweig `feat/beamer-ansicht`, `ffmpeg` auf dem Rechner des
Betreibers. Ihr Stand steht in Abschnitt 6.

## 2. Akzeptanzkriterien und ihre Prüfung

| Kriterium | Prüfung |
|---|---|
| In echtem mobilem Safari endet das nachgebaute Handy in jeder Szene über der Steuerleiste und im sichtbaren Fenster | `npm run test:ios`, iPhone, fünf Szenen und letzte Seite |
| Dasselbe in den Fenstergrößen, die Handy-Browser zeigen, hochkant und quer | Ablauftest „bar, phone and legal notice do not overlap", „the phone sits centred …", Abschnitt in WebKit |
| Keine Höhen-Regel des Handys und des Impressum-Rahmens hängt an `vh` | Ablauftest „no rule sizes or places the phone or the legal notice frame in vh" |
| Am Handy (Regel in ADR-0008) kein Springen, kein Knopf, keine Beamer-Ansicht, Taste B ohne Wirkung; an der Grenze 500 ja, 501 nein | Ablauftest „timeline is a progress display; a tap, the End key and the B key do nothing", „view tiles are hidden, projector view is off", Größen 900 × 500 und 900 × 501 |
| Tablets und Rechner behalten Springen und Beamer-Ansicht | Ablauftest, Größen 744 × 1133, 1133 × 744, 1180 × 820, 852 × 393 ohne Fingerbedienung; `npm run test:ios`, iPad |
| Beamer-Ansicht am Tablet: Leiste am unteren Rand der Bildfläche, Handy darüber | `npm run test:ios`, iPad; Ablauftest „the projector view measures the visible height" |
| Letzte Seite mit Logo und zwei Links passt bei 960 × 540, 1024 × 576 und in der Beamer-Ansicht bei 800 × 600 ohne Rollen | Ablauftest „help page with logo and two links fits without scrolling" |
| In der Safari-Technik stehen ältere Nachrichten im ersten Bild nach einem Sprung im Endzustand | Ablauftest, Abschnitt WebKit |
| Der Datenschutztext nennt nur, was gespeichert wird; die Seite liest keinen Sprachwert | QUnit „detectLanguage() ignores a language left in localStorage" |

## 3. Befunde und ihr Stand

Alle Behebungen sind selbst abgenommen. Je Befund: Ursache, geänderte Stelle,
Verifikation (Name der Prüfung und die Gegenprobe aus Runde 5 in
`docs/VERIFICATION.md`, bei der die Behebung in einer Kopie zurückgedreht wurde
und die Prüfung rot wurde), Stand.

| Befund | Ursache | Geändert | Verifikation | Stand |
|---|---|---|---|---|
| BUG-2026-10-09-02: Am Smartphone verdeckt die Leiste den unteren Rand des Handys | Höhe des Handys in `vh` (auf Handys mehr als sichtbar); eine alte Regel für schmale Fenster übersteuerte den Schutz „Handy endet über der Leiste" | `css/styles.css`: Regel `.phone`, Abschnitt „PHONES" | Verifikation: `npm run test:ios` „the phone ends above the control bar and inside the visible window"; Ablauftest „the phone sits centred …", „no rule sizes or places the phone … in vh". Gegenproben i1, r1, r2: rot | behoben |
| BUG-2026-10-09-03: Beamer-Ansicht am Tablet versetzt | dieselbe Denkfigur in `--u`, Handy-Position und `--bar-bottom` | `css/styles.css`: `--wh`, `--u` | Verifikation: `npm run test:ios` „bar at the lower edge of the stage, phone above the bar"; Ablauftest „the projector view measures the visible height". Gegenproben i2, r7, r9, r10: rot | behoben |
| BUG-2026-10-09-04: zwei Regeln für Fenster bis 480 Pixel Höhe wirkten nie | standen vor den Regeln, die sie ändern | `css/styles.css`: Block hinter die Grundregeln gestellt | Verifikation: Messung vor und nach dem Verschieben (50 statt 68 Pixel gespart, danach 68); keine eigene Prüfung für 480 Pixel Höhe, der Block teilt die Stelle mit den geprüften Regeln für 600 | behoben, für 480 nur gemessen |
| UX-2026-10-08-02 und UX-2026-10-08-01 (quer gehaltenes Handy) | Sperre hing an der Fensterbreite | `ctlSeekAllowed()`, `stageFits()`, zwei Medienabfragen | Verifikation: Ablauftest „timeline is a progress display; a tap, the End key and the B key do nothing", „view tiles are hidden, projector view is off", „bar is … px high (expected 36.0)". Gegenproben r3 bis r6: rot | entschieden und behoben |
| BUG-2026-10-08-09, Rest (WebKit) | Übergänge der großen Nachrichten liefen nach dem Sprung | `simSeek()`, `ctlSettle()`, Regel `body.jumping` | Verifikation: Ablauftest, Abschnitt WebKit „in the first frame after a jump older messages are dimmed and pushed-out ones are gone", „the mark for a running jump is cleared again". Gegenproben r13 bis r15: rot | behoben |
| Übergabe vom 2026-10-08, Punkt 6 (letzte Seite um 960 × 540) | zu große Abstände für niedrige Fenster | `css/styles.css`: zwei Blöcke für niedrige Fenster | Verifikation: Ablauftest „help page with logo and two links fits without scrolling" (sieben Fenstergrößen). Gegenproben r11, r12: rot | behoben |
| DOC-2026-10-08-03 (c) (Datenschutztext) | Text nannte einen Wert, den es nie gab | `js/i18n.js`, `index.html`, `docs/SECURITY-MODEL.md` | Verifikation: QUnit „detectLanguage() ignores a language left in localStorage"; `grep -c sim_lang js/*.js index.html`: überall 0. Gegenprobe q1: rot | behoben |
| TEST-2026-10-08-02 (ein Browser) | Tests liefen nur in Chromium | Abschnitt in WebKit, `scripts/check-ios.js` | Verifikation: die beiden neuen Prüfwege laufen und werden bei Rückbau rot (r13 bis r15, i1, i2) | teilbehoben: Der Hauptlauf bleibt in Chromium |

Repo-weiter Nachlauf zur Ursache `vh`: `grep -n -o -E "[0-9.]+d?vh" css/styles.css`
zeigt nach der Behebung noch vier Stellen mit `vh`, alle in `clamp()` mit
festen Grenzen (Abstände am Startbildschirm), dazu die Rückfall-Zeile für
Browser ohne `dvh`. Im JavaScript rechnet `js/stage.js` mit `innerHeight`, das
ist die sichtbare Höhe.

## 4. Entscheidungen

| Entscheidung | Von wem | Warum |
|---|---|---|
| Am Handy nie springen, keine Beamer-Ansicht, egal wie gehalten | Betreiber, 2026-10-09 | einheitlich; mit dem Finger ist die Leiste fummelig |
| „Handy" heißt: Fenster bis 500 Pixel breit, oder Fingerbedienung und Fenster bis 500 Pixel hoch | Autor, dem Betreiber mit Beispielen vorgelegt | Tablets und Rechner dürfen nicht betroffen sein; alte Schulrechner mit niedrigem Fenster haben eine Maus |
| Am Handy sitzt das nachgebaute Handy mittig über der Leiste, mit je 8 Pixel Abstand | Autor | nutzt die Höhe aus; vorher oben mehr Luft als unten |
| Höhen über Prozent des Fensters und `dvh` mit `vh` als Rückfall | Autor | Prozent gilt in jedem Browser; `dvh` fehlt nur sehr alten, die dann rechnen wie bisher |
| Letzte Seite: engere Abstände bis 600 Pixel Fensterhöhe, in der Beamer-Ansicht bei 4:3-Fenstern bis 680 | Autor | genau die Fenster, in denen etwas fehlte; Laptops mit 1366 × 768 bleiben, wie sie waren |
| Der volle Ablauftest bleibt in Chromium; WebKit bekommt einen eigenen Abschnitt | Autor | Der volle Lauf in WebKit ist nicht erprobt; geprüft wird dort, was Chromium nicht zeigen kann |
| Datenschutztext: nur der eine Satz geändert | Betreiber gab die Kürzung frei | sonst bleibt der Rechtstext, wie er war |

## 5. Auffälligkeiten außerhalb des Auftrags

- Der iPad-Simulator zeigte den Versatz der Beamer-Ansicht (BUG-2026-10-09-03);
  er war nicht gemeldet und ist mit behoben, weil er dieselbe Ursache hat.
- Beim ersten Start eines Simulators nimmt Safari einige Sekunden lang keinen
  Link an; `scripts/check-ios.js` versucht es deshalb bis zu einer Minute.
- Der Video-Export braucht den festen Anschluss 8765. Der war am 2026-10-09 von
  einem fremden Programm belegt, der Export brach sofort ab. Für den Probelauf
  diente eine Wegwerfkopie mit anderem Anschluss; am Skript ist nichts geändert.
- Ein Pipeline-Lauf (am Merge-Commit) hing 15 Minuten beim Laden der
  Testbrowser, vier andere liefen an derselben Stelle in Sekunden durch. Der
  Neustart lief durch; ob das Hängen mit dem zusätzlichen WebKit zusammenhängt,
  ist nicht belegt.
- Lokal liegen zwei weitere Zweige: `fix/handy-leiste` (zusammengeführt, auch
  auf GitHub) und `claude/hungry-franklin-8ef461` (nicht aus dieser Arbeit).
  Beide nicht angefasst.

## 6. Offene Punkte

1. **Jetzt nicht prüfbar: das Handy des Betreibers.** Seine Safari-Leiste ist
   zweizeilig und lässt weniger Höhe als die des Simulators (rund 655 statt 699
   bis 714 Pixel; aus seinem Foto gerechnet). Der Simulator ließ sich nicht auf
   diese Leiste umstellen; geprüft ist die Fenstergröße 402 × 655 in den
   Testbrowsern. Prüfbar mit einem neuen Foto nach der Auslieferung.
2. **Jetzt nicht prüfbar: Android-Handys und Tablets im Querformat in echtem
   Browser.** Gerechnet und in den Testbrowsern geprüft; der Simulator lässt
   sich nicht drehen. Prüfbar an einem Gerät.
3. **Entscheidung: voller Ablauftest in einer zweiten Browser-Technik.**
   Empfehlung: nach dem ersten Workshop einmal in WebKit laufen lassen und die
   Abweichungen sichten. Ohne Entscheidung bleibt TEST-2026-10-08-02
   teilbehoben.
4. **Entscheidung des Betreibers, unverändert offen:** alte Hosting-Releases in
   der Firebase-Konsole löschen (Übergabe vom 2026-10-08, Punkt 1). Bis dahin
   kein Rollback über die Konsole.
5. **Jetzt nicht prüfbar, unverändert:** Lesbarkeit und Ton im Saal,
   Windows-Schulrechner, Loslassen der Maus außerhalb des Fensters.
6. **Stand der Punkte außerhalb des Repositorys** (Dependabot, alter Zweig,
   `ffmpeg`): siehe `docs/VERIFICATION.md`, Abschnitt „Version 2.0.1".

## 7. Eingang für das nächste Audit

- Vergleichsanker: Tag `v2.0.0` (`9b796b3`); Berichte unter `docs/audit/`, je
  mit zweitem Nachtrag vom 2026-10-09.
- Geändert: Höhen-Regeln im Stylesheet, die Handy-Regel an drei Stellen,
  `body.jumping`, Abstände der letzten Seite, Datenschutztext, zwei neue
  Prüfwege (`scripts/check-ios.js`, Abschnitt in WebKit).
- Nicht neu zur Diskussion: die Handy-Regel (Entscheidung des Betreibers).
- Alles in dieser Übergabe ist selbst abgenommen. Ein Audit sollte die
  Behebungen fremd nachmessen, vor allem in echtem Safari und an einem
  Android-Gerät.

## 8. Rückmeldung an die Familie

Eingetragen in `~/.claude/skills/audit-familie/LEHREN.md` unter dem Datum
dieser Übergabe: „nicht prüfbar" wurde gemeldet, ohne nachzusehen, ob das
Prüfmittel auf dem Rechner liegt; Handy-Tests liefen mit Gerätemaßen statt mit
dem Fenster des Handy-Browsers; eine unbeantwortete Rückfrage wurde als
Zustimmung gewertet.
