# Verifikationsmatrix

Bindeglied zu KURZAUDIT/LANGAUDIT: je Anforderung der Nachweisweg.
Status „offen" ist nur während der Umsetzung zulässig und blockiert die
Definition of Done (Stufe B).

Toolchain der Nachweise: Node v24.13.0 / npm 11.6.2 · ESLint 10.7.0 ·
Playwright 1.61.1 · gitleaks 8.30.1 · geprüfter Stand: Commit `d801143`.

| Anforderung | Evidenz / Befehl | Ergebnis |
|---|---|---|
| Frischer Clone lauffähig (Setup) | `git clone … && npm ci && npm run lint && npm run test && npm run test:e2e` in leerem Verzeichnis | grün, 2026-07-16, Commit `d801143` (npm ci: 0 Vulnerabilities; alle Folge-Checks grün) |
| Lint | `npm run lint` (ESLint + Prettier-Check) | grün, 2026-07-16, Exit 0 |
| Unit-Tests (QUnit, headless) | `npm run test` | grün: 1723/1723 Assertions, 0 failed, keine Page-Errors |
| E2E-Test kritischster Nutzerfluss + a11y (axe-core, WCAG 2.x A/AA) | `npm run test:e2e` (tastaturgesteuert, hermetisch ohne Produktions-Firebase) | grün: alle Checks bestanden (Start-Scan, Impressum Enter/Escape, Start, Szenenwechsel, Pause/Resume, Volllauf, CTA-Scan, CTA-Bedienung) |
| Secret-Scan | `gitleaks git --redact .` (gesamte Historie) + CI-Job `secret-scan` | lokal grün, 2026-07-16: „no leaks found" (gitleaks 8.30.1); CI siehe Zeile CI-Lauf |
| Dependency-Audit | `npm audit --audit-level=high` (Root und scripts/video-export) + CI-Job `dependency-audit` | grün, 2026-07-16: 0 Vulnerabilities in beiden Verzeichnissen |
| CI-Lauf grün | GitHub Actions Workflow `ci` (.github/workflows/ci.yml) | grün, 2026-07-16: Run 29518803296 (push auf main, alle 3 Jobs success) — github.com/malziland/cybermobbing-simulator/actions/runs/29518803296 |
| Rollback-Probe | worktree-Checkout v1.1.5, Setup + Suite dort; Details docs/RUNBOOK.md | durchgeführt 2026-07-16; Suite läuft; Fund: setup.sh-CDN-Verrottung → behoben (Commit `422aa13`) |
| Tastatur-Smoketest (UI-Profil) | Prozedur in docs/RUNBOOK.md; automatisiert als Teil von `npm run test:e2e` (echte Tastatur-Events) | bestanden (automatisiert), 2026-07-16; Empfehlung: gelegentlich manuell auf echtem Gerät wiederholen |
| Reproduzierbarer Stand | Lockfiles committet (Root + video-export), Node gepinnt (`.nvmrc`, `engines`), CDN-Skripte SRI-gepinnt, CI-Actions SHA-gepinnt | erfüllt, 2026-07-16 |
| Release v1.2.0 deployt | annotierter Tag `v1.2.0`, `npm run deploy`, Live-Check von außen (curl) | grün, 2026-07-16: Live-HTML lädt SDK 12.16.0, CSS enthält AA-Farben, Cache-Stempel frisch, HTTP 200 |

## Externe Kontrollen (außerhalb des Repos)

| Kontrolle | Status | Verifiziert am / wie |
|---|---|---|
| Branch Protection auf `main` inkl. Required Checks | aktiv | 2026-07-16 per GitHub-API gesetzt: Required Checks `lint-and-test`, `secret-scan`, `dependency-audit`; Force-Push und Löschen blockiert. Bewusste Solo-Ausnahme: Admin darf direkt pushen (`enforce_admins: false`), sonst wäre der Arbeitsfluss ohne PRs blockiert |
| GitHub Secret Scanning + Push Protection | aktiv | 2026-07-16 per API verifiziert (war bereits aktiv — GitHub-Standard für öffentliche Repos) |
| 2FA auf GitHub-Account | offen (Betreiber) | per API mit diesem Token nicht auslesbar; Check: github.com/settings/security → „Two-factor authentication" |
| Dependabot-Alerts + automatische Sicherheits-Updates | aktiv | 2026-07-16 per API aktiviert (`vulnerability-alerts`, `automated-security-fixes`) |
| Google-Cloud-Budget-Alert fürs Firebase-Projekt | aktiv | 2026-07-16 per gcloud verifiziert: Budget „Firebase Project cybermobbing", 25 €/Monat, E-Mail-Warnungen bei 50/90/100 % (bestand bereits; versehentlich angelegtes Duplikat wieder entfernt) |
