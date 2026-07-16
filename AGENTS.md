# AGENTS.md — Projektregeln für KI-Agenten

## Befehle

```bash
npm ci                 # Dev-Werkzeuge installieren (Node-Version: .nvmrc)
npm run lint           # ESLint + Prettier-Check
npm run format         # Prettier schreibend (nur js/, tests/, scripts/)
npm run test           # QUnit-Suite headless (Playwright/Chromium)
npm run test:e2e       # E2E + axe-core (braucht kein js/config.js)
npm run dev            # lokale Vorschau (Firebase-Hosting-Emulator, Port 5000)
npm run deploy         # NUR nach ausdrücklicher Betreiber-Freigabe
bash setup.sh          # lädt App-Icons (einmalig, nicht im Repo)
```

## Harte Leitplanken (nicht verhandelbar)

- **Kein Build-Schritt einführen.** Vanilla JS, Skripte laufen direkt im Browser.
- **Kein Firebase App Check, keine (auch anonyme) Authentifizierung,
  keine IP-Rate-Limits** — Begründung in docs/adr/ADR-0003.
- **`DAILY_LIMIT` nicht erhöhen** — Kosten-Deckel, ADR-0004.
- **CSP nicht aufweichen:** kein `'unsafe-inline'` in `script-src`; die
  Inline-Script-Konsolen-Meldungen sind erwartet (ADR-0002).
- **`js/config.js` niemals committen** (gitignored; Vorlage: config.example.js).
- **Keine Links auf malziland.at oder malzi.me** einbauen (getrennte Projekte);
  E-Mail-Adresse im Impressum bleibt wie sie ist.
- **Kein Push, Deploy, Release-Tag ohne ausdrückliche Freigabe.**

## Konventionen

- Doku/CHANGELOG deutsch; Code-Kommentare und Commits englisch
  (Conventional Commits: feat, fix, chore, docs, test, refactor, ci).
- Code-Stil: `var`-basiertes ES5-kompatibles Vanilla JS mit JSDoc-Blöcken —
  bestehenden Stil fortführen, nicht modernisieren (kein Refactor ohne Auftrag).
- Versionierung: SemVer, **annotierte** Tags (`git tag -a`).
- Accessibility-Scope: Rahmen-UI ja, simulierte App-Szenen bewusst nicht (ADR-0005).
- Zeitsteuerung der Szenen ausschließlich über `simTimeout()` (audio.js),
  nie natives `setTimeout` — sonst bricht die Pause-Funktion.
- `?testspeed=N` (1–60) beschleunigt die Simulation für Tests; Standard 1.

## Wo was steht

- Entscheidungen: docs/adr/ · Sicherheit/Daten: docs/SECURITY-MODEL.md
- Betrieb/Rollback: docs/RUNBOOK.md · Nachweise: docs/VERIFICATION.md
- Plan des Standard-Nachzugs: docs/KONZEPT.md
