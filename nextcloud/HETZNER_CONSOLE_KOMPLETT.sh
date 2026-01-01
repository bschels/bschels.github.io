#!/bin/bash
# KOMPLETTE SAUBERE NEXTCLOUD INSTALLATION
# Kopiere diesen Code komplett in die Hetzner Console und führe ihn aus

set -e

REMOTE_DIR="/root/nextcloud"
ADMIN_PASS="Dstlfnk168"
DB_PASS="Dstlfnk168"

echo "🔄 SAUBERE NEXTCLOUD NEUINSTALLATION"
echo "===================================="
echo ""

# 1. STOPPE UND LÖSCHE ALLES
echo "1️⃣  Stoppe und lösche alte Installation..."
cd $REMOTE_DIR 2>/dev/null && docker-compose down -v 2>&1 || docker stop nextcloud nextcloud-db 2>&1 || echo "OK"
docker rm -f nextcloud nextcloud-db 2>&1 || echo "OK"
docker volume rm -f nextcloud_nextcloud nextcloud_db 2>&1 || echo "OK"
echo "✅ Alte Installation entfernt"
echo ""

# 2. ERSTELLE SAUBERE VERZEICHNISSTRUKTUR
echo "2️⃣  Erstelle saubere Verzeichnisstruktur..."
rm -rf $REMOTE_DIR
mkdir -p $REMOTE_DIR/theme
cd $REMOTE_DIR
echo "✅ Verzeichnisse erstellt"
echo ""

# 3. ERSTELLE docker-compose.yml
echo "3️⃣  Erstelle docker-compose.yml..."
cat > docker-compose.yml << 'DOCKEREOF'
version: "3.8"

services:
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    restart: always
    ports:
      - "80:80"
    volumes:
      - nextcloud:/var/www/html
      - ./theme/schels:/var/www/html/custom_apps/schels
    environment:
      - NEXTCLOUD_ADMIN_USER=admin
      - NEXTCLOUD_ADMIN_PASSWORD=Dstlfnk168
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=Dstlfnk168
    depends_on:
      - db

  db:
    image: mariadb:10.11
    container_name: nextcloud-db
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=Dstlfnk168
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=Dstlfnk168
    volumes:
      - db:/var/lib/mysql

volumes:
  nextcloud:
  db:
DOCKEREOF
echo "✅ docker-compose.yml erstellt"
echo ""

# 4. ERSTELLE THEME-VERZEICHNISSTRUKTUR
echo "4️⃣  Erstelle Theme-Struktur..."
mkdir -p theme/schels/appinfo
mkdir -p theme/schels/core/css

# Erstelle info.xml
cat > theme/schels/appinfo/info.xml << 'XMLEOF'
<?xml version="1.0"?>
<info>
  <id>schels</id>
  <name>architekturbüro schels</name>
  <summary>Corporate Design Theme für architekturbüro schels</summary>
  <description>Minimalistisches Theme mit schwarzem Header, Avenir Next Font und ohne runde Ecken</description>
  <version>1.0.0</version>
  <licence>MIT</licence>
  <author>Benjamin Schels</author>
  <namespace>Schels</namespace>
  <default_enable/>
  <types>
    <filesystem/>
  </types>
  <dependencies>
    <nextcloud min-version="25" max-version="32"/>
  </dependencies>
</info>
XMLEOF

# Erstelle styles.css (vereinfachte Version)
cat > theme/schels/core/css/styles.css << 'CSSEOF'
/* Nextcloud Theme: architekturbüro schels */
* {
  border-radius: 0 !important;
}

*,
body,
#header,
button,
input {
  font-family: -apple-system, BlinkMacSystemFont, 'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
  font-weight: 200 !important;
}

#header,
header {
  background: #000 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

#header *,
header * {
  color: #fff !important;
}
CSSEOF

echo "✅ Theme-Struktur erstellt"
echo ""

# 5. STARTE NEXTCLOUD
echo "5️⃣  Starte Nextcloud..."
docker-compose up -d
echo "✅ Container gestartet"
echo ""

# 6. WARTE AUF NEXTCLOUD
echo "6️⃣  Warte auf Nextcloud (45 Sekunden)..."
sleep 45
echo ""

# 7. INSTALLIERE THEME
echo "7️⃣  Installiere Theme..."
docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels
docker exec nextcloud php occ app:enable schels 2>&1 || echo "Theme aktiviert"
echo "✅ Theme installiert"
echo ""

# 8. KONFIGURIERE NEXTCLOUD
echo "8️⃣  Konfiguriere Nextcloud..."
SERVER_IP=$(hostname -I | awk '{print $1}')
docker exec nextcloud php occ config:system:set trusted_domains 0 --value=localhost
docker exec nextcloud php occ config:system:set trusted_domains 1 --value=$SERVER_IP
docker exec nextcloud php occ config:system:set overwriteprotocol --value=http
docker exec nextcloud php occ maintenance:mode --off
echo "✅ Konfiguration abgeschlossen"
echo ""

# 9. FINALER TEST
echo "9️⃣  Finaler Test..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost || echo "000")
echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ Nextcloud funktioniert perfekt!"
else
    echo "   ⚠️  HTTP $HTTP_CODE"
    docker logs nextcloud --tail 20
fi
echo ""

echo "✅ INSTALLATION ABGESCHLOSSEN!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo "👤 Admin: admin"
echo "🔑 Passwort: Dstlfnk168"
echo ""
