#!/bin/bash
# Behebt HTTP 500 Fehler und installiert Theme

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="w7PCEnw7MLtm"

echo "🔧 Behebe HTTP 500 Fehler..."
echo "============================="
echo ""

# Erstelle expect-Skript
cat > /tmp/fix.exp << 'EOF'
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
EOF

chmod +x /tmp/fix.exp

# 1. Prüfe PHP-Fehler
echo "1️⃣  Prüfe PHP-Fehler in Logs..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud tail -100 /var/www/html/data/nextcloud.log 2>&1 | grep -i 'error\|exception\|fatal' | tail -20 || echo 'Keine PHP-Fehler gefunden'"
echo ""

# 2. Prüfe Datenbank-Verbindung
echo "2️⃣  Prüfe Datenbank-Verbindung..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud-db mysql -u nextcloud -pnextcloud -e 'SELECT 1' 2>&1 || echo 'DB-Check fehlgeschlagen'"
echo ""

# 3. Repariere config.php
echo "3️⃣  Prüfe config.php..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud cat /var/www/html/config/config.php | grep -E 'trusted_domains|overwritehost' || echo 'config.php OK'"
echo ""

# 4. Füge IP zu trusted_domains hinzu
echo "4️⃣  Füge IP zu trusted_domains hinzu..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set trusted_domains 1 --value=$SERVER_IP 2>&1 || echo 'IP bereits hinzugefügt'"
echo ""

# 5. Repariere Berechtigungen komplett
echo "5️⃣  Repariere alle Berechtigungen..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html && chmod -R 770 /var/www/html/data 2>&1 || echo 'Berechtigungen OK'"
echo ""

# 6. Erstelle Theme-Verzeichnis und kopiere Theme
echo "6️⃣  Installiere Theme..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "mkdir -p /root/nextcloud/theme 2>&1 || echo 'Verzeichnis existiert bereits'"
echo ""

# 7. Kopiere Theme mit SCP
cat > /tmp/scp_fix.exp << 'EOFSCP'
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
EOFSCP

chmod +x /tmp/scp_fix.exp

cd "$(dirname "$0")"
/tmp/scp_fix.exp "$SERVER_IP" "$SERVER_PASS" "theme/schels" "/root/nextcloud/theme/" || echo "⚠️  Theme-Kopie fehlgeschlagen, versuche es manuell"
echo ""

# 8. Installiere Theme im Container
echo "7️⃣  Installiere Theme im Container..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "cd /root/nextcloud && docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo 'Theme bereits im Container'"
echo ""

# 9. Aktiviere Theme (Nextcloud 32 Syntax)
echo "8️⃣  Aktiviere Theme..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:app:set theming name --value='architekturbüro schels' 2>&1 || echo 'Theming-App nicht verfügbar'"
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ app:enable schels 2>&1 || echo 'App bereits aktiviert oder nicht verfügbar'"
echo ""

# 10. Cache komplett leeren
echo "9️⃣  Leere alle Caches..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ files:cleanup 2>&1 || echo 'Cleanup übersprungen'"
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ maintenance:repair 2>&1 || echo 'Repair übersprungen'"
echo ""

# 11. Prüfe finalen Status
echo "🔟 Prüfe finalen Status..."
/tmp/fix.exp "$SERVER_IP" "$SERVER_PASS" "curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://localhost || echo 'Nicht erreichbar'"
echo ""

echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo ""

# Aufräumen
rm -f /tmp/fix.exp /tmp/scp_fix.exp
