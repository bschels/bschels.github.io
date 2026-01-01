#!/bin/bash
# Reparatur-Skript - auf dem Server ausführen
# Kopiere dieses Skript auf den Server und führe es aus

set -e

echo "🔧 Repariere Nextcloud Server..."
echo "================================="
echo ""

# Prüfe Container-Status
echo "🔍 Prüfe Container-Status..."
docker ps -a | grep -E "nextcloud|CONTAINER" || echo "Keine Container gefunden"
echo ""

# Prüfe Logs
echo "📋 Prüfe Nextcloud Logs..."
docker logs nextcloud --tail 50 2>&1 | tail -20 || echo "Container-Logs nicht verfügbar"
echo ""

# Starte Container
echo "🚀 Starte/Repariere Container..."
cd /root/nextcloud 2>/dev/null || {
    echo "⚠️  /root/nextcloud nicht gefunden, versuche Container direkt zu starten..."
    docker start nextcloud nextcloud-db 2>&1 || {
        echo "⚠️  Container konnten nicht gestartet werden"
        echo "Prüfe ob docker-compose.yml vorhanden ist..."
        if [ -f "/root/nextcloud/docker-compose.yml" ]; then
            cd /root/nextcloud
            docker-compose up -d
        else
            echo "❌ docker-compose.yml nicht gefunden"
            exit 1
        fi
    }
}

echo "⏳ Warte auf Nextcloud (15 Sekunden)..."
sleep 15

# Prüfe ob Nextcloud läuft
echo "🔍 Prüfe ob Nextcloud erreichbar ist..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "✅ Nextcloud läuft (HTTP $HTTP_CODE)"
else
    echo "⚠️  Nextcloud antwortet mit HTTP $HTTP_CODE"
fi
echo ""

# Installiere Theme falls vorhanden
if [ -d "/root/nextcloud/theme/schels" ]; then
    echo "🎨 Installiere Theme..."
    docker cp /root/nextcloud/theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo "Theme bereits vorhanden"
    docker exec nextcloud php occ theme:enable schels 2>&1 || echo "Theme bereits aktiviert"
    docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo "Wartungsmodus bereits aus"
    echo "✅ Theme installiert"
else
    echo "⚠️  Theme-Verzeichnis nicht gefunden: /root/nextcloud/theme/schels"
fi

echo ""
echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$(hostname -I | awk '{print $1}')"
echo ""
