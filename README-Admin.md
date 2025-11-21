# Admin Panel - Anleitung

## Übersicht

Das Admin-Panel ermöglicht es, alle Website-Inhalte einfach über eine Web-Oberfläche zu bearbeiten und Änderungen automatisch auf GitHub zu committen und zu pushen.

## Ersteinrichtung

### 1. GitHub Personal Access Token erstellen

1. Gehen Sie zu GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Klicken Sie auf "Generate new token (classic)"
3. Geben Sie einen Namen ein (z.B. "Website Admin Panel")
4. Wählen Sie die Berechtigung `repo` (Full control of private repositories)
5. Klicken Sie auf "Generate token"
6. **WICHTIG**: Kopieren Sie den Token sofort (er wird nur einmal angezeigt!)
   - Der Token beginnt mit `ghp_`

### 2. Passwort ändern

Das Standard-Passwort ist `admin`. **Ändern Sie dies unbedingt!**

Um ein neues Passwort zu setzen:

1. Öffnen Sie die Browser-Konsole (F12)
2. Führen Sie folgenden Code aus:

```javascript
async function setPassword(newPassword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(newPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Neuer Password-Hash:', hashHex);
  return hashHex;
}

// Beispiel: Passwort "meinNeuesPasswort" setzen
setPassword('meinNeuesPasswort').then(hash => {
  // Kopieren Sie den Hash und fügen Sie ihn in admin-config.js ein:
  // passwordHash: 'HIER_DEN_HASH_EINFÜGEN'
});
```

3. Kopieren Sie den generierten Hash
4. Öffnen Sie `admin-config.js`
5. Ersetzen Sie den Wert von `passwordHash` mit Ihrem neuen Hash

### 3. Admin-Panel öffnen

1. Öffnen Sie `admin.html` in Ihrem Browser
2. Geben Sie Ihr Passwort ein
3. Beim ersten Mal werden Sie aufgefordert:
   - GitHub Personal Access Token einzugeben
   - GitHub Username einzugeben
   - Repository Name (Standard: `bschels.github.io`)
   - Branch Name (Standard: `main`)
4. Klicken Sie auf "Einstellungen speichern"

**Hinweis**: Token und Konfiguration werden nur lokal im Browser gespeichert (localStorage).

## Verwendung

### Inhalte bearbeiten

1. Wählen Sie einen Bereich aus der linken Navigation
2. Bearbeiten Sie die Inhalte in den beiden Editoren (DE/EN)
3. Die Vorschau wird automatisch aktualisiert
4. Klicken Sie auf "Speichern" um die Änderungen auf GitHub zu committen

### Verfügbare Bereiche

- **Profil**: Büroprofil und Überblick
- **Vita / CV**: Lebenslauf und Qualifikationen
- **Leistungen**: Leistungsübersicht
- **Schwerpunkte**: Schwerpunkte der Arbeit
- **Projekte**: Projektliste und Referenzen
- **Kontakt**: Kontaktinformationen
- **Impressum**: Impressum
- **Datenschutz**: Datenschutzerklärung
- **Meta-Tags & SEO**: Meta-Informationen für Suchmaschinen

### Zweisprachige Bearbeitung

- Alle Inhalte werden in **Deutsch** und **Englisch** bearbeitet
- Die Editoren sind nebeneinander angezeigt (Side-by-Side)
- Validierung warnt, wenn eine Übersetzung fehlt
- Jede Sprache kann unabhängig bearbeitet werden

### Speichern und Committen

- Änderungen werden direkt auf GitHub committet
- Commit-Messages sind automatisch generiert
- Änderungen werden sofort auf die Website übertragen (bei GitHub Pages)

## Sicherheit

- **Passwort**: Wird als SHA-256 Hash gespeichert
- **GitHub Token**: Wird nur lokal im Browser gespeichert (localStorage)
- **Keine sensiblen Daten** werden im Repository gespeichert
- **Empfehlung**: Verwenden Sie ein starkes Passwort und bewahren Sie den GitHub Token sicher auf

## Fehlerbehebung

### "GitHub API Fehler: 401"
- Token ist ungültig oder abgelaufen
- Erstellen Sie einen neuen Token und speichern Sie ihn erneut

### "Datei nicht gefunden"
- Überprüfen Sie den Repository-Namen und Branch
- Stellen Sie sicher, dass der Token die `repo` Berechtigung hat

### "Commit fehlgeschlagen"
- Überprüfen Sie, ob Sie Schreibrechte auf das Repository haben
- Stellen Sie sicher, dass der Branch existiert

### Inhalte werden nicht angezeigt
- Überprüfen Sie die Browser-Konsole auf Fehler (F12)
- Stellen Sie sicher, dass alle Dateien korrekt geladen werden

## Technische Details

- **GitHub API**: REST API v3
- **Authentifizierung**: Personal Access Token
- **Speicherung**: localStorage (nur lokal im Browser)
- **Format**: HTML-Inhalte werden direkt bearbeitet

## Support

Bei Problemen oder Fragen:
- Überprüfen Sie die Browser-Konsole (F12) auf Fehlermeldungen
- Stellen Sie sicher, dass alle Konfigurationen korrekt sind
- Überprüfen Sie die GitHub API Rate Limits



