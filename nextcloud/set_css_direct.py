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

# CSS über OCC eintragen
os.chdir("/var/www/html")

# Versuche verschiedene Methoden
methods = [
    # Methode 1: Direkt über OCC
    lambda: subprocess.run(
        ["php", "occ", "config:app:set", "theming_customcss", "css", "--value", css_content],
        capture_output=True,
        text=True,
        cwd="/var/www/html"
    ),
    # Methode 2: Über stdin
    lambda: subprocess.run(
        ["php", "occ", "config:app:set", "theming_customcss", "css", "--value=-"],
        input=css_content,
        capture_output=True,
        text=True,
        cwd="/var/www/html"
    )
]

for i, method in enumerate(methods, 1):
    try:
        result = method()
        if result.returncode == 0:
            print(f"SUCCESS: CSS applied via method {i}")
            if result.stdout:
                print(result.stdout)
            sys.exit(0)
        else:
            print(f"Method {i} failed: {result.stderr}")
    except Exception as e:
        print(f"Method {i} error: {e}")

print("ERROR: All methods failed")
sys.exit(1)
