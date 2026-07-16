# Video-Export für die Cybermobbing-Simulation

Filmt die Simulation einmal sauber ab und speichert sie als MP4 (Hochformat 1080×1920, ~123 Sek inkl. Schlussbild). Audio = Hintergrundmusik **plus** alle Pling-/Tipp-Geräusche (die werden im Browser live erzeugt — deshalb der Umweg über BlackHole).

Das Skript ist isoliert, es ändert nichts an der bestehenden Simulation.

---

## Einmaliges Setup (~5 Min)

```bash
# 1. Tools via Homebrew
brew install ffmpeg switchaudio-osx blackhole-2ch

# 2. Mac einmal aus- und wieder einloggen (damit BlackHole als Audio-Gerät auftaucht)

# 3. Im Ordner scripts/video-export:
cd scripts/video-export
npm install
npx playwright install chromium
```

### Prüfen, ob BlackHole da ist

```bash
SwitchAudioSource -a | grep -i blackhole
# erwartete Ausgabe: BlackHole 2ch
```

---

## Video erzeugen

```bash
cd scripts/video-export
node export-video.js
```

Was passiert:

1. Skript schaltet System-Audio kurz auf BlackHole um (du hörst während der Aufnahme nichts).
2. Lokaler Mini-Webserver startet (Port 8765).
3. Chrome öffnet sich (im Hochformat 1080×1920), lädt die Simulation, klickt "Start".
4. ffmpeg fängt parallel den Ton von BlackHole ab.
5. Nach 123 Sek: Bild + Ton werden zu `output/cybermobbing-simulation.mp4` gemischt.
6. System-Audio wird wieder auf dein normales Ausgabegerät zurückgestellt.

**Wichtig während die Aufnahme läuft:** Chrome-Fenster nicht verschieben oder in den Hintergrund klicken — sonst werden Frames verzerrt.

---

## Häufige Stolperfallen

| Problem | Lösung |
|---|---|
| `BlackHole 2ch nicht gefunden` | `brew install blackhole-2ch`, dann ab- und einloggen. Mit `SwitchAudioSource -a` prüfen. |
| Aufnahme ist still | Während Setup System-Audio nicht auf BlackHole gestellt? Skript macht das automatisch — falls es abstürzt, im Apfelmenü → Systemeinstellungen → Ton → Ausgabe wieder auf Lautsprecher stellen. |
| Bildschirm geht in Schlaf während Aufnahme | Vorher: `caffeinate -d -t 200 &` ausführen (hält Display 200 Sek wach). |
| Chrome bekommt Fokus geklaut | Mac in Ruhe lassen während der 2 Min — nichts anklicken, nicht zwischen Apps wechseln. |
| Video-Datei zu groß | Im Skript `-crf 20` auf `-crf 24` ändern (schlechtere Qualität, ~halbe Dateigröße). |

---

## Was wird angefasst, was nicht

- **Angefasst:** nur dieser Ordner `scripts/video-export/`. Eigene `package.json`, eigenes `node_modules/`.
- **Nicht angefasst:** index.html, js/, css/, assets/, die Live-Simulation. Der Skript-Lauf läuft offline gegen einen lokalen Webserver, die Firebase-Counter werden nicht angesprochen (lokaler Server liefert `js/config.js` nicht aus — Firebase-Code wirft still einen Fehler und macht weiter).

Falls du das Skript komplett loswerden willst: `rm -rf scripts/video-export` — sonst bleibt nichts zurück.
