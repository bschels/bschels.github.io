#!/usr/bin/env python3
import sys
import os
import subprocess

# CSS-Datei lesen
css_file = "/tmp/css.txt"
if not os.path.exists(css_file):
    print(f"ERROR: CSS file not found: {css_file}")
    sys.exit(1)

with open(css_file, "r", encoding="utf-8") as f:
    css_content = f.read()

# CSS über OCC eintragen - verwende stdin
os.chdir("/var/www/html")

process = subprocess.Popen(
    ["php", "occ", "config:app:set", "theming_customcss", "css", "--value", "-"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

stdout, stderr = process.communicate(input=css_content)

if process.returncode == 0:
    print("SUCCESS: CSS applied")
    if stdout:
        print(stdout)
else:
    print(f"ERROR: {stderr}")
    if stdout:
        print(f"STDOUT: {stdout}")
    sys.exit(1)
