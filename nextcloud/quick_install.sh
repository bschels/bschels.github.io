#!/bin/bash
# Schnellinstallation des schels Themes
# Gibt die Befehle aus, die auf dem Server ausgeführt werden müssen

SERVER_IP="${1:-46.224.150.138}"

echo "🎨 schels Theme Installation"
echo "============================="
echo ""
echo "📋 Führe diese Befehle auf dem Server aus:"
echo ""
echo "1️⃣  Theme-Dateien kopieren (von diesem Rechner):"
echo "   cd nextcloud"
echo "   scp -r theme/schels root@$SERVER_IP:/root/nextcloud/theme/"
echo ""
echo "2️⃣  Auf Server einloggen:"
echo "   ssh root@$SERVER_IP"
echo ""
echo "3️⃣  Auf Server ausführen:"
echo "   cd /root/nextcloud"
echo "   docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels"
echo "   docker exec nextcloud php occ theme:enable schels"
echo "   docker exec nextcloud php occ maintenance:mode --off"
echo ""
echo "4️⃣  Browser-Cache leeren (Strg+Shift+R / Cmd+Shift+R)"
echo ""
echo "✅ Fertig! Theme sollte jetzt aktiv sein."
echo ""
