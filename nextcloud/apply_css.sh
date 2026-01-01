#!/bin/bash
# CSS in Custom CSS App eintragen

CSS_FILE="/tmp/custom-css.txt"

if [ ! -f "$CSS_FILE" ]; then
    echo "ERROR: CSS file not found: $CSS_FILE"
    exit 1
fi

# CSS über OCC eintragen
php occ config:app:set theming_customcss css --value="$(cat $CSS_FILE)" 2>&1

if [ $? -eq 0 ]; then
    echo "SUCCESS: CSS applied to Custom CSS App"
else
    echo "ERROR: Failed to apply CSS"
    exit 1
fi
