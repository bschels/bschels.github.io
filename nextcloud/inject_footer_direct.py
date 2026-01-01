#!/usr/bin/env python3
"""
Fügt Footer-JavaScript direkt in Nextcloud ein
"""

import pexpect
import sys
import os
import base64

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

# Base64 encodieren für sichere Übertragung
js_code_b64 = base64.b64encode(js_code.encode('utf-8')).decode('utf-8')

print(f"✅ JavaScript-Datei gelesen ({len(js_code)} Zeichen)")
print("")

# Verbinde zum Server
child = pexpect.spawn(f"ssh -o StrictHostKeyChecking=no root@{SERVER_IP}", encoding="utf-8", timeout=30)
child.logfile_read = sys.stdout

try:
    child.expect("password:", timeout=10)
    child.sendline(PASSWORD)
    child.expect("#", timeout=10)
    
    # Erstelle Python-Script auf Server, das das JavaScript einfügt
    print("💉 Erstelle Python-Script auf Server...")
    
    # Python-Script als Base64-String
    python_script = f'''import base64
import sys

template_file = "/var/www/html/core/templates/layout.base.php"
js_code_b64 = "{js_code_b64}"

try:
    # Decode JavaScript
    js_code = base64.b64decode(js_code_b64).decode('utf-8')
    
    with open(template_file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "footer-bottom-container" in content:
        print("ALREADY_EXISTS")
        sys.exit(0)
    
    script_tag = "<script>" + js_code + "</script>"
    last_body_pos = content.rfind("</body>")
    if last_body_pos != -1:
        content = content[:last_body_pos] + script_tag + "\\n" + content[last_body_pos:]
        with open(template_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("SUCCESS")
    else:
        print("ERROR: </body> not found")
        sys.exit(1)
except Exception as e:
    print(f"ERROR: {{e}}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
'''
    
    # Kopiere Python-Script auf Server
    child.sendline(f"cat > /tmp/inject_footer_direct.py << 'PY_EOF'\n{python_script}\nPY_EOF")
    child.expect("#", timeout=10)
    
    # Kopiere Python-Script in Container
    print("📦 Kopiere Python-Script in Container...")
    child.sendline("docker cp /tmp/inject_footer_direct.py nextcloud:/tmp/inject_footer_direct.py")
    child.expect("#", timeout=10)
    
    # Führe Python-Script im Container aus
    print("🚀 Führe Python-Script im Container aus...")
    child.sendline("docker exec nextcloud python3 /tmp/inject_footer_direct.py")
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
    import traceback
    traceback.print_exc()
    sys.exit(1)
