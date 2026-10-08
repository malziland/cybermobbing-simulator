# RUNBOOK — Betrieb, Deployment, Rollback

Stand: 2026-10-08

## Lokale Vorschau

```bash
npm run dev        # Firebase-Hosting-Emulator auf http://localhost:5000
```

Voraussetzung für den View-Counter: `js/config.js` vorhanden
(`cp js/config.example.js js/config.js` und Werte eintragen). Ohne die Datei
läuft die Simulation trotzdem, der View-Counter ist dann ausgeblendet. Dasselbe
gilt, wenn das Firebase-SDK nicht lädt (siehe Störfall weiter unten); der
Ablauftest prüft alle drei Fälle.

## Prüfen vor jedem Deploy

Alle fünf müssen mit Rückgabewert 0 enden; gelesen wird der Rückgabewert, nicht
die Ausgabe:

```bash
npm run lint                        # ESLint + Prettier-Check
npm run test                        # QUnit-Suite headless (Playwright/Chromium)
npm run test:e2e                    # End-to-End + Accessibility (axe-core)
npm audit --audit-level=high        # Abhängigkeiten (auch in scripts/video-export)
gitleaks git --redact .             # Geheimnisse in der gesamten Historie
```

Dieselben Prüfungen laufen als Pflicht-Checks der Pipeline auf jedem Pull
Request und jedem Push auf `main` (`.github/workflows/ci.yml`). Dort laufen die
Layout-Prüfungen des Ablauftests mit Linux-Schriften; ein grüner Lauf am Mac
ersetzt das nicht.

## Deployment

Nur nach ausdrücklicher Freigabe des Betreibers:

```bash
npm run deploy     # führt automatisch vorher scripts/cache-bust.sh aus
```

`scripts/cache-bust.sh` schreibt einen frischen Stempel in `index.html`
(`?v=…`). Diese Änderung gehört zum ausgelieferten Stand und wird nach dem
Deploy committet.

**Was ausgeliefert wird:** nur die Seite selbst, also `index.html`, `css/`,
`js/`, `assets/`, `favicon.svg`, `llms.txt`, `robots.txt`, `sitemap.xml` und
`LICENSE`. Doku, Tests, Skripte und Werkzeugdateien bleiben im Repository; die
Liste `hosting.ignore` in `firebase.json` schließt sie aus (Entscheidung vom
2026-10-08; bis v1.2.1 waren sie über die Live-Adresse abrufbar, etwa
`/docs/RUNBOOK.md` und `/tests/test-runner.html`). Wer eine neue Datei anlegt,
die die Seite braucht und die nicht unter `css/`, `js/` oder `assets/` liegt,
trägt sie in `scripts/verify-live.sh` ein; wer eine neue Werkzeugdatei im
Wurzelverzeichnis anlegt, trägt sie in `hosting.ignore` ein.

Release-Ablauf, in dieser Reihenfolge:

1. Prüfungen oben grün, CHANGELOG-Abschnitt „Unveröffentlicht" fertig.
2. Zweig hochladen, Pull Request, Pipeline grün, nach `main` zusammenführen.
3. Von `main` aus deployen (`npm run deploy`).
4. Beweisen, dass die Live-Seite den Stand zeigt: `bash scripts/verify-live.sh`.
   Das Skript ruft jede Datei der Seite von https://cybermobbing.web.app ab und
   vergleicht ihre Prüfsumme mit der lokalen (`js/config.js` nur über die
   Prüfsumme, nie über den Inhalt). Es prüft auch, dass Doku, Tests und
   Werkzeugdateien nicht abrufbar sind. Nach dem Deploy muss es mit
   Rückgabewert 0 enden. Unmittelbar vor dem Deploy muss es mit 1 enden, weil
   live noch der vorige Stand liegt; das ist der Beleg, dass die Prüfung
   anschlagen kann.
5. Erst danach die Stempel setzen, in einem Commit: Version in `package.json`
   und `package-lock.json`, CHANGELOG-Überschrift mit Version und Datum, der
   Cache-Stempel in `index.html`. Darauf den **annotierten** Tag
   (`git tag -a vX.Y.Z -m "…"`, ADR-0001), dann Commit und Tag hochladen. Ein
   Tag vor dem Deploy behauptet eine Auslieferung, die es noch nicht gibt.

## Rollback

Zwei Wege, je nach Situation:

1. **Hosting-Rollback (schnellster Weg, ~1 Minute):** Firebase-Konsole →
   Hosting → Release-Verlauf → gewünschtes früheres Release → „Rollback".
   Stellt exakt die zuvor ausgelieferten Dateien wieder her; Code im Repo
   bleibt unverändert.
2. **Code-Rollback über Git-Tag:**
   ```bash
   git worktree add /tmp/rollback vX.Y.Z   # alten Stand isoliert auschecken
   cd /tmp/rollback
   bash setup.sh                           # App-Icons sind gitignored, im frischen worktree fehlen sie!
   cp <pfad-zur-lokalen>/js/config.js js/config.js
   firebase deploy --project cybermobbing
   cd - && git worktree remove /tmp/rollback
   ```
   Die Datenbank ist davon nicht betroffen (nur Zählerstände, kein Schema).

### Rollback-Probe (zuletzt durchgeführt: 2026-07-16, Ziel-Tag v1.1.5)

Ablauf: Tag in temporärem worktree ausgecheckt, dort Setup und QUnit-Suite
(headless, `node scripts/run-tests.js <worktree-pfad>`) ausgeführt, worktree
entfernt — Historie unberührt. Ergebnisse:

- **setup.sh @v1.1.5: fehlgeschlagen** (Apples CDN-Icon-Tokens rotiert, 404).
  Ursache im aktuellen Stand behoben: setup.sh löst die Icon-URLs jetzt zur
  Laufzeit über die iTunes-Lookup-API auf; verifiziert in leerem Verzeichnis
  (5/5 Icons geladen). Lehre: Bei Rollback auf Tags ≤ v1.1.5 die Icons aus
  dem Arbeits-Checkout kopieren oder das aktuelle setup.sh verwenden.
- **QUnit-Suite @v1.1.5: läuft**; 2 bekannte „global failure"-Fehler des
  alten Test-Aufbaus (nativer setTimeout-Leak; im aktuellen Stand behoben,
  Commit 7bcc545). Kein Hindernis für den Rollback des Produkts.
- **Schnellster Rollback-Weg bleibt** der Release-Verlauf der
  Firebase-Konsole (Weg 1), der die tatsächlich ausgelieferten Dateien
  inklusive Icons wiederherstellt.

## Störfall: View-Counter zeigt „--" oder verschwindet

Bekannte Ursachen, in dieser Reihenfolge prüfen:

1. **Werbe-/Trackingblocker oder Schulfirewall** blockiert `firebaseio.com` —
   erwartetes Verhalten: Counter blendet sich nach 5 s aus, Simulation läuft normal.
2. **CSP-Meldungen in der Konsole** („Refused to execute a script (inline)"):
   kein Fehler, siehe ADR-0002 — nichts unternehmen.
3. **`js/config.js` fehlt oder enthält falsche Werte** (nur bei eigenem
   Deployment/Fork relevant).
4. Firebase-Status prüfen: https://status.firebase.google.com

## Störfall: „Simulation starten" tut nichts

Bis v1.2.1 hing der Start am Firebase-SDK von `www.gstatic.com`: War der Host im
Netz der Schule gesperrt oder antwortete er nicht, blieb der Startknopf ohne
Wirkung. Seit v2.0.0 lädt das SDK als Letztes und der Zähler ist vom Start
getrennt. Tritt der Fehler trotzdem auf: Browser-Konsole öffnen, die Fehlermeldung
notieren und die Seite mit einem zweiten Browser gegenprüfen.

## Störfall: Limit-Seite erscheint unerwartet

`/daily/<heutiges-UTC-Datum>` in der RTDB-Konsole prüfen. Steht der Wert
≥ `DAILY_LIMIT`, ist das Verhalten korrekt (ADR-0004). Reset erfolgt
automatisch um UTC-Mitternacht. Ein manuelles Zurücksetzen (Wert löschen)
nur in begründeten Ausnahmefällen.

## Wartung: alte /daily-Einträge aufräumen (optional)

Die Tagesschlüssel unter `/daily` wachsen um einen Eintrag pro Tag (~4 KB/Jahr,
kein Handlungsdruck). Bei Bedarf in der Firebase-Konsole Einträge löschen, die
älter als der aktuelle UTC-Tag sind. Niemals den aktuellen Tag löschen.

## Tastatur-Smoketest (UI-Profil, manuell)

Prozedur (Rahmen-UI gemäß ADR-0005), Dauer ~4 Minuten, in einem Fenster ab
901 Pixel Breite:

1. Seite laden, nur Tastatur verwenden.
2. `Tab` durch den Startbildschirm: Reihenfolge Start → Handy → Beamer →
   Teilen → Open-Source-Link → Impressum; Fokus muss sichtbar sein.
3. Impressum mit `Enter` öffnen, mit `Escape` schließen.
4. Start-Button mit `Enter` auslösen; Simulation startet.
5. `Tab` durch die Steuerleiste: Pause → Zeitleiste → Ton → Lautstärke →
   Handy → Beamer → Impressum. Mit `Enter` pausieren und fortsetzen.
6. Auf der Zeitleiste: Pfeil rechts und links (fünf Sekunden vor und zurück),
   Bild auf (nächste Szene), Ende (letzte Seite), Pos1 (Anfang).
7. Impressum in der Leiste mit `Enter` öffnen: Die Simulation pausiert und läuft
   nach `Escape` weiter.
8. Nach Ende (oder mit `?testspeed=10` beschleunigt): Seite mit den
   Hilfsangeboten — Teilen-, Nochmal-Button und Hilfsangebot-Links per `Tab`
   erreichbar und auslösbar; die Leiste steht weiter unten.

Letztes Ergebnis: siehe docs/VERIFICATION.md (Zeile „Tastatur-Smoketest").
