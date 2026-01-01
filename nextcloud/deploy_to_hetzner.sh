#!/bin/bash
# Hilfsskript zum Deployen auf Hetzner
# Kopiert alle Dateien auf den Server und führt Setup aus

set -e

echo "🚀 Nextcloud Deployment auf Hetzner"
echo "====================================="
echo ""

# Prüfe ob IP-Adresse als Parameter übergeben wurde
if [ -z "$1" ]; then
    echo "❌ Bitte IP-Adresse des Hetzner-Servers angeben:"
    echo "   ./deploy_to_hetzner.sh DEINE_IP_ADRESSE"
    echo ""
    echo "Beispiel:"
    echo "   ./deploy_to_hetzner.sh 123.456.789.0"
    exit 1
fi

HETZNER_IP="$1"
REMOTE_USER="root"
REMOTE_DIR="/root/nextcloud"

echo "📋 Server: $REMOTE_USER@$HETZNER_IP"
echo "📁 Ziel: $REMOTE_DIR"
echo ""

# Prüfe ob SSH-Verbindung funktioniert
echo "🔌 Teste SSH-Verbindung..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_USER@$HETZNER_IP" exit 2>/dev/null; then
    echo "❌ SSH-Verbindung fehlgeschlagen!"
    echo ""
    echo "Bitte prüfe:"
    echo "1. IP-Adresse ist korrekt: $HETZNER_IP"
    echo "2. SSH-Key ist eingerichtet (ssh-copy-id)"
    echo "3. Server ist erreichbar"
    echo ""
    echo "Manuell verbinden:"
    echo "   ssh $REMOTE_USER@$HETZNER_IP"
    exit 1
fi

echo "✅ SSH-Verbindung OK"
echo ""

# Erstelle Remote-Verzeichnis
echo "📁 Erstelle Verzeichnis auf Server..."
ssh "$REMOTE_USER@$HETZNER_IP" "mkdir -p $REMOTE_DIR"

# Kopiere alle Dateien
echo "📤 Kopiere Dateien auf Server..."
scp -r docker-compose.yml setup_nextcloud.sh activate_theme.sh README.md theme/ "$REMOTE_USER@$HETZNER_IP:$REMOTE_DIR/"

echo "✅ Dateien kopiert"
echo ""

# Frage ob Setup ausgeführt werden soll
read -p "🤔 Setup-Skript auf Server ausführen? (j/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Jj]$ ]]; then
    echo "🚀 Führe Setup auf Server aus..."
    ssh "$REMOTE_USER@$HETZNER_IP" "cd $REMOTE_DIR && chmod +x setup_nextcloud.sh && ./setup_nextcloud.sh"
    echo ""
    echo "✅ Setup abgeschlossen!"
    echo ""
    echo "📝 Nächste Schritte:"
    echo "1. Öffne http://$HETZNER_IP im Browser"
    echo "2. Ändere Passwörter in docker-compose.yml auf dem Server"
    echo "3. Theme sollte automatisch aktiviert sein"
else
    echo "⏭️  Setup übersprungen"
    echo ""
    echo "📝 Manuell auf Server ausführen:"
    echo "   ssh $REMOTE_USER@$HETZNER_IP"
    echo "   cd $REMOTE_DIR"
    echo "   chmod +x setup_nextcloud.sh"
    echo "   ./setup_nextcloud.sh"
fi

echo ""
echo "✅ Deployment abgeschlossen!"
