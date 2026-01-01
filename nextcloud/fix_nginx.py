#!/usr/bin/env python3
import pexpect
import sys

SERVER_IP = "46.224.150.138"
PASSWORD = "mmbm3LTn7kju"

print("🔧 Korrigiere Nginx-Konfiguration...")

child = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no root@{SERVER_IP}', timeout=300)
child.logfile = sys.stdout.buffer

child.expect(['password:', '# ', '$ '])
if child.after == b'password:':
    child.sendline(PASSWORD)
    child.expect(['# ', '$ '])

# Erstelle korrigierte Nginx-Konfiguration (nur HTTP, Certbot fügt HTTPS hinzu)
nginx_config = """upstream nextcloud {
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
    }
}
"""

commands = [
    f"cat > /etc/nginx/sites-available/files.schels.info << 'NGINXEOF'\n{nginx_config}NGINXEOF",
    "nginx -t",
    "systemctl restart nginx",
    "sleep 5",
    "certbot --nginx -d files.schels.info --non-interactive --agree-tos --email admin@schels.info --redirect",
    "echo '✅ Setup abgeschlossen! 🌐 https://files.schels.info'",
    "exit"
]

for cmd in commands:
    child.sendline(cmd)
    child.expect(['# ', '$ ', pexpect.EOF], timeout=300)

child.close()
print(f"\n✅ Nginx-Konfiguration korrigiert! (Exit Code: {child.exitstatus})")
sys.exit(child.exitstatus)
