# ADR-0002: CSP erlaubt firebaseio.com in script-src (Long-Polling-Fallback)

Status: Akzeptiert · Datum: 2026-04-19 (nachträglich als ADR festgehalten 2026-07-16)

## Kontext

Die Content Security Policy (firebase.json) ist bewusst strikt: kein
`'unsafe-inline'` für Skripte. Wenn die Firebase Realtime Database vom WebSocket
auf Long-Polling zurückfällt (Safari mit Extensions, restriktive Schulnetze),
lädt das SDK seine Antworten als `<script src="https://*.firebaseio.com/.lp?...">`.
Ohne Freigabe blieb der View-Counter auf `--` (Details: CHANGELOG 1.1.1).
Zusätzlich versucht ein IFRAME-Transport des SDK, Inline-Skripte zu schreiben —
diese scheitern erwartungsgemäß an der CSP und erzeugen Konsolen-Meldungen
(„Refused to execute a script (inline)", CHANGELOG 1.1.2).

## Entscheidung

- `https://*.firebaseio.com` ist in `script-src` zugelassen (nötig für den
  funktionierenden Long-Polling-Fallback).
- **Kein** `'unsafe-inline'` in `script-src` — der Konsolen-Lärm des
  IFRAME-Transports wird bewusst in Kauf genommen; das SDK fällt still auf den
  erlaubten Transport zurück, der Counter funktioniert.
- Die Firebase-SDK-Skripte von gstatic.com sind per SRI-Integritäts-Hash
  gepinnt (index.html).

## Konsequenzen

- Konsolen-Fehlermeldungen zum Inline-Script sind **kein Bug** — nicht „beheben",
  nicht `'unsafe-inline'` ergänzen (würde den XSS-Schutz aushebeln).
- Bei Firebase-SDK-Updates müssen die SRI-Hashes in index.html mit aktualisiert
  werden, sonst lädt das SDK nicht.
