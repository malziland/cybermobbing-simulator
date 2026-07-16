# ADR-0004: DAILY_LIMIT ist ein Kosten-Deckel, kein Provisorium

Status: Akzeptiert · Datum: 2026-07-16 (Entscheidung stammt aus früheren Arbeitsphasen)

## Kontext

Das Projekt läuft auf dem Firebase-Tarif „Blaze" (nutzungsbasierte Abrechnung).
Eine virale Verbreitung oder gezielter Missbrauch könnte unbegrenzte Kosten
verursachen. `DAILY_LIMIT` in `js/config.js` (produktiv: 5000) begrenzt die
Zahl der gezählten Simulationsstarts pro Tag; danach zeigt die Seite eine
didaktisch gestaltete Limit-Ansicht mit Countdown bis UTC-Mitternacht.

## Entscheidung

- `DAILY_LIMIT = 5000` ist eine bewusste betriebswirtschaftliche Obergrenze.
- Der Wert wird **nicht** „zur Entspannung" erhöht; Änderungen nur durch den
  Betreiber mit Kostenabschätzung.
- Ergänzend sollte im Firebase-/Google-Cloud-Konto ein Budget-Alert gesetzt
  sein (externe Kontrolle, nicht aus dem Repo prüfbar — siehe
  docs/VERIFICATION.md und SECURITY-MODEL).

## Konsequenzen

- Die Limit-Ansicht ist Teil des Produkts (didaktisch formuliert), kein
  Fehlerzustand.
- Das Limit zählt clientseitig geprüfte Starts; es ist Kostenschutz, keine
  Sicherheitsgrenze (siehe ADR-0003, SECURITY-MODEL).
