# RUNBOOK — Betrieb, Deployment, Rollback

Stand: 2026-07-16

## Lokale Vorschau

```bash
npm run dev        # Firebase-Hosting-Emulator auf http://localhost:5000
```

Voraussetzung: `js/config.js` vorhanden (`cp js/config.example.js js/config.js`
und Werte eintragen); ohne die Datei läuft die Simulation trotzdem, nur der
View-Counter blendet sich nach 5 s aus.

## Prüfen vor jedem Deploy

```bash
npm run lint       # ESLint + Prettier-Check
npm run test       # QUnit-Suite headless (Playwright/Chromium)
npm run test:e2e   # End-to-End + Accessibility (axe-core)
```

## Deployment

Nur nach ausdrücklicher Freigabe des Betreibers:

```bash
npm run deploy     # führt automatisch vorher scripts/cache-bust.sh aus
```

Release-Ablauf: CHANGELOG-Abschnitt finalisieren → Version in `package.json`
erhöhen → **annotierten** Tag setzen (`git tag -a vX.Y.Z -m "…"`, ADR-0001) →
pushen (`git push && git push --tags`) → deployen.

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
   cp <pfad-zur-lokalen>/js/config.js js/config.js
   firebase deploy --project cybermobbing
   cd - && git worktree remove /tmp/rollback
   ```
   Die Datenbank ist davon nicht betroffen (nur Zählerstände, kein Schema).

### Rollback-Probe

Ergebnis der verpflichtenden Probe: siehe docs/VERIFICATION.md (Zeile
„Rollback-Probe"). Die Probe checkt den letzten Release-Tag in einem
temporären worktree aus, führt dort Setup und Tests aus und entfernt den
worktree wieder — die Projekthistorie bleibt unberührt.

## Störfall: View-Counter zeigt „--" oder verschwindet

Bekannte Ursachen, in dieser Reihenfolge prüfen:

1. **Werbe-/Trackingblocker oder Schulfirewall** blockiert `firebaseio.com` —
   erwartetes Verhalten: Counter blendet sich nach 5 s aus, Simulation läuft normal.
2. **CSP-Meldungen in der Konsole** („Refused to execute a script (inline)"):
   kein Fehler, siehe ADR-0002 — nichts unternehmen.
3. **`js/config.js` fehlt oder enthält falsche Werte** (nur bei eigenem
   Deployment/Fork relevant).
4. Firebase-Status prüfen: https://status.firebase.google.com

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

Prozedur (Rahmen-UI gemäß ADR-0005), Dauer ~3 Minuten:

1. Seite laden, nur Tastatur verwenden.
2. `Tab` durch den Startbildschirm: Reihenfolge Start → Teilen →
   Open-Source-Link → Impressum; Fokus muss sichtbar sein.
3. Impressum mit `Enter` öffnen, mit `Escape` schließen.
4. Start-Button mit `Enter` auslösen; Simulation startet.
5. Pause-Button mit `Tab` erreichen, mit `Enter` pausieren und fortsetzen.
6. Nach Ende (oder mit `?testspeed=10` beschleunigt): CTA-Ansicht — Teilen-,
   Nochmal-Button und Hilfsangebot-Links per `Tab` erreichbar und auslösbar.

Letztes Ergebnis: siehe docs/VERIFICATION.md (Zeile „Tastatur-Smoketest").
