#!/bin/bash
# Komplettes Setup-Skript für Hetzner Browser-Console
# Einfach in die Hetzner Console kopieren und ausführen

set -e

echo "🚀 Nextcloud Setup für architekturbüro schels"
echo "=============================================="

# Installiere Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installiert"
fi

# Installiere docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installiere docker-compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ docker-compose installiert"
fi

# Erstelle Verzeichnisstruktur
echo "📁 Erstelle Verzeichnisse..."
mkdir -p /root/nextcloud/theme/schels/core/css
mkdir -p /root/nextcloud/theme/schels/appinfo
cd /root/nextcloud

# Erstelle docker-compose.yml
cat > docker-compose.yml << 'DOCKEREOF'
version: "3.8"

services:
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    restart: always
    ports:
      - "80:80"
    volumes:
      - nextcloud:/var/www/html
      - ./theme/schels:/var/www/html/custom_apps/schels
    environment:
      - NEXTCLOUD_ADMIN_USER=admin
      - NEXTCLOUD_ADMIN_PASSWORD=ChangeMe123!
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=ChangeMe123!
    depends_on:
      - db

  db:
    image: mariadb:10.11
    container_name: nextcloud-db
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=ChangeMe123!
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=ChangeMe123!
    volumes:
      - db:/var/lib/mysql

volumes:
  nextcloud:
  db:
DOCKEREOF

# Erstelle Theme info.xml
cat > theme/schels/appinfo/info.xml << 'XMLEOF'
<?xml version="1.0"?>
<info>
  <id>schels</id>
  <name>architekturbüro schels</name>
  <summary>Corporate Design Theme für architekturbüro schels</summary>
  <description>Minimalistisches Theme mit schwarzem Header, Avenir Next Font und ohne runde Ecken</description>
  <version>1.0.0</version>
  <licence>MIT</licence>
  <author>Benjamin Schels</author>
  <namespace>Schels</namespace>
  <default_enable/>
  <types>
    <filesystem/>
  </types>
  <dependencies>
    <nextcloud min-version="25" max-version="28"/>
  </dependencies>
</info>
XMLEOF

# Erstelle Theme CSS
cat > theme/schels/core/css/styles.css << 'CSSEOF'
/* Nextcloud Theme: architekturbüro schels */
/* Corporate Design: Schwarz, keine runden Ecken, Avenir Next Font */

/* Globale Einstellungen - Keine runden Ecken */
* {
  border-radius: 0 !important;
}

/* Font: Avenir Next (System Font) */
body,
#header,
#app-navigation,
#app-content,
button,
input,
select,
textarea {
  font-family: -apple-system, BlinkMacSystemFont, 'Avenir Next', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
  font-weight: 200 !important;
}

/* Header - Schwarz */
#header {
  background: #000 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  padding: 12px 20px !important;
}

#header .header-left,
#header .header-right {
  color: #fff !important;
}

#header .logo {
  color: #fff !important;
  font-size: 1.4em !important;
  font-weight: 200 !important;
  letter-spacing: 0.2em !important;
  line-height: 1.2 !important;
}

#header .logo span {
  display: block;
}

/* Navigation - Minimalistisch */
#app-navigation {
  background: #fff !important;
  border-right: 1px solid #e0e0e0 !important;
}

#app-navigation a {
  color: #000 !important;
  font-weight: 200 !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
  border-radius: 0 !important;
  transition: all 0.2s ease !important;
}

#app-navigation a:hover,
#app-navigation a:focus,
#app-navigation li.active a {
  background: #000 !important;
  color: #fff !important;
}

/* Buttons - Schwarz, keine runden Ecken */
button.primary,
.button.primary,
button[type="submit"].primary,
.primary {
  background: #000 !important;
  border: 1px solid #000 !important;
  color: #fff !important;
  font-weight: 200 !important;
  letter-spacing: 0.1em !important;
  padding: 10px 20px !important;
  border-radius: 0 !important;
  transition: all 0.2s ease !important;
  text-transform: uppercase !important;
}

button.primary:hover,
.button.primary:hover,
button[type="submit"].primary:hover {
  background: #000 !important;
  color: #fff !important;
  opacity: 0.9 !important;
}

button,
.button {
  border-radius: 0 !important;
  font-weight: 200 !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
}

/* Input-Felder - Keine runden Ecken */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="search"],
input[type="number"],
textarea,
select {
  border: 1px solid #ccc !important;
  border-radius: 0 !important;
  padding: 8px 12px !important;
  font-family: inherit !important;
  font-weight: 200 !important;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="search"]:focus,
textarea:focus,
select:focus {
  border-color: #000 !important;
  outline: 0 !important;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important;
}

/* Files App - Dateiliste */
.files-fileList {
  border: none !important;
}

.files-fileList tr {
  border-bottom: 1px solid #e0e0e0 !important;
}

.files-fileList tr:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.files-fileList .filename {
  font-weight: 200 !important;
  letter-spacing: 0.08em !important;
  color: #000 !important;
}

.files-fileList .fileinfo {
  font-size: 0.85em !important;
  color: #555 !important;
  font-weight: 200 !important;
}

/* Toolbar */
.toolbar {
  background: #fff !important;
  border-bottom: 1px solid #e0e0e0 !important;
  padding: 1rem 2rem !important;
}

.breadcrumb {
  font-weight: 200 !important;
  letter-spacing: 0.08em !important;
}

.breadcrumb a {
  color: #555 !important;
  text-decoration: none !important;
}

.breadcrumb a:hover {
  color: #000 !important;
}

/* Cards - Minimalistisch */
.card,
.box {
  border: 1px solid #e0e0e0 !important;
  border-radius: 0 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

/* Tabs */
.tab {
  border-radius: 0 !important;
  font-weight: 200 !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
}

.tab.active {
  background: #000 !important;
  color: #fff !important;
  border-color: #000 !important;
}

/* Dropdowns */
.dropdown-menu {
  border-radius: 0 !important;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.dropdown-menu li a {
  font-weight: 200 !important;
  letter-spacing: 0.08em !important;
}

.dropdown-menu li a:hover {
  background: #000 !important;
  color: #fff !important;
}

/* Modals */
.modal-container {
  border-radius: 0 !important;
}

.modal-title {
  font-weight: 200 !important;
  letter-spacing: 0.2em !important;
  text-transform: uppercase !important;
}

/* Icons - Anpassung falls nötig */
.icon {
  border-radius: 0 !important;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  body {
    background: #111 !important;
    color: #e5e5e5 !important;
  }

  #app-navigation {
    background: #111 !important;
    border-right-color: rgba(255, 255, 255, 0.1) !important;
  }

  #app-navigation a {
    color: #e5e5e5 !important;
  }

  .files-fileList tr {
    border-bottom-color: rgba(255, 255, 255, 0.1) !important;
  }

  .files-fileList tr:hover {
    background: rgba(255, 255, 255, 0.05) !important;
  }

  .toolbar {
    background: #111 !important;
    border-bottom-color: rgba(255, 255, 255, 0.1) !important;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="search"],
  textarea,
  select {
    background: #111 !important;
    color: #e5e5e5 !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }
}
CSSEOF

echo "✅ Dateien erstellt"
echo ""

# Starte Nextcloud
echo "🐳 Starte Nextcloud Container..."
docker-compose up -d

echo "⏳ Warte auf Nextcloud (60 Sekunden)..."
sleep 60

# Kopiere Theme in Container
echo "📋 Kopiere Theme in Container..."
docker cp theme/schels nextcloud:/var/www/html/custom_apps/

# Aktiviere Theme
echo "🎨 Aktiviere Theme..."
docker exec nextcloud php occ theme:enable schels || echo "⚠️  Theme wird später aktiviert"

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📝 Nextcloud ist jetzt unter http://$(hostname -I | awk '{print $1}') erreichbar"
echo "📝 Admin-Login: admin / ChangeMe123!"
echo ""
echo "⚠️  WICHTIG: Ändere die Passwörter in docker-compose.yml!"
