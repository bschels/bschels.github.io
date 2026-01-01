#!/bin/bash
# Behebt HTTP 500 Fehler komplett

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="w7PCEnw7MLtm"

echo "🔧 Behebe HTTP 500 Fehler..."
echo "============================"
echo ""

# Erstelle verbessertes expect-Skript
cat > /tmp/ssh_behebe.exp << 'EOF'
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

chmod +x /tmp/ssh_behebe.exp

# 1. Prüfe Apache Error Log
echo "1️⃣  Prüfe Apache Error Log..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud tail -50 /var/log/apache2/error.log 2>&1 | tail -20" 2>&1 | grep -v "password:" | tail -25
echo ""

# 2. Prüfe Nextcloud Log
echo "2️⃣  Prüfe Nextcloud Log..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud tail -50 /var/www/html/data/nextcloud.log 2>&1 | tail -20" 2>&1 | grep -v "password:" | tail -25
echo ""

# 3. Prüfe PHP-Fehler
echo "3️⃣  Prüfe PHP-Konfiguration..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php -i | grep -E 'display_errors|error_reporting|log_errors' | head -5" 2>&1 | grep -v "password:"
echo ""

# 4. Setze debug mode temporär an
echo "4️⃣  Aktiviere Debug-Modus..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set debug --value=true --type=boolean 2>&1" 2>&1 | grep -v "password:"
echo ""

# 5. Prüfe ob trusted_domains korrekt ist
echo "5️⃣  Prüfe trusted_domains..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:get trusted_domains" 2>&1 | grep -v "password:"
echo ""

# 6. Setze overwritehost auf leer
echo "6️⃣  Setze overwritehost..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:delete overwritehost 2>&1 || docker exec nextcloud php occ config:system:set overwritehost --value='' 2>&1" 2>&1 | grep -v "password:"
echo ""

# 7. Setze overwriteprotocol auf http
echo "7️⃣  Setze overwriteprotocol..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set overwriteprotocol --value=http 2>&1" 2>&1 | grep -v "password:"
echo ""

# 8. Repariere Berechtigungen nochmal
echo "8️⃣  Repariere Berechtigungen..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud bash -c 'chown -R www-data:www-data /var/www/html && find /var/www/html -type d -exec chmod 755 {} \; && find /var/www/html -type f -exec chmod 644 {} \; && chmod -R 770 /var/www/html/data && chmod -R 750 /var/www/html/config' 2>&1" 2>&1 | grep -v "password:" | tail -5
echo ""

# 9. Restart Apache
echo "9️⃣  Starte Apache neu..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud service apache2 reload 2>&1 || docker exec nextcloud apachectl graceful 2>&1" 2>&1 | grep -v "password:"
echo ""

# 10. Warte und teste
echo "🔟 Warte 5 Sekunden und teste..."
sleep 5
HTTP_CODE=$(/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "curl -s -o /dev/null -w '%{http_code}' http://localhost" 2>&1 | grep -E '[0-9]{3}' | tail -1 || echo "000")
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ Nextcloud funktioniert jetzt!"
else
    echo "   ⚠️  Noch HTTP $HTTP_CODE - prüfe Logs oben"
fi
echo ""

# 11. Deaktiviere Debug wieder
echo "1️⃣1️⃣  Deaktiviere Debug-Modus..."
/tmp/ssh_behebe.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set debug --value=false --type=boolean 2>&1" 2>&1 | grep -v "password:"
echo ""

echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo ""

rm -f /tmp/ssh_behebe.exp
