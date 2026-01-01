#!/usr/bin/env python3
import sys
import subprocess
import os

# CSS-Datei lesen
css_file = "/tmp/custom-css.txt"
if not os.path.exists(css_file):
    print(f"ERROR: CSS file not found: {css_file}")
    sys.exit(1)

with open(css_file, "r", encoding="utf-8") as f:
    css_content = f.read()

# CSS in Custom CSS App eintragen
try:
    # OCC-Befehl ausführen
    result = subprocess.run(
        ["php", "occ", "config:app:set", "theming_customcss", "css", "--value", css_content],
        capture_output=True,
        text=True,
        cwd="/var/www/html"
    )
    
    if result.returncode == 0:
        print("SUCCESS: CSS applied to Custom CSS App")
    else:
        print(f"ERROR: {result.stderr}")
        print(f"STDOUT: {result.stdout}")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
