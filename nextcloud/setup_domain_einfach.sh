#!/bin/bash
# Einfaches Setup-Skript für files.schels.info
# Führe dieses Skript direkt auf dem Server aus: bash setup_domain_einfach.sh

set -e

DOMAIN="files.schels.info"
SERVER_IP="46.224.150.138"

echo "🌐 Nextcloud Domain-Setup: $DOMAIN"
echo "===================================="
echo ""

# 1. Installiere Nginx und Certbot
echo "1️⃣  Installiere Nginx und Certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx
echo "✅ Installiert"
echo ""

# 2. Erstelle Nginx-Konfiguration
echo "2️⃣  Erstelle Nginx-Konfiguration..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINXEOF'
upstream nextcloud {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    listen [::]:80;
    server_name files.schels.info;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name files.schels.info;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    client_max_body_size 10G;
    client_body_timeout 300s;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    location / {
        proxy_pass http://nextcloud;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

# Aktiviere Site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Teste Nginx
echo "3️⃣  Teste Nginx-Konfiguration..."
nginx -t
echo "✅ Nginx-Konfiguration OK"
echo ""

# 4. Passe Docker-Compose an
echo "4️⃣  Passe Docker-Compose an..."
cd /root/nextcloud
cp docker-compose.yml docker-compose.yml.backup
sed -i 's/- "80:80"/- "8080:80"/' docker-compose.yml
docker-compose down
docker-compose up -d
echo "✅ Docker-Compose angepasst"
echo ""

# 5. Warte auf Nextcloud
echo "5️⃣  Warte auf Nextcloud (30 Sekunden)..."
sleep 30
echo ""

# 6. Konfiguriere Nextcloud
echo "6️⃣  Konfiguriere Nextcloud..."
docker exec nextcloud php occ config:system:set trusted_domains 0 --value=localhost 2>&1 || true
docker exec nextcloud php occ config:system:set trusted_domains 1 --value=$SERVER_IP 2>&1 || true
docker exec nextcloud php occ config:system:set trusted_domains 2 --value=$DOMAIN 2>&1 || true
docker exec nextcloud php occ config:system:set overwritehost --value=$DOMAIN 2>&1 || true
docker exec nextcloud php occ config:system:set overwriteprotocol --value=https 2>&1 || true
echo "✅ Nextcloud konfiguriert"
echo ""

# 7. Starte Nginx
echo "7️⃣  Starte Nginx..."
systemctl enable nginx
systemctl restart nginx
echo "✅ Nginx gestartet"
echo ""

# 8. SSL-Zertifikat
echo "8️⃣  Richte SSL-Zertifikat ein..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@schels.info --redirect
echo "✅ SSL-Zertifikat installiert"
echo ""

echo "✅ Setup abgeschlossen!"
echo ""
echo "🌐 Nextcloud sollte jetzt unter https://$DOMAIN erreichbar sein!"
echo ""
echo "Prüfe trusted_domains:"
echo "docker exec nextcloud php occ config:system:get trusted_domains"
