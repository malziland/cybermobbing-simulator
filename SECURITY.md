# Security Policy

## Supported Versions

Only the latest version deployed at [cybermobbing.web.app](https://cybermobbing.web.app) is supported with security updates.

## Reporting a Vulnerability

- **Email**: info@malzi.me
- **Subject**: `[SECURITY] Cybermobbing Simulation`
- **Do NOT** create a public GitHub issue for security vulnerabilities.
- **Expected response time**: Within 72 hours.

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

## Scope

The following areas are in scope for security reports:

- Firebase Realtime Database rules
- Client-side JavaScript
- Hosting configuration (`firebase.json`)
- Content Security Policy

## Out of Scope

- Firebase infrastructure (report to [Google](https://www.google.com/about/appsecurity/))
- CDN availability (report to Google)
- Social engineering attacks
- Issues in forked or modified versions

## Recognition

Security researchers who responsibly disclose vulnerabilities will be credited in the README (with their permission).

## Known Limitations

- The **Firebase API key is intentionally public**. Security is enforced via Firebase Realtime Database rules, not by keeping the key secret.
- There is **no server-side rate limiting** on the view counter. The database rules only allow strict +1 increments and cap the daily counter at 5000 writes per day; the user-facing daily limit (`DAILY_LIMIT`) is enforced **client-side** and only stops honest clients. A scripted actor can still inflate the all-time counter slowly; cost exposure is bounded by the daily cap and a billing budget alert (accepted risk, see `docs/SECURITY-MODEL.md` and `docs/adr/ADR-0003`).
- **Console noise about blocked inline scripts** is expected and harmless. The Firebase Realtime Database SDK tries multiple long-polling transports; one of them injects inline `<script>` blocks into an iframe. That transport fails the CSP check (no `'unsafe-inline'`, content is per-request and cannot be hash-pinned) and the SDK silently falls back to the cross-origin `<script src="https://*.firebaseio.com/.lp?...">` transport that is allowed by CSP. Adding `'unsafe-inline'` to `script-src` would silence the log line but would also defeat the CSP's XSS protection, so the noise is accepted as the safer trade-off.
