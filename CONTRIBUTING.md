# Beitragen zur Cybermobbing Simulation

Beitraege sind herzlich willkommen! Egal ob Bugfix, neues Feature oder eine neue Sprachversion -- jede Hilfe macht das Projekt besser.

## Voraussetzungen

Kein Build-Step, kein npm noetig. Du brauchst nur:

- Einen **Browser** (Chrome, Firefox, Safari, Edge)
- Einen **Texteditor** (VS Code, Sublime, vim, ...)

## Setup

1. **Repo forken & klonen**

   ```bash
   git clone https://github.com/DEIN-USERNAME/cybermobbing-simulation.git
   cd cybermobbing-simulation
   ```

2. **App-Icons herunterladen**

   ```bash
   bash setup.sh
   ```

3. **Firebase-Config anlegen**

   ```bash
   cp js/config.example.js js/config.js
   ```

   Dann `js/config.js` oeffnen und deine eigene Firebase-Konfiguration eintragen.

4. **Lokalen Server starten**

   ```bash
   npx serve .
   ```

   oder

   ```bash
   python3 -m http.server
   ```

5. **Tests ausfuehren**

   `tests/test-runner.html` im Browser oeffnen.

## Wie beitragen

- **Issues**: Bug melden oder Feature vorschlagen -- einfach ein Issue erstellen.
- **Pull Requests**: Fork -> Branch -> Aenderungen -> PR erstellen.
- **Kleine PRs bevorzugt**: Ein Fix oder ein Feature pro PR. Das macht Reviews einfacher und schneller.

## Code-Richtlinien

- **Vanilla JS** -- kein Framework, kein Build-Step.
- **Alle UI-Texte** ueber `t('key')` aus `js/i18n.js` -- keine hardcodierten Strings im HTML oder JS.
- **Neue Strings**: Immer in **beiden Sprachen** (de + en) im `TRANSLATIONS`-Objekt in `js/i18n.js` einfuegen.
- **Tests** fuer neue Funktionen in `tests/` (QUnit).
- **JSDoc** fuer neue Funktionen.
- **Sicherheit bei Uebersetzungen**: Einige i18n-Keys nutzen `data-i18n-html` und setzen `innerHTML`. Translation-Strings duerfen nur harmloses HTML enthalten (`<br>`, `<strong>`, `<em>`, `<a href="...">`). Kein `<script>`, kein `onerror`, keine Event-Handler in Attributen. Reviews pruefen das explizit.

## Neue Sprache hinzufuegen

1. Neuen Block in `js/i18n.js` unter `TRANSLATIONS` anlegen (z.B. `fr: { ... }`).
2. Alle Keys aus `de` uebersetzen.
3. **Charakter-Stimmen beibehalten**: Sara schreibt in GROSSBUCHSTABEN, Tim macht Tippfehler, etc. Das ist Teil der Simulation und muss in jeder Sprache erhalten bleiben.
4. Testen mit `?lang=fr` im Browser.
5. Der bestehende Test "All German keys have English counterparts" prueft automatisch die Key-Vollstaendigkeit -- er greift auch fuer neue Sprachen.

## Impressum

Dieses Projekt unterliegt oesterreichischem Recht. Wenn du einen Fork erstellst und oeffentlich betreibst, musst du ein **eigenes Impressum** einsetzen, das den gesetzlichen Anforderungen deines Landes entspricht.

## Fragen?

Erstelle ein [Issue](../../issues) oder schreib an **info@malzi.me**.
