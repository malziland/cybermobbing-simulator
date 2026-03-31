# Changelog

Alle relevanten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) und folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.1.0] - 2026-03-31

### Hinzugefügt
- Neue CTA-Seite (Szene 6) mit konfigurierbarer Helpline (Logo, Slogan, Links)
- Echtzeit-Uhr und heutiges Datum statt hardcoded 21:34
- Rat auf Draht Logo + Chatberatung-Link + weiterführende Infos auf der CTA-Seite
- Helpline-Konfiguration über config.js (Logo, Slogan, Links — Forks setzen eigene ein)
- Erweiterter Disclaimer (Markenrechte, keine Plattform-Verbindung, optionaler Genehmigungshinweis)
- Dynamische Posting-Zeitstempel in WhatsApp-Nachrichten

### Geändert
- Phone-Frame nutzt mehr Bildschirmfläche (88vh statt 82vh)
- Pause-Design überarbeitet: dezentes "II" unten, kein Pill-Button
- Disclaimer nur auf Start- und CTA-Seite sichtbar, nicht während Simulation
- Buttons auf CTA-Seite untereinander mit rotem Border
- Tageslimit von 1000 auf 5000 erhöht
- Homescreen-Notifications kompakter auf kleinen Screens (iPhone SE)

### Behoben
- Pause-Overlay war oben links statt zentriert (fehlende display:flex)
- Statusbar-Uhrzeit überlappte App-Header auf allen Szenen
- View-Counter zeigte nichts an (CSP blockierte wss:// WebSocket-Verbindungen)
- Root-URL hatte max-age:3600 statt no-store (Cache-Problem)
- Pause-Icon zeigte Emoji auf iOS statt Text
- App-Icons auf iPhone SE abgeschnitten
- Startseiten-Buttons überlappten auf kleinen Screens

## [1.0.0] - 2026-03-29

### Hinzugefügt
- Interaktive 120-Sekunden-Simulation mit 5 Szenen (WhatsApp, Instagram, TikTok, Homescreen, iMessage)
- Pausierbares Timer-System für Workshop-Einsatz
- Web Audio API Sound-Engine (App-spezifische Benachrichtigungstöne)
- Firebase Realtime Database View-Counter mit Tageslimit
- Mehrsprachigkeit (Deutsch + Englisch) via i18n-System
- Automatische Spracherkennung (URL-Parameter, localStorage, Browser-Sprache)
- Content Security Policy mit SRI-Hashes für externe Scripts
- Impressum-Modal im Phone-Frame-Design (DSGVO-konform)
- 84 Unit-Tests mit 1698 Assertions (QUnit)
- JSDoc-Dokumentation für alle Funktionen
- Open-Source-Dokumentation (README, CONTRIBUTING, SECURITY, LICENSE, CHANGELOG)
- Automatisches Cache-Busting bei Deploy (scripts/cache-bust.sh)
- Icon-Download-Script für Forks (setup.sh)
- GitHub Issue Templates, FUNDING.yml
