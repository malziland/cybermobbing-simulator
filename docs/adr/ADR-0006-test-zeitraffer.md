# ADR-0006: Test-Zeitraffer über URL-Parameter ?testspeed=N

Status: Akzeptiert · Datum: 2026-07-16

## Kontext

Die Simulation dauert real 120 Sekunden. Ein End-to-End-Test des kritischsten
Nutzerflusses (Start → Szenen laufen → Hilfsangebote erscheinen) würde damit
jeden CI-Lauf um über zwei Minuten verlängern und wäre anfällig für Timeouts.

## Entscheidung

Ein minimaler Zeitraffer-Schalter im bestehenden Timer-System (`js/audio.js`):
`?testspeed=N` (ganzzahlig, 1–60) teilt alle `simTimeout`-Verzögerungen und
das Fortschrittsbalken-Intervall durch N. Ohne Parameter (oder bei ungültigen
Werten) gilt N=1 — das Produktionsverhalten ist unverändert. Die simulierte
Handy-Uhr läuft bewusst weiter in Echtzeit (rein kosmetisch, im Test irrelevant).

## Konsequenzen

- `npm run test:e2e` fährt die volle Simulation in ~12 s durch (`testspeed=10`).
- Der Parameter ist undokumentierte Testschnittstelle, kein Feature; er wird
  auf der Startseite nicht beworben und in AGENTS.md als Testschalter geführt.
- Wer den Parameter von Hand setzt, sieht die Simulation schneller — kein
  Schaden, keine Kosten (der View-Counter zählt unabhängig davon maximal
  einmal pro Browser und Tag).
