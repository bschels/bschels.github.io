#!/usr/bin/env python3
"""
Setup-Skript für files.schels.info
Führt alle Schritte direkt über SSH aus
"""

import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"
DOMAIN = "files.schels.info"

def run_command(cmd, timeout=300):
    """Führt einen SSH-Befehl aus"""
    print(f"🔧 Führe aus: {cmd[:50]}...")
    child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no root@{SERVER_IP} "{cmd}"', timeout=timeout)
    child.logfile = sys.stdout.buffer
    index = child.expect(['password:', pexpect.EOF, pexpect.TIMEOUT])
    if index == 0:
        child.sendline(PASSWORD)
        child.expect(pexpect.EOF)
    return child.exitstatus

def run_interactive():
    """Führt interaktive Befehle aus"""
    print("🔌 Verbinde mit Server...")
    child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no root@{SERVER_IP}', timeout=600)
    child.logfile = sys.stdout.buffer
    
    index = child.expect(['password:', '# ', '$ ', pexpect.EOF])
    if index == 0:
        child.sendline(PASSWORD)
        child.expect(['# ', '$ '])
    
    commands = [
        "echo '1️⃣  Installiere Nginx und Certbot...'",
        "apt-get update -qq && apt-get install -y nginx certbot python3-certbot-nginx",
        "echo '2️⃣  Erstelle Nginx-Konfiguration...'",
        """cat > /etc/nginx/sites-available/files.schels.info << 'NGINXEOF'
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
        client_max_body_size 10G;
        client_body_timeout 300s;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINXEOF""",
        "ln -sf /etc/nginx/sites-available/files.schels.info /etc/nginx/sites-enabled/",
        "rm -f /etc/nginx/sites-enabled/default",
        "echo '3️⃣  Teste Nginx...'",
        "nginx -t",
        "echo '4️⃣  Passe Docker-Compose an...'",
        "cd /root/nextcloud && cp docker-compose.yml docker-compose.yml.backup",
        "sed -i 's/- \"80:80\"/- \"8080:80\"/' /root/nextcloud/docker-compose.yml",
        "cd /root/nextcloud && docker-compose down && docker-compose up -d",
        "echo '5️⃣  Warte auf Nextcloud...'",
        "sleep 30",
        "echo '6️⃣  Konfiguriere Nextcloud...'",
        "docker exec nextcloud php occ config:system:set trusted_domains 0 --value=localhost 2>&1 || true",
        f"docker exec nextcloud php occ config:system:set trusted_domains 1 --value={SERVER_IP} 2>&1 || true",
        f"docker exec nextcloud php occ config:system:set trusted_domains 2 --value={DOMAIN} 2>&1 || true",
        f"docker exec nextcloud php occ config:system:set overwritehost --value={DOMAIN} 2>&1 || true",
        "docker exec nextcloud php occ config:system:set overwriteprotocol --value=https 2>&1 || true",
        "echo '7️⃣  Starte Nginx...'",
        "systemctl enable nginx && systemctl restart nginx",
        "echo '8️⃣  Richte SSL ein...'",
        f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos --email admin@schels.info --redirect",
        "echo '✅ Setup abgeschlossen!'",
        "exit"
    ]
    
    for cmd in commands:
        child.sendline(cmd)
        child.expect(['# ', '$ ', pexpect.EOF], timeout=300)
    
    child.close()
    return child.exitstatus

if __name__ == "__main__":
    print("🌐 Nextcloud Domain-Setup: files.schels.info")
    print("=" * 50)
    print()
    
    try:
        exit_code = run_interactive()
        if exit_code == 0:
            print("\n✅ Setup erfolgreich abgeschlossen!")
            print(f"🌐 Nextcloud sollte jetzt unter https://{DOMAIN} erreichbar sein!")
        else:
            print(f"\n❌ Setup mit Fehler beendet (Exit Code: {exit_code})")
            sys.exit(exit_code)
    except Exception as e:
        print(f"\n❌ Fehler: {e}")
        sys.exit(1)
