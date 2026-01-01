# Deployment-Anleitung für Hetzner

## 🚀 Schnellstart

### Option 1: Automatisches Deployment (Empfohlen)

```bash
cd nextcloud
./deploy_to_hetzner.sh DEINE_HETZNER_IP
```

Das Skript:
- Testet SSH-Verbindung
- Kopiert alle Dateien auf den Server
- Führt Setup automatisch aus

**Beispiel:**
```bash
./deploy_to_hetzner.sh 123.456.789.0
```

### Option 2: Manuelles Deployment

#### 1. Dateien auf Server kopieren

```bash
# Auf deinem Mac
cd nextcloud
scp -r docker-compose.yml setup_nextcloud.sh activate_theme.sh README.md theme/ root@DEINE_IP:/root/nextcloud/
```

#### 2. Auf Server einloggen

```bash
ssh root@DEINE_IP
```

#### 3. Setup ausführen

```bash
cd /root/nextcloud
chmod +x setup_nextcloud.sh
./setup_nextcloud.sh
```

## 🔑 SSH-Key einrichten (falls noch nicht geschehen)

```bash
# SSH-Key generieren (falls noch nicht vorhanden)
ssh-keygen -t ed25519 -C "deine-email@example.com"

# Key auf Server kopieren
ssh-copy-id root@DEINE_IP
```

## ⚙️ Nach dem Deployment

### 1. Passwörter ändern

**WICHTIG:** Auf dem Server `docker-compose.yml` bearbeiten:

```bash
ssh root@DEINE_IP
cd /root/nextcloud
nano docker-compose.yml
```

Ändere:
- `NEXTCLOUD_ADMIN_PASSWORD=CHANGE_ME`
- `MYSQL_ROOT_PASSWORD=CHANGE_ME`
- `MYSQL_PASSWORD=CHANGE_ME`

Dann Container neu starten:
```bash
docker-compose down
docker-compose up -d
```

### 2. Nextcloud öffnen

```
http://DEINE_IP
```

### 3. Theme prüfen

Falls Theme nicht aktiviert:
```bash
docker exec nextcloud php occ theme:enable schels
```

## 🔄 Theme aktualisieren

Wenn du das CSS geändert hast:

```bash
# Lokal CSS bearbeiten
# Dann auf Server kopieren:
scp theme/schels/core/css/styles.css root@DEINE_IP:/root/nextcloud/theme/schels/core/css/

# Auf Server aktivieren:
ssh root@DEINE_IP
cd /root/nextcloud
./activate_theme.sh
```

## 🐛 Troubleshooting

### SSH-Verbindung funktioniert nicht

```bash
# Teste Verbindung
ssh -v root@DEINE_IP

# Prüfe Firewall (auf Server)
ufw status
```

### Port 80 bereits belegt

Ändere in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"
```

Dann: `http://DEINE_IP:8080`

### Container startet nicht

```bash
# Logs ansehen
docker-compose logs nextcloud
docker-compose logs db

# Container neu starten
docker-compose restart
```

## 📝 Checkliste

- [ ] SSH-Key eingerichtet
- [ ] Dateien auf Server kopiert
- [ ] Setup ausgeführt
- [ ] Passwörter in docker-compose.yml geändert
- [ ] Nextcloud im Browser geöffnet
- [ ] Theme aktiviert
- [ ] Logo/Design geprüft

## 🔒 Sicherheit

Nach dem Setup:

1. **Firewall konfigurieren:**
   ```bash
   ufw allow 22/tcp   # SSH
   ufw allow 80/tcp   # HTTP
   ufw allow 443/tcp  # HTTPS
   ufw enable
   ```

2. **SSL/TLS einrichten** (Let's Encrypt):
   ```bash
   apt install certbot
   certbot certonly --standalone -d deine-domain.de
   ```

3. **Regelmäßige Backups** einrichten
