# ADR-0003: Kein Firebase App Check, keine anonyme Authentifizierung

Status: Akzeptiert · Datum: 2026-07-16 (Entscheidung stammt aus früheren Arbeitsphasen)

## Kontext

Zur Absicherung des View-Counters wurden Firebase App Check und anonyme
Authentifizierung geprüft und verworfen.

## Entscheidung

- **Kein App Check:** In der Praxis unverhältnismäßig fehleranfällig für dieses
  Projekt (erheblicher Einrichtungs- und Wartungsaufwand, Ausfälle beim Setup);
  der Schutzgewinn für einen anonymen Zähler rechtfertigt das nicht.
- **Keine anonyme Authentifizierung:** Legt pseudonyme Nutzer-Datensätze in
  Firebase an — das widerspricht dem Datenschutz-Versprechen der Seite
  („keine personenbezogenen Daten", DSGVO-Minimierung für die Zielgruppe
  Schüler:innen).
- **Keine IP-basierten Rate-Limits:** Workshops finden mit bis zu ~200
  Schüler:innen hinter einer einzigen Schul-NAT-IP statt; IP-Limits würden den
  Haupt-Anwendungsfall brechen.

## Konsequenzen

- Der Counter ist bewusst nur durch die RTDB-Regeln (+1-Inkremente) und das
  Tageslimit (ADR-0004) geschützt. Restrisiko „langsames Aufblasen der Zahl"
  wird akzeptiert (docs/SECURITY-MODEL.md).
- Diese Optionen bitte auch künftig nicht erneut vorschlagen, außer sich an
  den Rahmenbedingungen ändert etwas Grundsätzliches.
