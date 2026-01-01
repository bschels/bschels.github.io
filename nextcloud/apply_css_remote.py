#!/usr/bin/env python3
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

# CSS-Datei lesen
with open("custom-css-schels.txt", "r", encoding="utf-8") as f:
    css_content = f.read()

print("🎨 Wende Custom CSS an...")

child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no root@{SERVER_IP}', timeout=300)
child.logfile = sys.stdout.buffer

child.expect(['password:', '# ', '$ '])
if child.after == b'password:':
    child.sendline(PASSWORD)
    child.expect(['# ', '$ '])

# CSS in temporäre Datei auf Server schreiben
child.sendline("cat > /tmp/css_content.txt << 'CSSEOF'")
child.expect("> ")
child.send(css_content)
child.sendline("CSSEOF")
child.expect("# ")

# CSS in Container kopieren
child.sendline("docker cp /tmp/css_content.txt nextcloud:/tmp/css.txt")
child.expect("# ")

# CSS über OCC anwenden
child.sendline("docker exec nextcloud bash -c 'cd /var/www/html && php occ config:app:set theming_customcss css --value=\"$(cat /tmp/css.txt)\"'")
child.expect("# ")

child.sendline("echo '✅ CSS erfolgreich angewendet!'")
child.expect("# ")
child.sendline("exit")
child.expect(pexpect.EOF)

child.close()
print(f"\n✅ CSS angewendet! (Exit Code: {child.exitstatus})")
sys.exit(child.exitstatus)
