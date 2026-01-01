#!/bin/bash
TEMPLATE="/var/www/html/core/templates/layout.base.php"
SCRIPT_FILE="/tmp/logo-inject.js"

if ! grep -q "schels-logo-container" "$TEMPLATE" 2>/dev/null; then
    JS_CODE=$(cat "$SCRIPT_FILE")
    SCRIPT_TAG="<script>$JS_CODE</script>"
    sed -i "s|</body>|$SCRIPT_TAG\n</body>|" "$TEMPLATE"
    echo "SUCCESS"
else
    echo "ALREADY_EXISTS"
fi
