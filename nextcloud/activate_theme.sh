#!/bin/bash
# Aktiviert das schels Theme und kopiert CSS neu

set -e

echo "🎨 Aktiviere schels Theme..."

# Kopiere CSS in Container
echo "📋 Kopiere CSS..."
docker cp theme/schels/core/css/styles.css nextcloud:/var/www/html/custom_apps/schels/core/css/styles.css || {
    echo "⚠️  Container nicht gefunden. Starte Nextcloud zuerst mit: docker-compose up -d"
    exit 1
}

# Aktiviere Theme
echo "✅ Aktiviere Theme..."
docker exec nextcloud php occ theme:enable schels

# Wartungsmodus aus
docker exec nextcloud php occ maintenance:mode --off

echo "✅ Theme aktiviert!"
echo ""
echo "🔄 Browser-Cache leeren (Strg+Shift+R) um Änderungen zu sehen."
