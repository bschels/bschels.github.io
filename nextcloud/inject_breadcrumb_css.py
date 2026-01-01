#!/usr/bin/env python3
"""
Fügt Breadcrumb-CSS direkt in Nextcloud ein, damit es garantiert geladen wird
"""
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

print("💉 Füge Breadcrumb-CSS direkt ein...")

# CSS das direkt eingefügt werden soll
breadcrumb_css = """
/* ===== Breadcrumb EXTREM SICHTBAR - GELB MIT ROTEM RAHMEN ===== */
.files-list__breadcrumbs,
body#body-public .files-list__breadcrumbs {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
  padding: 20px 24px !important;
  background: #ffff00 !important;
  border: 5px solid #ff0000 !important;
  margin: 10px 0 !important;
}

nav[aria-label="Aktueller Verzeichnispfad"],
body#body-public nav[aria-label="Aktueller Verzeichnispfad"],
.files-list__breadcrumbs nav,
body#body-public .files-list__breadcrumbs nav {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  color: #000 !important;
  background: #ffff00 !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  padding: 20px 24px !important;
  border: 5px solid #ff0000 !important;
  min-height: 60px !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  position: relative !important;
  z-index: 99999 !important;
  line-height: 1.8 !important;
  margin: 10px 0 !important;
}

nav[aria-label="Aktueller Verzeichnispfad"] button,
body#body-public nav[aria-label="Aktueller Verzeichnispfad"] button,
.files-list__breadcrumbs nav button {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  color: #000 !important;
  font-size: 24px !important;
  font-weight: 700 !important;
  border: 2px solid #000 !important;
  padding: 10px 15px !important;
}

.breadcrumb.breadcrumb--collapsed {
  max-height: none !important;
  height: auto !important;
  overflow: visible !important;
}
"""

child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no root@{SERVER_IP}', encoding='utf-8', timeout=30)
child.logfile_read = sys.stdout

child.expect('password:')
child.sendline(PASSWORD)
child.expect('#')

# Lade aktuelles CSS
print("\n📥 Lade aktuelles CSS...")
child.sendline('docker exec nextcloud bash -c "cd /var/www/html && php occ config:app:get theming_customcss css" > /tmp/current_css_full.txt 2>&1')
child.expect('#', timeout=10)

# Erstelle neues CSS (aktuelles + Breadcrumb CSS)
print("\n➕ Erstelle neues CSS mit Breadcrumbs...")
child.sendline('docker exec nextcloud bash -c \'cd /var/www/html && php occ config:app:get theming_customcss css > /tmp/current.txt && echo "\n' + breadcrumb_css.replace('\n', '\\n').replace('"', '\\"') + '" >> /tmp/current.txt && cat /tmp/current.txt\'')
child.expect('#', timeout=15)

# Wende neues CSS an - verwende die Datei direkt
print("\n💾 Wende CSS an...")
child.sendline('docker exec nextcloud bash -c "cd /var/www/html && cat /tmp/current.txt | php occ config:app:set theming_customcss css --value=-"')
child.expect('#', timeout=20)

print("\n✅ CSS wurde angewendet!")
print("   Bitte Seite neu laden (Cmd+Shift+R)")

child.sendline('exit')
child.expect(pexpect.EOF)
