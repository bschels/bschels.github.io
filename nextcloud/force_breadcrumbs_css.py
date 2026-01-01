#!/usr/bin/env python3
"""
Fügt Breadcrumb-CSS direkt in die Nextcloud-Konfiguration ein
und leert den Cache
"""
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

print("🔧 Wende Breadcrumb-CSS an und leere Cache...")

# Breadcrumb CSS - EXTREM sichtbar
breadcrumb_css = """
/* ===== Breadcrumb EXTREM SICHTBAR - GELB MIT ROTEM RAHMEN ===== */
body#body-public .files-list__breadcrumbs,
.files-list__breadcrumbs {
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
child.sendline('docker exec nextcloud bash -c "cd /var/www/html && php occ config:app:get theming_customcss css > /tmp/current_css.txt"')
child.expect('#', timeout=10)

# Füge Breadcrumb-CSS hinzu
print("\n➕ Füge Breadcrumb-CSS hinzu...")
child.sendline('docker exec nextcloud bash -c \'cd /var/www/html && cat /tmp/current_css.txt > /tmp/new_css.txt && echo "\n' + breadcrumb_css.replace('\n', '\\n') + '" >> /tmp/new_css.txt\'')
child.expect('#', timeout=10)

# Wende neues CSS an
print("\n💾 Wende neues CSS an...")
child.sendline('docker exec nextcloud bash -c "cd /var/www/html && cat /tmp/new_css.txt | php occ config:app:set theming_customcss css --value=-"')
child.expect('#', timeout=15)

# Leere Nextcloud Cache
print("\n🗑️  Leere Nextcloud Cache...")
child.sendline('docker exec nextcloud bash -c "cd /var/www/html && php occ files:scan --all"')
child.expect('#', timeout=30)

child.sendline('docker exec nextcloud bash -c "cd /var/www/html && php occ maintenance:mode --off"')
child.expect('#', timeout=10)

print("\n✅ Fertig! CSS wurde angewendet und Cache geleert.")
print("   Bitte Seite neu laden (Cmd+Shift+R)")

child.sendline('exit')
child.expect(pexpect.EOF)
