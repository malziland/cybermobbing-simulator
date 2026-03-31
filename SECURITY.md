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
- There is **no server-side rate limiting** on the view counter. This is mitigated by a daily limit enforced in the database rules.
