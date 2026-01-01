#!/bin/bash
# Remote-Setup-Skript für Domain files.schels.info
# Führt das Domain-Setup auf dem Hetzner-Server aus

set -e

SERVER_IP="46.224.150.138"
SERVER_PASS="Dstlfnk*1688"
DOMAIN="files.schels.info"

echo "🌐 Nextcloud Domain-Setup (Remote): $DOMAIN"
echo "============================================="
echo ""

# Prüfe ob expect installiert ist
if ! command -v expect &> /dev/null; then
    echo "❌ 'expect' ist nicht installiert"
    echo "   Installiere mit: brew install expect (macOS) oder apt-get install expect (Linux)"
    exit 1
fi

# Finde Skript-Pfad (funktioniert sowohl vom Hauptverzeichnis als auch aus nextcloud/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_SCRIPT="$SCRIPT_DIR/setup_domain.sh"

if [ ! -f "$SETUP_SCRIPT" ]; then
    echo "❌ setup_domain.sh nicht gefunden in $SETUP_SCRIPT"
    exit 1
fi

# Kopiere Setup-Skript auf Server
echo "📤 Kopiere Setup-Skript auf Server..."
/usr/bin/expect << EOF
set timeout 30
spawn scp -o StrictHostKeyChecking=no "$SETUP_SCRIPT" root@${SERVER_IP}:/root/setup_domain.sh
expect {
    "password:" {
        send "${SERVER_PASS}\r"
        exp_continue
    }
    eof
}
EOF

echo "✅ Skript kopiert"
echo ""

# Führe Setup auf Server aus
echo "🚀 Führe Domain-Setup auf Server aus..."
echo "   ⚠️  Dies kann einige Minuten dauern..."
echo ""

/usr/bin/expect << 'EXPECT_EOF'
set timeout 600
log_user 1

spawn ssh -o StrictHostKeyChecking=no root@46.224.150.138 "chmod +x /root/setup_domain.sh && /root/setup_domain.sh"

expect {
    "password:" {
        send "Dstlfnk*168\r"
        exp_continue
    }
    "DNS ist konfiguriert?" {
        send "j\r"
        exp_continue
    }
    eof
}

catch wait result
set exit_code [lindex $result 3]
if {$exit_code != 0} {
    exit $exit_code
}
EXPECT_EOF

echo ""
echo "✅ Domain-Setup abgeschlossen!"
echo ""
echo "📝 WICHTIG: Stelle sicher, dass DNS A-Record für $DOMAIN auf $SERVER_IP zeigt!"
echo "   Dann sollte Nextcloud unter https://$DOMAIN erreichbar sein."
