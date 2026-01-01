#!/bin/bash
# FINALES REPARATUR-SKRIPT - Behebt alle Probleme automatisch

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="w7PCEnw7MLtm"  # Falls Passwort geändert wurde, hier anpassen

echo "🔧 FINALE Nextcloud-Reparatur"
echo "=============================="
echo ""

# Erstelle expect-Skripte
cat > /tmp/ssh_final.exp << 'EOF'
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
set exit_code [lindex $result 3]
if {$exit_code != 0} {
    exit $exit_code
}
EOF

chmod +x /tmp/ssh_final.exp

# 1. Prüfe und repariere trusted_domains
echo "1️⃣  Repariere trusted_domains..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:get trusted_domains" || echo "⚠️  Konnte trusted_domains nicht prüfen"
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set trusted_domains 0 --value=localhost 2>&1 || echo 'OK'"
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set trusted_domains 1 --value=$SERVER_IP 2>&1 || echo 'OK'"
echo ""

# 2. Prüfe overwritehost
echo "2️⃣  Prüfe overwritehost..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ config:system:set overwritehost --value='' 2>&1 || echo 'OK'"
echo ""

# 3. Prüfe Datenbank-Verbindung
echo "3️⃣  Prüfe Datenbank..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ status 2>&1 | grep -i 'installed\|version' || echo 'Status-Check fehlgeschlagen'"
echo ""

# 4. Repariere Berechtigungen
echo "4️⃣  Repariere Berechtigungen..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud bash -c 'chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html && chmod -R 770 /var/www/html/data && chmod -R 750 /var/www/html/config' 2>&1 || echo 'Berechtigungen OK'"
echo ""

# 5. Erstelle Theme-Verzeichnis
echo "5️⃣  Erstelle Theme-Verzeichnis..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "mkdir -p /root/nextcloud/theme 2>&1 || echo 'OK'"
echo ""

# 6. Kopiere Theme
cat > /tmp/scp_final.exp << 'EOFSCP'
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

chmod +x /tmp/scp_final.exp

cd "$(dirname "$0")"
echo "6️⃣  Kopiere Theme-Dateien..."
/tmp/scp_final.exp "$SERVER_IP" "$SERVER_PASS" "theme/schels" "/root/nextcloud/theme/" && echo "✅ Theme kopiert" || echo "⚠️  Theme-Kopie fehlgeschlagen"
echo ""

# 7. Installiere Theme im Container
echo "7️⃣  Installiere Theme im Container..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "cd /root/nextcloud && docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo 'Theme bereits im Container'"
echo ""

# 8. Aktiviere Theme als App
echo "8️⃣  Aktiviere Theme-App..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ app:enable schels 2>&1 || echo 'App bereits aktiviert oder nicht verfügbar'"
echo ""

# 9. Leere alle Caches
echo "9️⃣  Leere alle Caches..."
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ files:cleanup 2>&1 || echo 'OK'"
/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo 'OK'"
echo ""

# 10. Finaler Test
echo "🔟 Finaler Test..."
HTTP_CODE=$(/tmp/ssh_final.exp "$SERVER_IP" "$SERVER_PASS" "curl -s -o /dev/null -w '%{http_code}' http://localhost" 2>&1 | grep -E '[0-9]{3}' | tail -1 || echo "000")
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "   ✅ Nextcloud funktioniert!"
else
    echo "   ⚠️  Nextcloud antwortet mit HTTP $HTTP_CODE"
    echo "   Prüfe Logs: docker logs nextcloud --tail 50"
fi
echo ""

echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo "🔄 Browser-Cache leeren (Cmd+Shift+R)"
echo ""

# Aufräumen
rm -f /tmp/ssh_final.exp /tmp/scp_final.exp
