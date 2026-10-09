# AGENTS.md — Projektregeln für KI-Agenten

## Befehle

```bash
npm ci                 # Dev-Werkzeuge installieren (Node-Version: .nvmrc)
npm run lint           # ESLint + Prettier-Check
npm run format         # Prettier schreibend (nur js/, tests/, scripts/)
npm run test           # QUnit-Suite headless (Playwright/Chromium)
npm run test:e2e       # E2E + axe-core (braucht kein js/config.js)
npm run test:ios       # iPhone und iPad im Simulator, echtes Safari (nur Mac mit Xcode)
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
- **Keine Links auf malziland.at oder malzi.me** einbauen (getrennte Projekte).
  Kontaktadresse des Projekts ist `info@malziland.at` (Entscheidung des
  Betreibers vom 2026-10-08); sie steht im Impressum, in `llms.txt`,
  `SECURITY.md`, `CONTRIBUTING.md` und in der Issue-Vorlage.
- **Kein Push, Deploy, Release-Tag ohne ausdrückliche Freigabe.**
- **Ausgeliefert wird nur die Seite.** `scripts/deploy-files.js` sperrt jeden
  Deploy, dessen Dateiliste etwas anderes enthält; die Sperre wird nie umgangen
  (kein `firebase deploy` an `firebase.json` vorbei). Neue Dateien: siehe
  docs/RUNBOOK.md, „Was ausgeliefert wird".

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
- Beamer-Ansicht (ADR-0007): Das Handy bleibt die einzige Quelle. `js/stage.js`
  liest nur mit; Szenen rufen die Beamer-Ansicht nie direkt auf. Neue
  Szeneninhalte brauchen einen Eintrag in `js/stage.js` und in der Schlüsselliste
  des Ablauftests (`scripts/run-e2e.js`). Maße der Beamer-Ansicht nur in der
  Einheit `--u`, nie in festen Pixeln.
- Zeitleiste (ADR-0008): Ein Sprung startet die Szenen neu und durchläuft sie
  stumm bis zur Zielzeit. Jede Szene muss das mitmachen: sichtbarer Zustand nur
  im Handy-Bildschirm (`#phone .scr`), kein eigener Timer, kein Zugriff auf
  Elemente außerhalb, der beim Neustart stehen bliebe. Einzige Ausnahme ist die
  letzte Seite: Was `p6()` außerhalb des Handys verändert, nimmt `p6Reset()`
  zurück (beide in `js/scenes/p5-finale.js`); wer das eine ändert, ändert das
  andere mit. Eine neue Szene oder eine geänderte Szenendauer braucht den
  passenden Eintrag in `CTL_SCENES` (`js/controls.js`). Das ist die einzige
  Stelle, an der Szenenzeiten stehen; Kommentare und Doku nennen keine.
- Sichtbarkeit prüfen, nicht Vorhandensein: Einträge im Handy beginnen
  unsichtbar und werden erst durch ihre Einblendung sichtbar. Ein Test, der nur
  zählt, ob ein Element da ist, übersieht ein leeres Handy.
- Die Leiste zeigt keine Zeiten (ADR-0008).
- Höhen nie in `vh`: Auf Handys und Tablets ist `100vh` mehr, als zu sehen ist
  (Höhe mit eingefahrener Browserleiste). Fest platzierte Teile bekommen
  Prozent des Fensters, die Beamer-Ansicht rechnet mit `--wh` und `--u`. Die
  Testbrowser zeigen den Unterschied nicht; der Ablauftest liest deshalb die
  Regeln, und `npm run test:ios` misst in echtem Safari.
- Handy prüfen heißt: ein Browser, der sich als Handy meldet, mit dem Bildschirm
  eines Handys, in den Fenstergrößen, die er zeigt (niedriger als das Gerät,
  weil seine Leisten abgehen), hochkant und quer. Im Ablauftest liefert das
  `phoneOptions()`; Gerätemaße wie 393 × 852 ohne Handy-Kennung sind ein
  schmales Rechnerfenster, kein Handy.
- Was als Handy gilt, steht in ADR-0008 und wird an genau einer Stelle
  entschieden: `PHONE_DEVICE` in `js/helpers.js` (Klasse `phone-device` am
  `<html>`). Am Handy gibt es keine Leiste, kein Springen und keine
  Beamer-Ansicht; quer erscheint der Dreh-Hinweis. Neue Regeln für Handys
  hängen an dieser Klasse, nicht an einer Fenstergröße.

## Wo was steht

- Entscheidungen: docs/adr/ · Sicherheit/Daten: docs/SECURITY-MODEL.md
- Betrieb/Rollback: docs/RUNBOOK.md · Nachweise: docs/VERIFICATION.md
- Plan des Standard-Nachzugs: docs/KONZEPT.md
