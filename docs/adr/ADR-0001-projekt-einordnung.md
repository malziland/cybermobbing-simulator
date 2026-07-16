# ADR-0001: Projekt-Einordnung und Ausbaustufe

Status: Akzeptiert · Datum: 2026-07-16

## Kontext

Das Projekt existiert seit v1.0.0 und läuft produktiv (cybermobbing.web.app). Es wird
nachträglich auf den Standard der Prompt-Familie PROJEKTSTART/CHANGE DELIVERY/KURZAUDIT/
LANGAUDIT gehoben (Lückenplan, siehe docs/KONZEPT.md). Diese ADR hält die
Phase-0-Entscheidungen fest.

## Entscheidung

- **Ausbaustufe: STANDARD.** Öffentlich produktiv → MINIMAL unzulässig; ENTERPRISE
  (SBOM, Signaturen, CODEOWNERS) wäre für ein Solo-Bildungsprojekt Over-Engineering.
- **Aktives Profil: UI.** Kein SERVICE_API-Profil: Es gibt keinen eigenen Server.
  Einziger Backend-Kontakt ist die Firebase Realtime Database (View-Counter),
  abgesichert allein über `database.rules.json`; diese Datei wird wie
  sicherheitsrelevanter Code behandelt.
- **Stack:** Vanilla JS ohne Build-Schritt (bewusstes Feature: Forks brauchen kein
  Node für den Betrieb). Das Task-Verb `build` entfällt deshalb; `run` = lokale
  Vorschau über den Firebase-Hosting-Emulator.
- **Versionierung:** SemVer mit annotierten Git-Tags (`git tag -a`). Frühere
  leichte Tags (z. B. v1.1.4, v1.1.5) bleiben unverändert stehen.
- **Sprachen:** Doku und CHANGELOG auf Deutsch (bestehende Konvention),
  Code-Kommentare und Commit-Messages auf Englisch (Conventional Commits).
- **Umgebungskapselung:** Toolchain-Pinning genügt (`.nvmrc`, `engines`,
  `package-lock.json`). Kein Dev-Container — Solo-Projekt, statische Site,
  keine Systemabhängigkeiten außer Node für die Dev-Werkzeuge.
- **Feature-Flags: keine.** `docs/FLAGS.md` entfällt. `DAILY_LIMIT` in
  `js/config.js` ist Betreiber-Konfiguration (Kosten-Deckel, ADR-0004),
  kein Feature-Flag.
- **Kritikalität/Datenklasse:** produktiv / keine sensiblen Daten. Es werden
  keine personenbezogenen Daten verarbeitet (nur aggregierte Zähler und zwei
  localStorage-Werte ohne Personenbezug, siehe docs/SECURITY-MODEL.md).

## Konsequenzen

- Definition of Done Stufe B gilt; Nachweise in docs/VERIFICATION.md.
- Jede spätere Abweichung (z. B. eigener Server, Auth, Build-Schritt) braucht
  eine neue ADR, bevor Code entsteht.
