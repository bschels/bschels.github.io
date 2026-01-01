#!/usr/bin/env python3
import sys
import os

# CSS-Datei lesen
css_file = "/tmp/css.txt"
if not os.path.exists(css_file):
    print(f"ERROR: CSS file not found: {css_file}")
    sys.exit(1)

with open(css_file, "r", encoding="utf-8") as f:
    css_content = f.read()

# CSS über OCC eintragen
os.chdir("/var/www/html")

# CSS in temporäre Datei schreiben
with open("/tmp/css_input.txt", "w", encoding="utf-8") as f:
    f.write(css_content)

# OCC-Befehl ausführen
import subprocess
result = subprocess.run(
    ["php", "occ", "config:app:set", "theming_customcss", "css", "--value", css_content],
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print("SUCCESS: CSS applied")
    if result.stdout:
        print(result.stdout)
else:
    print(f"ERROR: {result.stderr}")
    if result.stdout:
        print(f"STDOUT: {result.stdout}")
    sys.exit(1)
