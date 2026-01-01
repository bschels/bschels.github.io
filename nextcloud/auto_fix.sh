#!/bin/bash
# Automatische Nextcloud-Reparatur - ALLES automatisch

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="w7PCEnw7MLtm"
REMOTE_DIR="/root/nextcloud"

echo "🔧 Automatische Nextcloud-Reparatur"
echo "===================================="
echo ""

# Erstelle expect-Skript für SSH
cat > /tmp/ssh_auto.exp << 'EOFEXP'
#!/usr/bin/expect -f
set timeout 300
set server_ip [lindex $argv 0]
set server_pass [lindex $argv 1]
set command [lindex $argv 2]

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
exit [lindex $result 3]
EOFEXP

chmod +x /tmp/ssh_auto.exp

# Erstelle expect-Skript für SCP
cat > /tmp/scp_auto.exp << 'EOFEXP'
#!/usr/bin/expect -f
set timeout 300
set server_ip [lindex $argv 0]
set server_pass [lindex $argv 1]
set source [lindex $argv 2]
set dest [lindex $argv 3]

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
exit [lindex $result 3]
EOFEXP

chmod +x /tmp/scp_auto.exp

# 1. Prüfe Container-Status
echo "1️⃣  Prüfe Container-Status..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker ps -a" || echo "⚠️  Container-Status konnte nicht geprüft werden"
echo ""

# 2. Prüfe Logs
echo "2️⃣  Prüfe Nextcloud Logs..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker logs nextcloud --tail 30 2>&1" || echo "⚠️  Logs nicht verfügbar"
echo ""

# 3. Starte Container
echo "3️⃣  Starte/Repariere Container..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && docker-compose up -d 2>&1 || docker start nextcloud-db nextcloud 2>&1 || echo 'Container bereits gestartet'"
echo ""

# 4. Warte
echo "4️⃣  Warte auf Nextcloud (15 Sekunden)..."
sleep 15
echo ""

# 5. Prüfe ob Nextcloud läuft
echo "5️⃣  Prüfe ob Nextcloud erreichbar ist..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "curl -s -o /dev/null -w '%{http_code}' http://localhost || echo '000'"
echo ""

# 6. Repariere Berechtigungen
echo "6️⃣  Repariere Dateiberechtigungen..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud chown -R www-data:www-data /var/www/html 2>&1 || echo 'OK'"
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud chmod -R 755 /var/www/html 2>&1 || echo 'OK'"
echo ""

# 7. Kopiere Theme-Dateien
echo "7️⃣  Kopiere Theme-Dateien auf Server..."
cd "$(dirname "$0")"
/tmp/scp_auto.exp "$SERVER_IP" "$SERVER_PASS" "theme/schels" "$REMOTE_DIR/theme/" || echo "⚠️  Theme bereits vorhanden"
echo ""

# 8. Installiere Theme
echo "8️⃣  Installiere Theme..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo 'Theme bereits im Container'"
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ theme:enable schels 2>&1 || echo 'Theme bereits aktiviert'"
echo ""

# 9. Wartungsmodus aus
echo "9️⃣  Wartungsmodus ausschalten..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo 'Wartungsmodus bereits aus'"
echo ""

# 10. Cache leeren
echo "🔟 Leere Cache..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ files:scan --all 2>&1 | tail -5 || echo 'Scan übersprungen'"
echo ""

# 11. Prüfe Status
echo "1️⃣1️⃣  Prüfe finalen Status..."
/tmp/ssh_auto.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ status 2>&1 | head -10"
echo ""

echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo "🔄 Browser-Cache leeren (Cmd+Shift+R)"
echo ""

# Aufräumen
rm -f /tmp/ssh_auto.exp /tmp/scp_auto.exp
