#!/usr/bin/env python3
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

print("🎨 Wende Custom CSS an...")

# CSS-Datei lesen
with open("custom-css-schels.txt", "r", encoding="utf-8") as f:
    css_content = f.read()

child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no root@{SERVER_IP}', timeout=300)
child.logfile = sys.stdout.buffer

child.expect(['password:', '# ', '$ '])
if child.after == b'password:':
    child.sendline(PASSWORD)
    child.expect(['# ', '$ '])

# CSS auf Server kopieren
child.sendline("docker cp /tmp/custom-css.txt nextcloud:/tmp/custom-css.txt")
child.expect(['# ', '$ '])

# CSS in Nextcloud anwenden
child.sendline("docker exec nextcloud bash -c 'cd /var/www/html && cat /tmp/custom-css.txt | php occ config:app:set theming_customcss css --value=-'")
child.expect(['# ', '$ '], timeout=60)

child.sendline("echo '✅ CSS erfolgreich angewendet!'")
child.expect(['# ', '$ '])

child.sendline("exit")
child.expect(pexpect.EOF)

child.close()
print(f"\n✅ CSS angewendet! (Exit Code: {child.exitstatus})")
sys.exit(child.exitstatus)
