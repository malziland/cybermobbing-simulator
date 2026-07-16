# ADR-0005: Accessibility-Ziel — AA für Rahmen-UI, dokumentierte Ausnahme für Szenen

Status: Akzeptiert · Datum: 2026-07-16

## Kontext

Das UI-Profil des Familien-Standards verlangt ein explizites Accessibility-Ziel
(Default WCAG 2.2 AA). Die Simulation besteht aus zwei sehr unterschiedlichen
Teilen: dem Rahmen-UI (Startbildschirm, Pause, Teilen, Impressum, Hilfsangebote)
und den simulierten App-Szenen (WhatsApp, Instagram, TikTok, Homescreen,
iMessage), die bewusst originalgetreue App-Optik nachahmen — inklusive kleiner
Schriften, geringer Kontraste und schnellen, zeitgesteuerten Abläufen. Das ist
didaktische Absicht: Die Szenen sollen echt wirken.

## Entscheidung

- **WCAG 2.2 AA gilt für das Rahmen-UI:** Startbildschirm, Start-/Teilen-/
  Pause-/Nochmal-Buttons, Impressum-Modal, Limit-Seite und die abschließende
  Hilfsangebote-Ansicht (CTA). Diese Flächen werden automatisiert (axe-core)
  und per Tastatur-Smoketest geprüft.
- **Die simulierten App-Szenen sind eine dokumentierte Ausnahme.** Sie sind
  nicht-interaktive, filmartige Darstellungen; ihre Optik ist Lehrinhalt.
  Kompensation: Die Simulation ist jederzeit pausierbar, und die didaktische
  Einbettung erfolgt moderiert im Workshop.

## Konsequenzen

- Automatisierte a11y-Checks laufen gegen Start- und CTA-Ansicht, nicht gegen
  die Szenen.
- Für einen späteren breiteren Einsatz außerhalb moderierter Workshops sollte
  eine Screenreader-Prüfung des Rahmen-UI ergänzt werden (offener Punkt in
  docs/VERIFICATION.md nicht blockierend, da Workshop-Kontext).
