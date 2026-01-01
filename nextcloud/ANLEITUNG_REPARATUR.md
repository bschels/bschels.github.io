# Nextcloud Server-Reparatur

Da SSH mit Passwort nicht funktioniert, gibt es zwei Möglichkeiten:

## Option 1: Über Hetzner Console (Empfohlen)

1. **Öffne Hetzner Console:**
   - Gehe zu https://console.hetzner.cloud
   - Wähle deinen Server aus
   - Klicke auf "Console"

2. **Führe diese Befehle aus:**

```bash
# 1. Prüfe Container-Status
docker ps -a

# 2. Prüfe Logs
docker logs nextcloud --tail 50

# 3. Starte Container falls gestoppt
cd /root/nextcloud
docker-compose up -d

# Oder falls docker-compose nicht vorhanden:
docker start nextcloud nextcloud-db

# 4. Warte 15 Sekunden
sleep 15

# 5. Prüfe ob Nextcloud läuft
curl -I http://localhost
```

3. **Theme installieren (falls noch nicht geschehen):**

```bash
# Kopiere Theme-Dateien (falls noch nicht vorhanden)
# Du musst die Dateien zuerst auf den Server kopieren)

# Dann:
cd /root/nextcloud
docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels
docker exec nextcloud php occ theme:enable schels
docker exec nextcloud php occ maintenance:mode --off
```

## Option 2: Skript auf Server kopieren und ausführen

1. **Kopiere `server_fix.sh` auf den Server** (über Hetzner Console oder wenn SSH-Key vorhanden)

2. **Auf Server ausführen:**
```bash
chmod +x server_fix.sh
./server_fix.sh
```

## Option 3: SSH-Key einrichten

Falls du SSH-Zugriff haben möchtest:

1. **Erstelle SSH-Key (falls noch nicht vorhanden):**
```bash
ssh-keygen -t ed25519 -C "nextcloud"
```

2. **Kopiere Public Key:**
```bash
cat ~/.ssh/id_ed25519.pub
```

3. **Füge Key auf Server hinzu:**
   - Über Hetzner Console einloggen
   - `mkdir -p ~/.ssh`
   - `echo "DEIN_PUBLIC_KEY" >> ~/.ssh/authorized_keys`
   - `chmod 600 ~/.ssh/authorized_keys`
   - `chmod 700 ~/.ssh`

Dann funktioniert SSH ohne Passwort.

## Häufige Probleme

### Container startet nicht
```bash
docker logs nextcloud
docker logs nextcloud-db
```

### Port 80 bereits belegt
```bash
netstat -tulpn | grep :80
# Stoppe anderen Service oder ändere Port in docker-compose.yml
```

### Datenbank-Fehler
```bash
docker exec nextcloud-db mysql -u nextcloud -p -e "SHOW DATABASES;"
```

### Theme wird nicht angezeigt
```bash
docker exec nextcloud php occ theme:list
docker exec nextcloud php occ theme:enable schels
# Browser-Cache leeren!
```
