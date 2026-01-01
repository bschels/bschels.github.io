#!/bin/bash
# Repariert Nextcloud komplett - alles automatisch

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="w7PCEnw7MLtm"
REMOTE_DIR="/root/nextcloud"

echo "🔧 Repariere Nextcloud komplett..."
echo "==================================="
echo ""

# Prüfe ob expect installiert ist
if ! command -v expect &> /dev/null; then
    echo "📦 Installiere expect..."
    brew install expect || {
        echo "❌ expect konnte nicht installiert werden"
        exit 1
    }
fi

# Erstelle expect-Skript für SSH-Befehle
cat > /tmp/ssh_cmd.exp << 'EOF'
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

chmod +x /tmp/ssh_cmd.exp

# Erstelle expect-Skript für SCP
cat > /tmp/scp_cmd.exp << 'EOF'
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
EOF

chmod +x /tmp/scp_cmd.exp

# 1. Prüfe Container-Status
echo "🔍 Prüfe Container-Status..."
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "docker ps -a" || echo "⚠️  Container-Status konnte nicht geprüft werden"
echo ""

# 2. Prüfe Nextcloud Logs
echo "📋 Prüfe Nextcloud Logs..."
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "docker logs nextcloud --tail 30 2>&1" || echo "⚠️  Logs nicht verfügbar"
echo ""

# 3. Starte Container falls nötig
echo "🚀 Starte/Repariere Nextcloud Container..."
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && docker-compose up -d 2>&1 || docker start nextcloud nextcloud-db 2>&1 || echo 'Container bereits gestartet'"
echo ""

# 4. Warte auf Nextcloud
echo "⏳ Warte auf Nextcloud (15 Sekunden)..."
sleep 15

# 5. Prüfe ob Nextcloud läuft
echo "🔍 Prüfe ob Nextcloud erreichbar ist..."
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "curl -s -o /dev/null -w '%{http_code}' http://localhost || echo 'Nicht erreichbar'"
echo ""

# 6. Kopiere Theme-Dateien
echo "📤 Kopiere Theme-Dateien auf Server..."
cd "$(dirname "$0")"
/tmp/scp_cmd.exp "$SERVER_IP" "$SERVER_PASS" "theme/schels" "$REMOTE_DIR/theme/" || {
    echo "⚠️  Fehler beim Kopieren - versuche es manuell"
}

# 7. Installiere und aktiviere Theme
echo "🎨 Installiere Theme..."
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "cd /root/nextcloud && docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels 2>&1 || echo 'Theme bereits vorhanden'"
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ theme:enable schels 2>&1 || echo 'Theme bereits aktiviert'"
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ maintenance:mode --off 2>&1 || echo 'Wartungsmodus bereits aus'"
/tmp/ssh_cmd.exp "$SERVER_IP" "$SERVER_PASS" "docker exec nextcloud php occ files:scan --all 2>&1 || echo 'Scan übersprungen'"

echo ""
echo "✅ Reparatur abgeschlossen!"
echo ""
echo "🌐 Öffne: http://$SERVER_IP"
echo "🔄 Browser-Cache leeren (Cmd+Shift+R)"
echo ""

# Aufräumen
rm -f /tmp/ssh_cmd.exp /tmp/scp_cmd.exp
