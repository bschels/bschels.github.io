#!/bin/bash
# CSS in Custom CSS App eintragen

CSS_FILE="/tmp/css.txt"
cd /var/www/html

if [ ! -f "$CSS_FILE" ]; then
    echo "ERROR: CSS file not found: $CSS_FILE"
    exit 1
fi

# CSS-Datei lesen und über OCC eintragen
CSS_CONTENT=$(cat "$CSS_FILE")

# CSS über OCC eintragen
php occ config:app:set theming_customcss css --value="$CSS_CONTENT" 2>&1

if [ $? -eq 0 ]; then
    echo "SUCCESS: CSS applied to Custom CSS App"
else
    echo "ERROR: Failed to apply CSS"
    exit 1
fi
