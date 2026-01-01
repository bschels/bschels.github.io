#!/usr/bin/env python3
"""
Fügt Footer-JavaScript in Nextcloud ein
"""

import pexpect
import sys
import os

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FOOTER_JS = os.path.join(SCRIPT_DIR, "footer-inject.js")

print("📝 Füge Footer-JavaScript in Nextcloud ein...")
print("")

# Lese JavaScript-Datei
if not os.path.exists(FOOTER_JS):
    print(f"❌ footer-inject.js nicht gefunden: {FOOTER_JS}")
    sys.exit(1)

with open(FOOTER_JS, "r", encoding="utf-8") as f:
    js_code = f.read()

print(f"✅ JavaScript-Datei gelesen ({len(js_code)} Zeichen)")
print("")

# Verbinde zum Server
child = pexpect.spawn(f"ssh -o StrictHostKeyChecking=no root@{SERVER_IP}", encoding="utf-8", timeout=30)
child.logfile_read = sys.stdout

try:
    child.expect("password:", timeout=10)
    child.sendline(PASSWORD)
    child.expect("#", timeout=10)
    
    # Kopiere JavaScript auf Server
    print("📤 Kopiere JavaScript auf Server...")
    child.sendline(f"cat > /tmp/footer-inject.js << 'JS_EOF'\n{js_code}\nJS_EOF")
    child.expect("#", timeout=10)
    
    # Füge JavaScript in layout.base.php ein
    print("💉 Füge JavaScript in Nextcloud ein...")
    
    # Erstelle Python-Script auf Server, das das JavaScript einfügt
    inject_script = f"""
import re

template_file = "/var/www/html/core/templates/layout.base.php"
js_file = "/tmp/footer-inject.js"

try:
    with open(js_file, "r", encoding="utf-8") as f:
        js_code = f.read()
    
    with open(template_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Prüfe, ob Script bereits eingefügt wurde
    if "footer-bottom-container" in content:
        print("ALREADY_EXISTS")
        exit(0)
    
    script_tag = "<script>" + js_code + "</script>"
    
    # Finde die letzte </body> Stelle
    last_body_pos = content.rfind("</body>")
    if last_body_pos != -1:
        content = content[:last_body_pos] + script_tag + "\\n" + content[last_body_pos:]
        with open(template_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("SUCCESS: Footer script inserted")
    else:
        print("ERROR: </body> tag not found")
        exit(1)
        
except Exception as e:
    print(f"ERROR: {{e}}")
    import traceback
    traceback.print_exc()
    exit(1)
"""
    
    child.sendline(f"cat > /tmp/inject_footer.py << 'PY_EOF'\n{inject_script}\nPY_EOF")
    child.expect("#", timeout=10)
    
    # Kopiere Python-Script in Container
    print("📦 Kopiere Python-Script in Container...")
    child.sendline("docker cp /tmp/inject_footer.py nextcloud:/tmp/inject_footer.py")
    child.expect("#", timeout=10)
    
    # Führe Python-Script im Nextcloud-Container aus
    print("🚀 Führe Python-Script im Container aus...")
    child.sendline("docker exec nextcloud python3 /tmp/inject_footer.py")
    child.expect("#", timeout=15)
    
    print("")
    print("✅ Footer-JavaScript eingefügt!")
    print("")
    
    child.sendline("exit")
    child.expect(pexpect.EOF)
    
except pexpect.TIMEOUT:
    print("❌ Timeout beim Verbinden")
    sys.exit(1)
except Exception as e:
    print(f"❌ Fehler: {e}")
    sys.exit(1)
