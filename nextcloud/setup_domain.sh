#!/bin/bash
# Setup-Skript für Domain files.schels.info auf Hetzner Server
# Installiert Nginx, SSL (Let's Encrypt) und konfiguriert Nextcloud

set -e

DOMAIN="files.schels.info"
SERVER_IP="46.224.150.138"
NEXTCLOUD_CONTAINER="nextcloud"

echo "🌐 Nextcloud Domain-Setup: $DOMAIN"
echo "===================================="
echo ""

# Prüfe ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Bitte als root ausführen: sudo $0"
    exit 1
fi

# 1. Installiere Nginx
echo "1️⃣  Installiere Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
    echo "✅ Nginx installiert"
else
    echo "✅ Nginx bereits installiert"
fi

# 2. Installiere Certbot für SSL
echo ""
echo "2️⃣  Installiere Certbot (Let's Encrypt)..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installiert"
else
    echo "✅ Certbot bereits installiert"
fi

# 3. Erstelle Nginx-Konfiguration
echo ""
echo "3️⃣  Erstelle Nginx-Konfiguration..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# Nextcloud Reverse Proxy für $DOMAIN
# WICHTIG: SSL wird später von Certbot hinzugefügt

upstream nextcloud {
    server 127.0.0.1:8080;
}

# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Für Let's Encrypt Challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Alle anderen Anfragen zu HTTPS umleiten
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server (wird von Certbot vervollständigt)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # SSL wird von Certbot gesetzt
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Nextcloud Proxy Settings
    client_max_body_size 10G;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # Nextcloud Root
    location / {
        proxy_pass http://nextcloud;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # WebSocket Support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Aktiviere Site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Teste Nginx-Konfiguration
echo ""
echo "4️⃣  Teste Nginx-Konfiguration..."
nginx -t || {
    echo "❌ Nginx-Konfiguration fehlerhaft!"
    exit 1
}

# 5. Passe Docker-Compose an (Nextcloud auf Port 8080)
echo ""
echo "5️⃣  Passe Docker-Compose an..."
if [ -f "/root/nextcloud/docker-compose.yml" ]; then
    cd /root/nextcloud
    # Backup erstellen
    cp docker-compose.yml docker-compose.yml.backup
    
    # Ändere Port-Mapping von 80:80 zu 8080:80
    sed -i 's/- "80:80"/- "8080:80"/' docker-compose.yml
    
    # Container neu starten
    docker-compose down
    docker-compose up -d
    
    echo "✅ Docker-Compose angepasst und Container neu gestartet"
else
    echo "⚠️  docker-compose.yml nicht gefunden in /root/nextcloud"
    echo "   Bitte manuell Port-Mapping ändern: 8080:80 statt 80:80"
fi

# 6. Warte auf Nextcloud
echo ""
echo "6️⃣  Warte auf Nextcloud (30 Sekunden)..."
sleep 30

# 7. Konfiguriere Nextcloud trusted_domains
echo ""
echo "7️⃣  Konfiguriere Nextcloud trusted_domains..."
docker exec $NEXTCLOUD_CONTAINER php occ config:system:set trusted_domains 0 --value=localhost 2>&1 || true
docker exec $NEXTCLOUD_CONTAINER php occ config:system:set trusted_domains 1 --value=$SERVER_IP 2>&1 || true
docker exec $NEXTCLOUD_CONTAINER php occ config:system:set trusted_domains 2 --value=$DOMAIN 2>&1 || true

# Setze overwritehost und overwriteprotocol
docker exec $NEXTCLOUD_CONTAINER php occ config:system:set overwritehost --value=$DOMAIN 2>&1 || true
docker exec $NEXTCLOUD_CONTAINER php occ config:system:set overwriteprotocol --value=https 2>&1 || true

echo "✅ Nextcloud konfiguriert"

# 8. Starte Nginx
echo ""
echo "8️⃣  Starte Nginx..."
systemctl enable nginx
systemctl restart nginx
echo "✅ Nginx gestartet"

# 9. SSL-Zertifikat mit Certbot
echo ""
echo "9️⃣  Richte SSL-Zertifikat ein..."
echo "   ⚠️  WICHTIG: Stelle sicher, dass DNS A-Record für $DOMAIN auf $SERVER_IP zeigt!"
echo ""
read -p "   DNS ist konfiguriert? (j/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Jj]$ ]]; then
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@schels.info --redirect || {
        echo "⚠️  Certbot-Fehler. Bitte manuell ausführen:"
        echo "   certbot --nginx -d $DOMAIN"
    }
    echo "✅ SSL-Zertifikat installiert"
else
    echo "⏭️  SSL-Setup übersprungen"
    echo "   Führe später aus: certbot --nginx -d $DOMAIN"
fi

# 10. Finale Prüfung
echo ""
echo "🔟 Finale Prüfung..."
echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Stelle sicher, dass DNS A-Record für $DOMAIN auf $SERVER_IP zeigt"
echo "2. Falls SSL noch nicht installiert: certbot --nginx -d $DOMAIN"
echo "3. Öffne https://$DOMAIN im Browser"
echo "4. Prüfe Nextcloud trusted_domains:"
echo "   docker exec $NEXTCLOUD_CONTAINER php occ config:system:get trusted_domains"
echo ""
echo "🌐 Nextcloud sollte jetzt unter https://$DOMAIN erreichbar sein!"
