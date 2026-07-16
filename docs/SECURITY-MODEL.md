# Sicherheits- und Datenmodell

Stand: 2026-07-16 · Skizze als Referenz für Entwicklung und Audit (kein vollständiges Threat Model)

## Systemüberblick

Statische Web-App auf Firebase Hosting (cybermobbing.web.app). Kein eigener
Server, keine Nutzerkonten, kein Login. Einzige beschreibbare Fläche ist die
Firebase Realtime Database (RTDB) für den anonymen View-Counter.

```
Browser ──(HTTPS, statisch)──> Firebase Hosting (Google Ireland Ltd)
Browser ──(HTTPS/WSS)────────> Firebase RTDB: /views (+1), /daily/<YYYY-MM-DD> (+1, lesend fürs Limit)
Browser ──(lokal)────────────> localStorage: sim_lang, cms_last_count
```

## Schützenswerte Güter (Assets)

1. **Firebase-Kostenbudget** — Blaze-Tarif, nutzungsbasiert (wichtigstes Asset).
2. **Integrität des View-Counters** — die Zahl ist öffentlich sichtbar.
3. **Verfügbarkeit und Ruf** der Lernressource (Einsatz vor Schulklassen).
4. **Integrität der ausgelieferten Seite** (kein Defacement/XSS).

Es gibt **keine personenbezogenen Daten**: keine Cookies, kein Tracking, keine
IP-Speicherung durch die App; die beiden localStorage-Werte (`sim_lang`,
`cms_last_count`) bleiben auf dem Endgerät und sind personenunabhängig
(offengelegt im Impressum, CHANGELOG 1.1.3).

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
| Kosten-Explosion durch virale Last/Missbrauch | Tageslimit `DAILY_LIMIT` (ADR-0004) beendet das Zählen und zeigt die Limit-Seite; Cache-Header entlasten Hosting | `js/firebase-counter.js`, `firebase.json` |
| Doppelzählung im Unterricht | localStorage-Tagesmarke, ein Zählimpuls pro Browser und UTC-Tag | `js/firebase-counter.js` |
| XSS / Fremdskripte | Strikte CSP (`default-src 'none'`, kein `'unsafe-inline'` für Skripte, ADR-0002), `X-Frame-Options: DENY`, `frame-ancestors 'none'` | `firebase.json` |
| Manipuliertes CDN-SDK | Firebase-SDK per SRI-Integritäts-Hash gepinnt | `index.html` |
| Secrets im Repo | `js/config.js` ist gitignored; `config.example.js` enthält nur Platzhalter; Secret-Scan in CI | `.gitignore`, CI |

Hinweis: Der Firebase-`apiKey` in `config.js` ist per Design ein öffentlicher
Identifikator, kein Geheimnis — die Zugriffskontrolle leisten die RTDB-Regeln.
Er wird trotzdem nicht committet, damit Forks zwingend ihr eigenes Projekt
konfigurieren.

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
