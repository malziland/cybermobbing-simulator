# Cybermobbing Simulation

Eine interaktive 120-Sekunden-Simulation, die zeigt, wie schnell Cybermobbing viral geht. Entwickelt fuer Workshops an Schulen.

**[Live-Demo](https://cybermobbing.web.app)**

![Screenshot](assets/screenshot.png)

## Was ist das?

Die Simulation durchlaeuft 5 Phasen -- von der ersten WhatsApp-Nachricht bis zum viralen TikTok-Video -- und zeigt in Echtzeit, wie sich Cybermobbing ausbreitet. Am Ende werden Hilfsangebote eingeblendet.

**Phasen:** WhatsApp -> Instagram -> TikTok -> Homescreen -> iMessage -> Hilfsangebote

Konzipiert fuer den Einsatz in Schulworkshops: pausierbar, diskutierbar, wirkungsvoll.

## Features

- 5 realistische App-Szenen (WhatsApp, Instagram, TikTok, Homescreen, iMessage)
- Pausierbar fuer Workshop-Diskussionen
- Ton-Regler: Ton aus/ein und Lautstaerke waehrend des Laufs (unten links, Taste M)
- Beamer-Ansicht fuer grosse Raeume: Handy, Bild und Nachrichten nebeneinander in grosser Schrift, jederzeit umschaltbar
- View-Counter (Firebase Realtime Database)
- Teilen-Button
- Mehrsprachig (i18n: Deutsch + Englisch)
- Kein Build-Step noetig

## Beamer-Ansicht

Fuer Beamer und grosse Raeume gibt es eine zweite Darstellung desselben Ablaufs:
links das Handy, in der Mitte das Bild der Szene, rechts die jeweils neuesten
Nachrichten in grosser Schrift. Hintergrund und Abwaegungen stehen in
`docs/adr/ADR-0007`.

- **Einschalten:** am Startbildschirm die Kachel „Beamer", der Link-Zusatz
  `?beamer=1`, oder waehrend des Laufs die Taste B bzw. die zwei Symbole unten
  rechts.
- **Umschalten ohne Sprung:** Beide Ansichten zeigen denselben Lauf.
- **Vollbild verwenden:** Die Ansicht passt sich jedem Fenster an (Aufloesung
  und Browser-Zoom aendern die Proportionen nicht), ein kleines Fenster ergibt
  aber ein kleines Bild.

## Live Demo

[https://cybermobbing.web.app](https://cybermobbing.web.app)

## Setup fuer Forks

1. Repository klonen
2. `bash setup.sh` -- laedt App-Icons herunter
3. `cp js/config.example.js js/config.js` -- Firebase-Konfiguration anpassen
4. Firebase-Projekt erstellen + Realtime Database aktivieren
5. `database.rules.json` deployen
6. `firebase deploy`

## Architektur

```
js/
  i18n.js              — Uebersetzungssystem
  audio.js             — Sound-Engine + pausierbares Timer-System
  helpers.js           — Avatar-System + UI-Helfer
  timer.js             — Fortschrittsbalken + Uhr
  stage.js             — Beamer-Ansicht (liest im Handy mit, zeigt gross an)
  config.js            — Firebase-Konfiguration (nicht im Repo)
  firebase-counter.js  — View-Counter + Tageslimit
  main.js              — Entry Point + Share
  scenes/
    p1-whatsapp.js     — Phase 1: WhatsApp (0–28s)
    p2-instagram.js    — Phase 2: Instagram (28–56s)
    p3-tiktok.js       — Phase 3: TikTok (56–78s)
    p4-homescreen.js   — Phase 4: Homescreen (78–93s)
    p4b-messages.js    — Phase 4b: iMessage (93–112s)
    p5-finale.js       — Phase 5: Finale (112–120s)
```

## Neue Sprache hinzufuegen

1. In `js/i18n.js` einen neuen Block unter `TRANSLATIONS` hinzufuegen (z.B. `fr: { ... }`)
2. Alle Keys aus `de` uebersetzen -- Charakter-Stimmen beibehalten (z.B. Sara schreibt in CAPS)
3. URL-Parameter `?lang=fr` verwenden oder `navigator.language` wird automatisch erkannt
4. Meta-Tags in `index.html` manuell uebersetzen (SEO)
5. Impressum muss vom jeweiligen Betreiber ersetzt werden

## Entwicklung & Tests

Fuer die Simulation selbst ist kein Build-Schritt noetig (bewusste Entscheidung,
siehe `docs/adr/ADR-0001` — ein `build`-Kommando entfaellt daher). Die
Entwicklungswerkzeuge brauchen Node 24 (`.nvmrc`):

```bash
npm ci                # Werkzeuge installieren
npm run lint          # ESLint + Prettier
npm run test          # QUnit-Suite headless (Playwright)
npm run test:e2e      # End-to-End + Accessibility (axe-core)
npm run dev           # lokale Vorschau (Firebase-Hosting-Emulator)
```

Alternativ ohne npm: `tests/test-runner.html` im Browser oeffnen (QUnit).
Weitere Doku: `AGENTS.md` (Befehle & Leitplanken), `docs/RUNBOOK.md` (Betrieb,
Deploy, Rollback), `docs/adr/` (Entscheidungen), `docs/VERIFICATION.md`
(Nachweise).

## Impressum

Das Impressum in `index.html` ist betreiberspezifisch (oesterreichisches Recht). Forks **muessen** es durch ihr eigenes ersetzen.

## App-Icons

Die Icons in `assets/icons/` sind Markenzeichen der jeweiligen Unternehmen (Meta, ByteDance, Snap, Apple). Sie werden nur zu Bildungszwecken verwendet (Paragraph 42f UrhG). Sie sind **nicht** unter der MIT-Lizenz lizenziert und werden ueber `setup.sh` heruntergeladen, nicht im Repository verteilt.

## Musik

`assets/bgm.mp3` wurde mit Suno Pro erstellt (kommerzielle Nutzung erlaubt).

## Credits

Konzept & Umsetzung: [Christoph Krieger](https://www.linkedin.com/in/christophkrieger/)

malziland - learning | training | consulting e.U. — Neuhofen an der Krems, Oesterreich

## Lizenz

MIT -- siehe [LICENSE](LICENSE)
