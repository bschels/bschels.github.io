#!/bin/bash
# KOMPLETTES REPARATUR-SKRIPT für Hetzner Console
# Einfach in die Hetzner Console kopieren und ausführen

set -e

echo "🔧 Nextcloud Komplett-Reparatur"
echo "================================"
echo ""

# 1. Prüfe Container-Status
echo "1️⃣  Prüfe Container-Status..."
docker ps -a | grep -E "nextcloud|CONTAINER" || echo "Keine Container gefunden"
echo ""

# 2. Prüfe Logs auf Fehler
echo "2️⃣  Prüfe Nextcloud Logs (letzte 50 Zeilen)..."
docker logs nextcloud --tail 50 2>&1 | tail -30
echo ""

# 3. Prüfe Datenbank-Logs
echo "3️⃣  Prüfe Datenbank-Logs..."
docker logs nextcloud-db --tail 20 2>&1 | tail -10 || echo "Datenbank-Container nicht gefunden"
echo ""

# 4. Starte Container falls gestoppt
echo "4️⃣  Starte/Repariere Container..."
if [ -f "/root/nextcloud/docker-compose.yml" ]; then
    cd /root/nextcloud
    echo "   Verwende docker-compose..."
    docker-compose up -d
else
    echo "   Starte Container direkt..."
    docker start nextcloud-db 2>&1 || echo "   Datenbank-Container bereits gestartet"
    sleep 5
    docker start nextcloud 2>&1 || echo "   Nextcloud-Container bereits gestartet"
fi
echo ""

# 5. Warte auf Nextcloud
echo "5️⃣  Warte auf Nextcloud (20 Sekunden)..."
sleep 20
echo ""

# 6. Prüfe ob Nextcloud läuft
echo "6️⃣  Prüfe ob Nextcloud erreichbar ist..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost 2>&1 || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ Nextcloud läuft (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Nextcloud antwortet mit HTTP $HTTP_CODE"
    echo "   Prüfe Logs für Details..."
    docker logs nextcloud --tail 10
fi
echo ""

# 7. Repariere Berechtigungen
echo "7️⃣  Repariere Dateiberechtigungen..."
docker exec nextcloud chown -R www-data:www-data /var/www/html 2>&1 || echo "   Berechtigungen bereits korrekt"
docker exec nextcloud chmod -R 755 /var/www/html 2>&1 || echo "   Berechtigungen bereits korrekt"
echo ""

# 8. Prüfe Datenbank-Verbindung
echo "8️⃣  Prüfe Datenbank-Verbindung..."
docker exec nextcloud php occ status 2>&1 | head -10 || echo "   Status-Check fehlgeschlagen"
echo ""

# 9. Installiere Theme falls vorhanden
echo "9️⃣  Installiere Theme..."
if [ -d "/root/nextcloud/theme/schels" ]; then
    echo "   Theme-Verzeichnis gefunden"
    docker cp /root/nextcloud/theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo "   Theme bereits im Container"
    docker exec nextcloud php occ theme:enable schels 2>&1 || echo "   Theme bereits aktiviert"
    echo "   ✅ Theme installiert"
else
    echo "   ⚠️  Theme-Verzeichnis nicht gefunden: /root/nextcloud/theme/schels"
    echo "   Theme muss zuerst auf den Server kopiert werden"
fi
echo ""

# 10. Wartungsmodus aus
echo "🔟 Wartungsmodus ausschalten..."
docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo "   Wartungsmodus bereits aus"
echo ""

# 11. Cache leeren
echo "1️⃣1️⃣  Leere Cache..."
docker exec nextcloud php occ files:scan --all 2>&1 | tail -5 || echo "   Scan übersprungen"
echo ""

echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$(hostname -I | awk '{print $1}')"
echo "🔄 Browser-Cache leeren (Cmd+Shift+R / Strg+Shift+R)"
echo ""
echo "📋 Falls noch Fehler auftreten, prüfe:"
echo "   docker logs nextcloud --tail 100"
echo "   docker logs nextcloud-db --tail 50"
echo ""
