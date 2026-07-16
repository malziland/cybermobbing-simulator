# Verifikationsmatrix

Bindeglied zu KURZAUDIT/LANGAUDIT: je Anforderung der Nachweisweg.
Status „offen" ist nur während der Umsetzung zulässig und blockiert die
Definition of Done (Stufe B).

| Anforderung | Evidenz / Befehl | Ergebnis |
|---|---|---|
| Frischer Clone lauffähig (Setup) | `git clone … && npm ci && npm run lint && npm run test` in leerem Verzeichnis | offen |
| Lint | `npm run lint` | offen |
| Unit-Tests (QUnit, headless) | `npm run test` | offen |
| E2E-Test kritischster Nutzerfluss + a11y-Check (axe-core) | `npm run test:e2e` | offen |
| Secret-Scan | `gitleaks detect` (lokal) + CI-Job `secret-scan` | offen |
| Dependency-Audit | `npm audit` (Root + scripts/video-export) + CI-Job `audit` | offen |
| CI-Lauf grün | GitHub Actions Workflow `ci` | offen |
| Rollback-Probe | worktree-Checkout des letzten Release-Tags, Setup + Tests dort, RUNBOOK-Abschnitt | offen |
| Tastatur-Smoketest (UI-Profil) | Prozedur in docs/RUNBOOK.md | offen |
| Reproduzierbarer Stand | Lockfiles committet, Node gepinnt (`.nvmrc`, `engines`) | offen |

## Externe Kontrollen (nur Betreiber, außerhalb des Repos)

| Kontrolle | Status | Verifiziert am / wie |
|---|---|---|
| Branch Protection auf `main` inkl. Required Checks | offen | — |
| GitHub Secret Scanning + Push Protection | offen | — |
| 2FA auf GitHub-Account | offen | — |
| Dependabot-Alerts aktiviert | offen | — |
| Google-Cloud-Budget-Alert fürs Firebase-Projekt | offen | — |
