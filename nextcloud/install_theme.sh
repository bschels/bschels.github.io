#!/bin/bash
# Installiert das schels Theme auf der laufenden Nextcloud-Instanz

set -e

SERVER_IP="${1:-46.224.150.138}"
REMOTE_USER="root"
REMOTE_DIR="/root/nextcloud"

echo "🎨 Installiere schels Theme auf Nextcloud"
echo "=========================================="
echo "Server: $REMOTE_USER@$SERVER_IP"
echo ""

# Prüfe ob Theme-Verzeichnis lokal existiert
if [ ! -d "theme/schels" ]; then
    echo "❌ Theme-Verzeichnis nicht gefunden!"
    echo "Bitte im nextcloud-Verzeichnis ausführen."
    exit 1
fi

# Erstelle Remote-Verzeichnis
echo "📁 Erstelle Verzeichnis auf Server..."
ssh "$REMOTE_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR/theme/schels"

# Kopiere Theme-Dateien
echo "📤 Kopiere Theme-Dateien auf Server..."
scp -r theme/schels/* "$REMOTE_USER@$SERVER_IP:$REMOTE_DIR/theme/schels/"

echo "✅ Theme-Dateien kopiert"
echo ""

# Kopiere Theme in Nextcloud Container
echo "🐳 Kopiere Theme in Nextcloud Container..."
ssh "$REMOTE_USER@$SERVER_IP" << 'ENDSSH'
cd /root/nextcloud
docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels || {
    echo "⚠️  Fehler beim Kopieren in Container"
    echo "Prüfe ob Container 'nextcloud' läuft:"
    docker ps | grep nextcloud
    exit 1
}
ENDSSH

echo "✅ Theme in Container kopiert"
echo ""

# Aktiviere Theme
echo "✅ Aktiviere Theme..."
ssh "$REMOTE_USER@$SERVER_IP" << 'ENDSSH'
docker exec nextcloud php occ theme:enable schels
docker exec nextcloud php occ maintenance:mode --off
ENDSSH

echo ""
echo "✅ Theme erfolgreich installiert und aktiviert!"
echo ""
echo "🔄 Browser-Cache leeren (Strg+Shift+R / Cmd+Shift+R) um Änderungen zu sehen."
echo "🌐 Öffne: http://$SERVER_IP"
echo ""
