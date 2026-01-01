#!/bin/bash
# Setup-Skript für Nextcloud auf Hetzner CX11
# Installiert Docker, Nextcloud und aktiviert das Custom Theme

set -e

echo "🚀 Nextcloud Setup für architekturbüro schels"
echo "=============================================="

# Prüfe ob Docker installiert ist
if ! command -v docker &> /dev/null; then
    echo "📦 Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installiert. Bitte neu einloggen oder 'newgrp docker' ausführen."
    exit 0
fi

# Prüfe ob docker-compose installiert ist
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installiere docker-compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ docker-compose installiert"
fi

# Erstelle Theme-Verzeichnis im Container
echo "📁 Erstelle Theme-Verzeichnis..."
mkdir -p theme/schels/core/css
mkdir -p theme/schels/appinfo

# Kopiere Theme-Dateien (wenn vorhanden)
if [ -f "theme/schels/core/css/styles.css" ]; then
    echo "✅ Theme-Dateien gefunden"
else
    echo "⚠️  Theme-Dateien nicht gefunden. Bitte manuell kopieren."
fi

# Starte Nextcloud
echo "🐳 Starte Nextcloud Container..."
docker-compose up -d

echo "⏳ Warte auf Nextcloud (30 Sekunden)..."
sleep 30

# Aktiviere Theme
echo "🎨 Aktiviere Theme..."
docker exec nextcloud php occ theme:enable schels || echo "⚠️  Theme konnte nicht aktiviert werden. Bitte manuell: docker exec nextcloud php occ theme:enable schels"

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Öffne http://$(hostname -I | awk '{print $1}') im Browser"
echo "2. Erstelle Admin-Account (falls noch nicht geschehen)"
echo "3. Gehe zu Einstellungen > Erscheinungsbild > Theme: 'schels'"
echo "4. Ändere Passwörter in docker-compose.yml!"
echo ""
echo "🔧 Theme manuell aktivieren:"
echo "   docker exec nextcloud php occ theme:enable schels"
echo ""
echo "🔄 Theme-CSS aktualisieren:"
echo "   docker cp theme/schels/core/css/styles.css nextcloud:/var/www/html/custom_apps/schels/core/css/styles.css"
echo "   docker exec nextcloud php occ maintenance:mode --off"
