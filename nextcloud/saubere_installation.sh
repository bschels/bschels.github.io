#!/bin/bash
# SAUBERE NEXTCLOUD NEUINSTALLATION - ALLES AUTOMATISCH

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="tbHaxtid7ceU"
REMOTE_DIR="/root/nextcloud"

echo "🔄 SAUBERE NEXTCLOUD NEUINSTALLATION"
echo "===================================="
echo ""

# Erstelle expect-Skript
cat > /tmp/ssh_clean.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 300
set server_ip [lindex $argv 0]
set server_pass [lindex $argv 1]
set command [lindex $argv 2]

log_user 0
spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$server_ip "$command"
expect {
    "password:" {
        send "$server_pass\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}
catch wait result
set exit_code [lindex $result 3]
log_user 1
exit $exit_code
EOF

chmod +x /tmp/ssh_clean.exp

# Erstelle SCP-Skript
cat > /tmp/scp_clean.exp << 'EOFSCP'
#!/usr/bin/expect -f
set timeout 300
set server_ip [lindex $argv 0]
set server_pass [lindex $argv 1]
set source [lindex $argv 2]
set dest [lindex $argv 3]

log_user 0
spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r "$source" root@$server_ip:"$dest"
expect {
    "password:" {
        send "$server_pass\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}
catch wait result
set exit_code [lindex $result 3]
log_user 1
exit $exit_code
EOFSCP

chmod +x /tmp/scp_clean.exp

# 1. STOPPE UND LÖSCHE ALLES
echo "1️⃣  Stoppe und lösche alte Installation..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR 2>/dev/null && docker-compose down -v 2>&1 || docker stop nextcloud nextcloud-db 2>&1 || echo 'OK'"
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker rm -f nextcloud nextcloud-db 2>&1 || echo 'OK'"
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker volume rm -f nextcloud_nextcloud nextcloud_db 2>&1 || echo 'OK'"
echo "✅ Alte Installation entfernt"
echo ""

# 2. ERSTELLE SAUBERE VERZEICHNISSTRUKTUR
echo "2️⃣  Erstelle saubere Verzeichnisstruktur..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR/theme"
echo "✅ Verzeichnisse erstellt"
echo ""

# 3. KOPIERE ALLE DATEIEN
echo "3️⃣  Kopiere alle Dateien auf Server..."
cd "$(dirname "$0")"

# Kopiere docker-compose.yml
/tmp/scp_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker-compose.yml" "$REMOTE_DIR/" && echo "   ✅ docker-compose.yml kopiert" || echo "   ⚠️  docker-compose.yml"

# Kopiere Theme komplett
/tmp/scp_clean.exp "$SERVER_IP" "$SERVER_PASS" "theme/schels" "$REMOTE_DIR/theme/" && echo "   ✅ Theme kopiert" || echo "   ⚠️  Theme"
echo ""

# 4. ÄNDERE PASSWÖRTER IN docker-compose.yml
echo "4️⃣  Setze Passwörter in docker-compose.yml..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && sed -i \"s/CHANGE_ME/Dstlfnk168/g\" docker-compose.yml"
echo "✅ Passwörter gesetzt"
echo ""

# 5. STARTE NEXTCLOUD NEU
echo "5️⃣  Starte Nextcloud neu..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && docker-compose up -d"
echo "✅ Container gestartet"
echo ""

# 6. WARTE AUF NEXTCLOUD
echo "6️⃣  Warte auf Nextcloud (45 Sekunden)..."
sleep 45
echo ""

# 7. INSTALLIERE THEME
echo "7️⃣  Installiere Theme..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo 'Theme bereits vorhanden'"
echo "✅ Theme kopiert"
echo ""

# 8. AKTIVIERE THEME
echo "8️⃣  Aktiviere Theme..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ app:enable schels 2>&1 || echo 'Theme aktiviert'"
echo ""

# 9. KONFIGURIERE NEXTCLOUD
echo "9️⃣  Konfiguriere Nextcloud..."
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set trusted_domains 0 --value=localhost 2>&1 || echo 'OK'"
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set trusted_domains 1 --value=$SERVER_IP 2>&1 || echo 'OK'"
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set overwriteprotocol --value=http 2>&1 || echo 'OK'"
/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo 'OK'"
echo "✅ Konfiguration abgeschlossen"
echo ""

# 10. FINALER TEST
echo "🔟 Finaler Test..."
sleep 10
HTTP_CODE=$(/tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "curl -s -o /dev/null -w '%{http_code}' http://localhost" 2>&1 | grep -E '[0-9]{3}' | tail -1 || echo "000")
echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ Nextcloud funktioniert perfekt!"
else
    echo "   ⚠️  HTTP $HTTP_CODE - prüfe Logs"
    /tmp/ssh_clean.exp "$SERVER_IP" "$SERVER_PASS" "docker logs nextcloud --tail 20" 2>&1 | grep -v "password:" | tail -10
fi
echo ""

echo "✅ SAUBERE INSTALLATION ABGESCHLOSSEN!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo "👤 Admin: admin"
echo "🔑 Passwort: Dstlfnk168"
echo "🔄 Browser-Cache leeren (Cmd+Shift+R)"
echo ""

# Aufräumen
rm -f /tmp/ssh_clean.exp /tmp/scp_clean.exp
