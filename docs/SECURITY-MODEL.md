# Sicherheits- und Datenmodell

Stand: 2026-10-09 · Skizze als Referenz für Entwicklung und Audit (kein vollständiges Threat Model)

## Systemüberblick

Statische Web-App auf Firebase Hosting (cybermobbing.web.app). Kein eigener
Server, keine Nutzerkonten, kein Login. Einzige beschreibbare Fläche ist die
Firebase Realtime Database (RTDB) für den anonymen View-Counter.

```
Browser ──(HTTPS, statisch)──> Firebase Hosting (Google Ireland Ltd)
Browser ──(HTTPS/WSS)────────> Firebase RTDB: /views (+1), /daily/<YYYY-MM-DD> (+1, lesend fürs Limit)
Browser ──(lokal)────────────> localStorage: cms_last_count (geschrieben), sim_lang (nur gelesen)
```

## Schützenswerte Güter (Assets)

1. **Firebase-Kostenbudget** — Blaze-Tarif, nutzungsbasiert (wichtigstes Asset).
2. **Integrität des View-Counters** — die Zahl ist öffentlich sichtbar.
3. **Verfügbarkeit und Ruf** der Lernressource (Einsatz vor Schulklassen).
4. **Integrität der ausgelieferten Seite** (kein Defacement/XSS).

Es gibt **keine personenbezogenen Daten**: keine Cookies, kein Tracking, keine
IP-Speicherung durch die App. Im localStorage schreibt die App nur
`cms_last_count` (Tagesmarke gegen Doppelzählung); der Wert bleibt auf dem
Endgerät und ist personenunabhängig (offengelegt im Impressum, CHANGELOG 1.1.3).
`sim_lang` wird nur gelesen und von der App nie geschrieben; das Impressum
spricht noch von einer gespeicherten Sprache (gemessen am 2026-10-08,
Entscheidung über den Text liegt beim Betreiber).

## Rollen und Vertrauensgrenzen

- **Anonymer Besucher** (einzige Anwendungsrolle): darf statische Inhalte laden,
  Zähler lesen und um exakt +1 erhöhen.
- **Betreiber**: Firebase-Konsole, GitHub, Deploy — außerhalb der Anwendung.
- Vertrauensgrenze: **Client ↔ RTDB-Regeln.** Alles im Browser ist manipulierbar;
  die einzige serverseitige Kontrolle sind die Regeln in `database.rules.json`.

## Gegenmaßnahmen (implementiert)

| Risiko | Maßnahme | Beleg |
|---|---|---|
| Counter-Manipulation (beliebige Werte schreiben) | RTDB-Regeln erlauben nur `+1`-Inkremente auf `/views` und `/daily/<datum>` (Datumsformat validiert), alles andere fail-closed | `database.rules.json` |
| Kosten-Explosion durch virale Last/Missbrauch | Tageslimit `DAILY_LIMIT` (ADR-0004, clientseitig) beendet das Zählen und zeigt die Limit-Seite; zusätzlich serverseitiger Deckel in den DB-Regeln (`/daily/<datum>` max. 5000); Cache-Header entlasten Hosting; Budget-Alert als letzte Grenze | `js/firebase-counter.js`, `database.rules.json`, `firebase.json` |
| Doppelzählung im Unterricht | localStorage-Tagesmarke, ein Zählimpuls pro Browser und UTC-Tag | `js/firebase-counter.js` |
| XSS / Fremdskripte | Strikte CSP (`default-src 'none'`, kein `'unsafe-inline'` für Skripte, ADR-0002), `X-Frame-Options: DENY`, `frame-ancestors 'none'` | `firebase.json` |
| Manipuliertes CDN-SDK | Firebase-SDK per SRI-Integritäts-Hash gepinnt | `index.html` |
| Secrets im Repo | `js/config.js` ist gitignored; `config.example.js` enthält nur Platzhalter; Secret-Scan in CI | `.gitignore`, CI |
| Dateien auf der Live-Seite, die dort nicht hingehören | `hosting.ignore` schließt alles außer der Seite aus; die Sperre `scripts/deploy-files.js` (läuft als `hosting.predeploy`) bricht jeden Deploy ab, dessen Dateiliste etwas anderes enthält; `scripts/verify-live.sh` prüft nach dem Deploy, dass versteckte Ordner, Doku, Tests und Werkzeugdateien nicht abrufbar sind | `firebase.json`, `docs/RUNBOOK.md` |
| Ausfall des Zählers hält die Simulation auf | Das Firebase-SDK lädt als Letztes und verzögert; ohne SDK oder ohne `js/config.js` gibt es keinen Zähler, die Simulation startet trotzdem | `index.html`, `js/firebase-counter.js`, Ablauftest |

Hinweis: Der Firebase-`apiKey` in `config.js` ist per Design ein öffentlicher
Identifikator, kein Geheimnis — die Zugriffskontrolle leisten die RTDB-Regeln.
Er wird trotzdem nicht committet, damit Forks zwingend ihr eigenes Projekt
konfigurieren.

## Vorfälle

**2026-07-16 bis zur Auslieferung von v2.0.0: versteckte Ordner öffentlich abrufbar.**
Das Muster `"**/.*"` in `hosting.ignore` trifft nur Einträge, deren letzter
Namensteil mit einem Punkt beginnt, nicht die Dateien in Punkt-Ordnern. Die
Live-Seite lieferte deshalb `.git/` (Verlauf samt lokaler Stände),
`.claude/settings.local.json` (lokale Befehlsfreigaben, mit Heimpfaden) und
`.github/` aus, dazu Doku, Tests und Skripte. Gefunden im Audit vom 2026-10-08
(SEC-2026-10-08-01), an der Live-Seite nachgemessen am 2026-10-09 00:02 Uhr
(je HTTP 200). Zugangsdaten wurden in diesen Dateien nicht gefunden (gitleaks
über beide Dateien und über die Historie ohne Fund; `.git/config` ohne
eingebettete Zugangsdaten); das Repository ist öffentlich, `js/config.js` war
nie Teil davon. Behoben mit v2.0.0: Ausschlussliste, Sperre vor dem Deploy,
Prüfung nach dem Deploy (siehe Tabelle oben). Offen: Die früheren
Hosting-Releases enthalten die Dateien weiter, siehe `docs/RUNBOOK.md`, Rollback.

## Bewusst akzeptierte Risiken

| Risiko | Begründung der Akzeptanz | Owner | Überprüfung |
|---|---|---|---|
| Skriptgesteuertes, langsames Aufblasen des Counters (+1-Schleife) | Kein App Check / keine Auth (ADR-0003, DSGVO + Aufwand); Schaden begrenzt: falsche Anzeigezahl, Kosten durch DAILY_LIMIT gedeckelt | Betreiber | beim nächsten LANGAUDIT |
| Keine IP-Rate-Limits | ~200 Schüler:innen hinter einer Schul-NAT-IP wären sonst ausgesperrt (ADR-0003) | Betreiber | beim nächsten LANGAUDIT |
| CSP-Konsolen-Lärm durch Firebase-IFRAME-Transport | Funktional folgenlos; `'unsafe-inline'` wäre schlechter (ADR-0002) | Betreiber | bei Firebase-SDK-Update |

## Aufbewahrung und Löschung

- RTDB enthält ausschließlich aggregierte Zahlen (`/views`, `/daily/<datum>`).
- `/daily`-Einträge wachsen um einen Schlüssel pro Tag; sie können gefahrlos
  gelöscht werden, sobald sie älter als der aktuelle Tag sind (siehe RUNBOOK).
- localStorage-Werte löscht der Browser des Besuchers (kein Server-Bezug).

## Externe Kontrollen (nicht aus dem Repo prüfbar)

- Google-Cloud-**Budget-Alert** für das Firebase-Projekt.
- GitHub: Branch Protection, Secret Scanning + Push Protection, 2FA, Dependabot.
- Status dieser Kontrollen: siehe docs/VERIFICATION.md (extern zu verifizieren).
