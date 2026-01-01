#!/bin/bash
# CSS in Custom CSS App eintragen - Finale Version

CSS_FILE="/tmp/css.txt"
cd /var/www/html

if [ ! -f "$CSS_FILE" ]; then
    echo "ERROR: CSS file not found: $CSS_FILE"
    exit 1
fi

# CSS-Datei lesen
CSS_CONTENT=$(cat "$CSS_FILE")

# CSS über OCC eintragen - verwende printf für sichere Ausgabe
printf '%s' "$CSS_CONTENT" | php occ config:app:set theming_customcss css --value=- 2>&1

if [ $? -eq 0 ]; then
    echo "SUCCESS: CSS applied"
else
    echo "ERROR: Failed to apply CSS"
    exit 1
fi
