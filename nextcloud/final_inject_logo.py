#!/usr/bin/env python3
import sys
import os

template_file = "/var/www/html/core/templates/layout.base.php"
script_file = "/tmp/logo-inject.js"

# JavaScript-Code lesen
with open(script_file, "r", encoding="utf-8") as f:
    js_code = f.read()

try:
    with open(template_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Prüfe, ob Script bereits eingefügt wurde
    if "schels-logo-container" in content:
        print("ALREADY_EXISTS")
        sys.exit(0)
    
    # Script vor </body> einfügen
    script_tag = "<script>" + js_code + "</script>"
    
    # Suche nach </body> und füge Script davor ein
    if "</body>" in content:
        # Finde die letzte </body> Stelle
        last_body_pos = content.rfind("</body>")
        if last_body_pos != -1:
            content = content[:last_body_pos] + script_tag + "\n" + content[last_body_pos:]
            with open(template_file, "w", encoding="utf-8") as f:
                f.write(content)
            print("SUCCESS: Script inserted")
        else:
            print("ERROR: </body> tag not found at expected position")
            sys.exit(1)
    else:
        print("ERROR: </body> tag not found")
        sys.exit(1)
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
