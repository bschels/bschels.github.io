#!/bin/bash
# Automatisches Deployment für Hetzner Server
# Verwendet expect für automatische Passwort-Eingabe

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="Dstlfnk*1688"
REMOTE_DIR="/root/nextcloud"

echo "🚀 Automatisches Nextcloud Deployment"
echo "====================================="
echo "Server: $SERVER_IP"
echo ""

# Prüfe ob expect installiert ist
if ! command -v expect &> /dev/null; then
    echo "📦 Installiere expect..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install expect || echo "⚠️  Bitte manuell installieren: brew install expect"
    else
        sudo apt-get install -y expect || sudo yum install -y expect
    fi
fi

# Erstelle expect-Skript für scp
cat > /tmp/scp_upload.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 300
set server_ip [lindex $argv 0]
set server_pass [lindex $argv 1]
set remote_dir [lindex $argv 2]

spawn scp -r docker-compose.yml setup_nextcloud.sh activate_theme.sh README.md theme/ root@$server_ip:$remote_dir/
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
EOF

chmod +x /tmp/scp_upload.exp

# Erstelle expect-Skript für ssh
cat > /tmp/ssh_run.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 600
set server_ip [lindex $argv 0]
set server_pass [lindex $argv 1]
set command [lindex $argv 2]

spawn ssh -o StrictHostKeyChecking=no root@$server_ip "$command"
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
EOF

chmod +x /tmp/ssh_run.exp

echo "📤 Kopiere Dateien auf Server..."
/tmp/scp_upload.exp "$SERVER_IP" "$SERVER_PASS" "$REMOTE_DIR"

echo "✅ Dateien kopiert"
echo ""

echo "🚀 Führe Setup auf Server aus..."
/tmp/ssh_run.exp "$SERVER_IP" "$SERVER_PASS" "cd $REMOTE_DIR && chmod +x setup_nextcloud.sh && ./setup_nextcloud.sh"

echo ""
echo "✅ Deployment abgeschlossen!"
echo ""
echo "📝 Nextcloud sollte jetzt unter http://$SERVER_IP erreichbar sein"
echo ""

# Cleanup
rm -f /tmp/scp_upload.exp /tmp/ssh_run.exp
