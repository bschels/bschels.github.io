# Nextcloud Setup für architekturbüro schels

Dieses Verzeichnis enthält alle Dateien, um Nextcloud auf einem Hetzner CX11 Server mit dem Corporate Design von architekturbüro schels zu installieren.

## 🎨 Design-Features

- **Schwarzer Header** mit "architekturbüro schels" Logo
- **Avenir Next Font** (System Font Fallback)
- **Keine runden Ecken** (border-radius: 0)
- **Minimalistisches Design** in Schwarz/Weiß
- **Dark Mode Support**

## 📋 Voraussetzungen

- Hetzner CX11 Server (oder ähnlich)
- SSH-Zugriff auf den Server
- Root- oder sudo-Zugriff

## 🚀 Installation

### 1. Dateien auf Server kopieren

```bash
# Auf deinem lokalen Rechner
scp -r nextcloud/ root@DEINE_IP:/root/

# Oder mit Git
git clone <repository>
cd nextcloud
```

### 2. Auf dem Server: Setup ausführen

```bash
cd /root/nextcloud
chmod +x setup_nextcloud.sh
./setup_nextcloud.sh
```

Das Skript:
- Installiert Docker (falls nicht vorhanden)
- Installiert docker-compose
- Startet Nextcloud Container
- Aktiviert das Theme

### 3. Passwörter ändern

**WICHTIG:** Ändere die Passwörter in `docker-compose.yml`:

```yaml
NEXTCLOUD_ADMIN_PASSWORD=DEIN_SICHERES_PASSWORT
MYSQL_ROOT_PASSWORD=DEIN_SICHERES_PASSWORT
MYSQL_PASSWORD=DEIN_SICHERES_PASSWORT
```

Dann Container neu starten:
```bash
docker-compose down
docker-compose up -d
```

### 4. Nextcloud im Browser öffnen

```
http://DEINE_IP
```

Erstelle einen Admin-Account (falls noch nicht geschehen).

### 5. Theme aktivieren

Falls das Theme nicht automatisch aktiviert wurde:

```bash
docker exec nextcloud php occ theme:enable schels
```

Oder über die Weboberfläche:
- Einstellungen > Erscheinungsbild > Theme: "schels"

## 🎨 Theme anpassen

### CSS bearbeiten

1. Bearbeite `theme/schels/core/css/styles.css`
2. Kopiere auf Server: `scp theme/schels/core/css/styles.css root@DEINE_IP:/root/nextcloud/theme/schels/core/css/`
3. Aktiviere neu: `./activate_theme.sh`

### Logo ändern

Das Logo wird über das Nextcloud Theme-System gesetzt. Aktuell wird der Text "architekturbüro schels" verwendet.

Um ein Bild-Logo zu verwenden:
1. Logo-Datei nach `theme/schels/core/img/logo.svg` kopieren
2. In `styles.css` anpassen:
```css
#header .logo {
  background-image: url('../img/logo.svg');
  background-repeat: no-repeat;
  background-size: contain;
  text-indent: -9999px;
}
```

## 🔧 Wartung

### Theme-CSS aktualisieren

```bash
./activate_theme.sh
```

### Container neu starten

```bash
docker-compose restart
```

### Logs ansehen

```bash
docker-compose logs -f nextcloud
```

### Backup erstellen

```bash
# Daten-Volume
docker run --rm -v nextcloud_nextcloud:/data -v $(pwd):/backup alpine tar czf /backup/nextcloud-backup-$(date +%Y%m%d).tar.gz /data

# Datenbank
docker exec nextcloud-db mysqldump -u nextcloud -p nextcloud > backup-db-$(date +%Y%m%d).sql
```

## 📁 Verzeichnisstruktur

```
nextcloud/
├── docker-compose.yml          # Docker Compose Konfiguration
├── setup_nextcloud.sh          # Automatisches Setup-Skript
├── activate_theme.sh           # Theme aktivieren/aktualisieren
├── README.md                   # Diese Datei
└── theme/
    └── schels/
        ├── appinfo/
        │   └── info.xml        # Theme-Metadaten
        └── core/
            └── css/
                └── styles.css  # Custom CSS
```

## 🐛 Troubleshooting

### Theme wird nicht angezeigt

1. Prüfe ob Theme aktiviert ist:
   ```bash
   docker exec nextcloud php occ theme:list
   ```

2. Aktiviere manuell:
   ```bash
   docker exec nextcloud php occ theme:enable schels
   ```

3. Browser-Cache leeren (Strg+Shift+R)

### Container startet nicht

```bash
docker-compose logs nextcloud
docker-compose logs db
```

### Port 80 bereits belegt

Ändere in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Statt 80:80
```

Dann: `http://DEINE_IP:8080`

## 🔒 Sicherheit

- **Passwörter ändern** in `docker-compose.yml`
- **Firewall konfigurieren** (nur Port 80/443 öffnen)
- **SSL/TLS einrichten** (Let's Encrypt mit Certbot)
- **Regelmäßige Backups** erstellen

## 📝 Lizenz

MIT License - siehe Haupt-Repository
