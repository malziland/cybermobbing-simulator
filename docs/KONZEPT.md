# Konzept: Cybermobbing-Simulation auf den Familien-Standard heben

Stand: 2026-07-16 · Status: **Entwurf zur Freigabe** (noch nichts umgesetzt)
Bezug: Prompt-Familie PROJEKTSTART 1.1.1 / CHANGE DELIVERY 1.1 / KURZAUDIT 2026.11 / LANGAUDIT 2026.11

---

## 1. Worum es geht

Die Prompt-Familie beschreibt, wie ein Softwareprojekt „ordentlich aufgestellt" aussieht:
nachvollziehbar (jede Änderung dokumentiert), reproduzierbar (jeder kann es bauen),
prüfbar (Tests laufen automatisch) und rücksetzbar (alter Stand jederzeit wiederherstellbar).

Die Cybermobbing-Simulation ist ein **bestehendes, live laufendes Projekt**. Dafür sieht
PROJEKTSTART ausdrücklich den **Lückenplan** vor: Es wird nichts neu aufgesetzt oder
umgebaut — es wird nur ergänzt, was zum Standard fehlt. Alltagsanalogie: kein Hausumbau,
sondern ein Nachrüsten von Rauchmeldern, Grundriss-Plan und Wartungsheft.

Danach gilt der normale Lebenszyklus der Familie:

- Jede Änderung läuft künftig nach **CHANGE DELIVERY** (kleiner Schnitt, Beweis-Befehle, Doku-Pflege).
- Zwischendurch **KURZAUDIT** (schnelle Prüfung, ändert nichts).
- Vor größeren Releases **LANGAUDIT** (gründliche Prüfung als Release-Tor).

---

## 2. Einordnung (Phase 0 aus PROJEKTSTART)

| Frage | Antwort | Quelle |
|---|---|---|
| Zweck | Interaktive 120-Sekunden-Simulation, die zeigt, wie Cybermobbing viral geht; für Schulworkshops | README |
| Projektart | Statische Web-App (HTML/CSS/Vanilla-JS, kein Build-Schritt) + isoliertes lokales Werkzeug (Video-Export) | Repo |
| Aktives Profil | **UI** (Weboberfläche). Kein SERVICE_API-Profil: Es gibt keinen eigenen Server; einziger Backend-Kontakt ist die Firebase Realtime Database für den View-Counter, abgesichert über `database.rules.json` | Repo |
| Stack | Vanilla JS, Firebase Hosting + Realtime Database (Blaze), QUnit-Tests im Browser | Repo |
| Deployment | `npm run deploy` → Firebase Hosting (cybermobbing.web.app) | package.json |
| Open Source? | Ja, MIT-Lizenz, GitHub: malziland/cybermobbing-simulator | LICENSE, Remote |
| Kritikalität / Daten | Produktiv und öffentlich erreichbar; **keine personenbezogenen Daten** (nur aggregierter Zähler + zwei localStorage-Werte ohne Personenbezug) | CHANGELOG 1.1.3 |
| Team / Lebensdauer | Solo (Christoph Krieger), längerfristig im Einsatz | — |
| Doku-Sprache | Deutsch — bestehende Konvention (README, CHANGELOG), wird beibehalten | Repo |

**Ausbaustufe: STANDARD.**
Begründung: MINIMAL ist laut PROJEKTSTART für öffentlich produktive Projekte nicht zulässig.
ENTERPRISE (SBOM, signierte Artefakte, CODEOWNERS …) wäre für ein Solo-Bildungsprojekt
Over-Engineering — und Over-Engineering ist laut Familie ausdrücklich ein Fehler.

**Feste Projekt-Leitplanken** (bereits früher entschieden, werden im Zuge des Konzepts
als ADRs schriftlich festgehalten):

- Kein Firebase App Check, keine anonyme Authentifizierung (DSGVO / Praxiserfahrung).
- `DAILY_LIMIT = 5000` ist ein bewusster Kosten-Deckel, kein Provisorium.
- CSP erlaubt `firebaseio.com` in `script-src` (Long-Polling-Fallback); der dadurch
  entstehende Konsolen-Lärm ist akzeptiert, **kein** `'unsafe-inline'`.
- Keine IP-Rate-Limits (200 Schüler hinter einer NAT-IP).
- Keine Querverlinkung auf malziland.at oder malzi.me.

---

## 3. Bestandsaufnahme: Was ist schon da, was fehlt

### Schon vorhanden (bleibt unangetastet)

| Standard-Anforderung | Ist-Zustand |
|---|---|
| Git + Historie | ✓ Saubere Historie, Conventional-Commits-Stil |
| Versionierung + Tags | ✓ SemVer v1.0.0–v1.1.5 (aber: Tag-Praxis uneinheitlich, siehe Lücken) |
| CHANGELOG | ✓ Keep-a-Changelog-Format, gepflegt |
| README | ✓ Zweck, Setup, Architektur, Lizenzhinweise |
| LICENSE / SECURITY.md / CONTRIBUTING.md | ✓ vorhanden |
| .gitignore, Secrets außerhalb des Repos | ✓ `js/config.js` ignoriert, `config.example.js` als Vorlage |
| Tests | ✓ 6 QUnit-Testdateien — aber nur manuell im Browser startbar |
| Issue-Templates / Funding | ✓ `.github/` vorhanden |

### Lücken gegenüber STANDARD (Definition of Done, Stufe B)

| Nr. | Lücke | Warum relevant (Alltagsanalogie) |
|---|---|---|
| L1 | Kein Task-Einstiegspunkt mit `lint` / `test`; Tests nur manuell im Browser | „Werkstatt ohne Prüfstand": niemand kann mit einem Befehl prüfen, ob alles heil ist |
| L2 | Kein Linter/Formatter, kein `.editorconfig` | Rechtschreibprüfung für Code — findet Tippfehler, bevor sie live gehen |
| L3 | Keine CI (kein `.github/workflows/`) | TÜV bei jedem Einreichen: GitHub prüft automatisch jeden Stand |
| L4 | Kein Secret-Scan, kein Dependency-Audit | Automatischer Wachhund gegen versehentlich eingecheckte Schlüssel / bekannte Sicherheitslücken in Paketen |
| L5 | Kein `docs/`-Fundament: ADRs, SECURITY-MODEL, RUNBOOK, VERIFICATION fehlen | Das Wissen (CSP-Entscheidung, Kosten-Deckel, Deploy-Weg) steckt nur in Chats und Köpfen, nicht im Projekt |
| L6 | Kein AGENTS.md | Spickzettel für KI-Werkzeuge: exakte Befehle + Projektregeln, damit kein Agent „gut gemeinte" verbotene Vorschläge macht (App Check etc.) |
| L7 | UI-Profil-Pflichten offen: kein End-to-End-Test, kein automatischer Accessibility-Check, kein dokumentierter Tastatur-Smoketest | Der wichtigste Nutzerfluss (Simulation starten → läuft → Hilfsangebote erscheinen) wird nie automatisch geprüft |
| L8 | Rollback nie tatsächlich geprobt + dokumentiert; Tag-Praxis uneinheitlich (v1.0.0 annotiert, v1.1.5 „leicht") | Feuerwehrübung: Rückweg einmal wirklich gehen, nicht nur beschreiben |
| L9 | Keine Toolchain-Pinnung (Node-Version) | Damit es morgen mit derselben Werkzeug-Version läuft wie heute |
| L10 | `scripts/video-export/` ist unversioniert (untracked) | Das Werkzeug existiert nur auf diesem einen Mac; Repo-Stand ≠ Realität |
| L11 | Kleinfehler: `package.json` nennt `…/cybermobbing-simulation`, echtes Remote ist `…/cybermobbing-simulator` | Irreführende Doku ist im Audit ein eigenes Finding |

Nicht anwendbar (mit Begründung, wie der Standard es verlangt):

- **`build`-Verb**: entfällt — bewusst kein Build-Schritt (README-Satz genügt).
- **`docs/FLAGS.md`**: entfällt — es gibt keine Feature-Flags; `DAILY_LIMIT` ist Konfiguration, kein Flag. Ein Begründungssatz kommt in ADR-0001.
- **Compose / lokale Dienste**: entfällt — kein lokaler Dienst nötig; lokale Vorschau über Firebase-Emulator bzw. simplen HTTP-Server, wird im README dokumentiert.

---

## 4. Der Lückenplan (Umsetzung in 6 Paketen)

Reihenfolge ist Absicht: erst Wissen sichern (A), dann Prüfstand bauen (B), dann
automatisieren (C), dann Pflichten des UI-Profils (D), dann Rückweg proben (E), dann Rest (F).
Jedes Paket = eigene, kleine Commits nach CHANGE-DELIVERY-Disziplin; nach jedem Paket ist
das Projekt in einem sauberen, deploybaren Zustand.

### Paket A — Doku-Fundament (kein Code-Risiko) · Aufwand: S–M

- `docs/adr/ADR-0001-projekt-einordnung.md`: Ausbaustufe STANDARD, Profil UI,
  Versionsstrategie (SemVer), Doku-Sprache Deutsch, „kein Build-Schritt", „keine Flags".
- Weitere kurze ADRs für die bestehenden Grundsatzentscheidungen:
  CSP/firebaseio (aus CHANGELOG 1.1.1/1.1.2 destilliert), kein App Check / keine Anon-Auth,
  DAILY_LIMIT als Kosten-Deckel.
- `docs/SECURITY-MODEL.md` (Pflicht, da öffentlich + persistente Daten): Was ist schützenswert
  (Counter-Integrität, Firebase-Kosten, Ruf des Bildungsangebots), wer greift an
  (Scherzkekse, Bots), was fangen wir ab (DB-Regeln, Tageslimit, CSP), welche Risiken
  akzeptieren wir bewusst (keine IP-Limits, kein App Check) — inkl. Privacy-Absatz
  (keine PII, localStorage-Transparenz aus CHANGELOG 1.1.3).
- `docs/RUNBOOK.md`: Deploy-Weg (`npm run deploy` inkl. Cache-Bust), Rollback-Weg,
  „Counter kaputt — was tun"-Abschnitt (CSP-Symptome aus CHANGELOG).
- `docs/VERIFICATION.md`: Nachweis-Tabelle, anfangs mit Status „offen" je Zeile —
  wird durch Pakete B–E grün.
- `AGENTS.md` (max. ~60 Zeilen): exakte Befehle + die Leitplanken aus Abschnitt 2;
  `CLAUDE.md` als Zweizeiler-Verweis darauf.

### Paket B — Werkzeugkette / Prüfstand lokal · Aufwand: M

- `.editorconfig` + ESLint (Browser-Globals, kein Framework) + Prettier; `npm run lint`.
- Headless-Testlauf: kleines Node-Skript öffnet `tests/test-runner.html` unsichtbar
  per Playwright (dasselbe Werkzeug wie im Video-Export — nichts Neues lernen) und
  gibt bestanden/durchgefallen zurück → `npm run test`. Die QUnit-Tests selbst bleiben wie sie sind.
- `.nvmrc` (Node-Version festnageln) + `engines` in package.json.
- `npm run dev` für lokale Vorschau (Firebase Hosting-Emulator).
- Erst-Lauf: Lint-Findings sichten; **nur triviale Auto-Fixes** (Formatierung) übernehmen,
  alles Inhaltliche wird gemeldet statt still mitgefixt.

### Paket C — CI auf GitHub Actions · Aufwand: S–M

- Ein Workflow bei jedem Push/PR: `lint` → `test` (headless) → Secret-Scan (gitleaks)
  → `npm audit` für `scripts/video-export/` (das einzige npm-Teilprojekt mit Abhängigkeiten).
- Härtung nach Standard: minimale Token-Rechte, Actions auf Commit-SHA gepinnt,
  Cache-Schlüssel mit Lockfile-Hash.
- Dependabot-Konfiguration (gruppierte Minor/Patch-Updates, Major einzeln) —
  betrifft praktisch nur Playwright und die GitHub-Actions selbst.
- Gilt erst als fertig, wenn ein Lauf auf GitHub **tatsächlich grün** war.

### Paket D — UI-Profil-Pflichten · Aufwand: M–L (abhängig von Entscheidung 2)

- **1 End-to-End-Test** (Playwright) für den kritischsten Nutzerfluss:
  Seite lädt → Start klicken → Simulation läuft an → Phasenwechsel passiert →
  (im Zeitraffer) Finale mit Hilfsangeboten erscheint. Dafür ein winziger, nur
  über URL-Parameter aktivierbarer Test-Zeitraffer im Timer-Modul (Entscheidung 3).
- **Automatischer Accessibility-Check** (axe-core) für Startbildschirm und
  Hilfsangebote-Ansicht, eingehängt in den E2E-Lauf.
- **Dokumentierter Tastatur-Smoketest** (halbe Seite im RUNBOOK): einmal manuell
  durchgehen, Ergebnis festhalten.

### Paket E — Release- und Rollback-Mechanik · Aufwand: S

- Rollback-Probe **tatsächlich durchführen**: v1.1.5 in einem temporären
  git-worktree auschecken, dort Setup + Tests laufen lassen, Ergebnis in
  RUNBOOK + VERIFICATION.md festhalten, worktree entfernen. Historie bleibt unberührt.
- Tag-Konvention vereinheitlichen: ab jetzt annotierte Tags; Hinweis in AGENTS.md/RUNBOOK.
- Hosting-Rollback-Weg dokumentieren (Firebase Hosting hält alte Releases vor;
  Rollback per Konsole oder erneutem Deploy eines Tags).

### Paket F — Aufräumen · Aufwand: S

- `scripts/video-export/` committen (Entscheidung 1): nur Quellcode, README,
  package.json + Lockfile — `node_modules/` und `output/` bleiben per vorhandener
  `.gitignore` draußen. Hosting-Ausschluss in firebase.json existiert bereits.
- Repo-URL in `package.json` korrigieren (`cybermobbing-simulator`).
- README ergänzen: neue Befehle (`lint`, `test`, `dev`), Hinweis „kein Build-Schritt = kein `build`-Verb".
- CHANGELOG-Eintrag; Abschluss als Version **v1.2.0** taggen (nur nach Freigabe, wie immer).

---

## 5. Entscheidungspunkte (Empfehlung jeweils zuerst)

| # | Frage | Empfehlung | Alternative |
|---|---|---|---|
| 1 | `video-export` ins Repo? | **Ja** — Werkzeug ist sonst nur auf einem Rechner; Ausschlüsse existieren schon | Draußen lassen (dann bleibt es unversioniert und taucht in jedem `git status` auf) |
| 2 | Accessibility-Ziel | **WCAG 2.2 AA für Startbildschirm, Bedienelemente (Pause etc.) und Hilfsangebote; die simulierten App-Szenen als dokumentierte Ausnahme** (sie ahmen bewusst echte App-Optik nach — volle AA würde die Didaktik verwässern); als ADR festhalten | Volle AA für alles (Aufwand L–XL, fraglicher Nutzen) |
| 3 | Test-Zeitraffer im Timer-Code | **Ja** — winziger Schalter, nur per URL-Parameter, Produktverhalten unverändert; ohne ihn dauert jeder E2E-Lauf 2+ Minuten | E2E testet nur Start + ersten Phasenwechsel (schwächere Aussage, kein Produkteingriff) |
| 4 | Umfang gesamt | **Alle Pakete A–F** (= Definition of Done STANDARD erreichbar) | Nur A–C (Fundament + CI); D–F später — dann bleibt die DoD offen und VERIFICATION.md zeigt „offen"-Zeilen |

„Entscheide du" ist überall eine gültige Antwort — dann gelten die Empfehlungen und
werden mit Begründung in ADR-0001 festgehalten.

---

## 6. Externe Kontrollen (kann nur der Betreiber setzen — GitHub-Weboberfläche)

- [ ] Branch Protection auf `main`; CI-Checks als Pflicht vor dem Merge.
- [ ] Secret Scanning + Push Protection im Repo aktivieren (GitHub → Settings → Security).
- [ ] 2FA für den GitHub-Account aktiv (vermutlich schon — bitte einmal bestätigen).
- [ ] Dependabot-Alerts aktivieren (die Konfigurationsdatei liefert Paket C).

Aufwand: ~15 Minuten Klickarbeit, Anleitung liefere ich bei Paket C mit.

---

## 7. Was bewusst NICHT gemacht wird

- Kein Build-Schritt, kein Framework, kein Umbau der Architektur — „kein Build-Step nötig" ist ein Feature.
- Kein Firebase App Check, keine anonyme Auth, keine IP-Rate-Limits (Leitplanken, s. o.).
- Kein ENTERPRISE-Programm: keine SBOM, keine signierten Artefakte, kein CODEOWNERS.
- Keine kosmetischen Rundumschläge an bestehendem Code; Lint-Findings inhaltlicher Art
  werden gemeldet, nicht still gefixt.

---

## 8. Aufwand und Ablauf

| Paket | Aufwand | Wer |
|---|---|---|
| A Doku-Fundament | S–M (~2–3 h) | Claude schreibt, Christoph liest gegen |
| B Werkzeugkette | M (~2–4 h) | Claude |
| C CI | S–M (~2–3 h) | Claude + 1 grüner Lauf auf GitHub |
| D UI-Pflichten | M–L (~3–6 h) | Claude; Tastatur-Smoketest gemeinsam |
| E Rollback-Probe | S (~1 h) | Claude |
| F Aufräumen | S (~1 h) | Claude |
| Externe Kontrollen | ~15 min | Christoph (GitHub-Einstellungen) |

Gesamt grob **1,5–2 Arbeitstage**, verteilt auf mehrere Sitzungen möglich — jedes Paket
ist einzeln abschließbar und hinterlässt einen sauberen Stand.

**Nach Abschluss:** einmal KURZAUDIT auf dem neuen Stand laufen lassen (prüft, ändert
nichts) — dessen Findings wären dann die erste echte CHANGE-DELIVERY-Runde nach neuem
Prozess. Vor dem nächsten inhaltlichen Release: LANGAUDIT als Release-Tor.
