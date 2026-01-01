#!/bin/bash
# Repariert Nextcloud Server-Fehler und installiert Theme

set -e

SERVER_IP="46.224.150.138"
REMOTE_USER="root"
REMOTE_DIR="/root/nextcloud"
PASSWORD="Dstlfnk*168"

echo "🔧 Repariere Nextcloud Server..."
echo "================================="
echo ""

# Funktion für SSH mit Passwort
ssh_with_password() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$REMOTE_USER@$SERVER_IP" "$@"
}

scp_with_password() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$@"
}

# Prüfe ob sshpass installiert ist
if ! command -v sshpass &> /dev/null; then
    echo "📦 Installiere sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            echo "❌ brew nicht gefunden. Bitte installiere sshpass manuell:"
            echo "   brew install hudochenkov/sshpass/sshpass"
            exit 1
        fi
    else
        echo "❌ sshpass benötigt. Bitte installiere es:"
        echo "   sudo apt-get install sshpass  # Ubuntu/Debian"
        exit 1
    fi
fi

echo "✅ sshpass verfügbar"
echo ""

# 1. Prüfe Container-Status
echo "🔍 Prüfe Nextcloud Container-Status..."
ssh_with_password "docker ps -a | grep nextcloud || echo 'Keine Container gefunden'"
echo ""

# 2. Prüfe Logs auf Fehler
echo "📋 Prüfe Nextcloud Logs..."
ssh_with_password "docker logs nextcloud --tail 50 2>&1 | tail -20" || echo "Container-Logs nicht verfügbar"
echo ""

# 3. Starte Container falls gestoppt
echo "🚀 Starte Nextcloud Container..."
ssh_with_password "cd $REMOTE_DIR && docker-compose up -d 2>&1 || docker start nextcloud nextcloud-db 2>&1 || echo 'Container bereits gestartet'"
echo ""

# 4. Warte auf Nextcloud
echo "⏳ Warte auf Nextcloud (10 Sekunden)..."
sleep 10

# 5. Prüfe ob Nextcloud läuft
echo "🔍 Prüfe ob Nextcloud erreichbar ist..."
ssh_with_password "curl -s -o /dev/null -w '%{http_code}' http://localhost || echo 'Nicht erreichbar'"
echo ""

# 6. Kopiere Theme-Dateien
echo "📤 Kopiere Theme-Dateien auf Server..."
cd "$(dirname "$0")"
scp_with_password -r theme/schels "$REMOTE_USER@$SERVER_IP:$REMOTE_DIR/theme/" || {
    echo "⚠️  Fehler beim Kopieren der Theme-Dateien"
}

# 7. Installiere Theme
echo "🎨 Installiere Theme..."
ssh_with_password << 'ENDSSH'
cd /root/nextcloud
# Kopiere Theme in Container
docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo "Theme bereits vorhanden"

# Aktiviere Theme
docker exec nextcloud php occ theme:enable schels 2>&1 || echo "Theme bereits aktiviert"

# Wartungsmodus aus
docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo "Wartungsmodus bereits aus"

# Cache leeren
docker exec nextcloud php occ files:scan --all 2>&1 || echo "Scan übersprungen"
ENDSSH

echo ""
echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo "🔄 Browser-Cache leeren (Cmd+Shift+R)"
echo ""
