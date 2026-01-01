# Domain-Setup: files.schels.info

Anleitung zum Einrichten der Domain `files.schels.info` für Nextcloud auf dem Hetzner-Server.

## 📋 Voraussetzungen

1. **DNS-Konfiguration**: Der A-Record für `files.schels.info` muss auf die Server-IP `46.224.150.138` zeigen
2. **SSH-Zugriff**: Zugriff auf den Hetzner-Server als root
3. **Nextcloud läuft**: Nextcloud sollte bereits installiert und lauffähig sein

## 🚀 Option 1: Automatisches Setup (von lokal)

Das Skript führt alle Schritte automatisch aus:

```bash
cd nextcloud
chmod +x setup_domain_remote.sh
./setup_domain_remote.sh
```

Das Skript:
- Kopiert das Setup-Skript auf den Server
- Installiert Nginx und Certbot
- Konfiguriert Reverse Proxy
- Passt Docker-Compose an (Port 8080)
- Konfiguriert Nextcloud trusted_domains
- Richtet SSL-Zertifikat ein (wenn DNS konfiguriert ist)

## 🔧 Option 2: Manuelles Setup (direkt auf Server)

### 1. Auf Server einloggen

```bash
ssh root@46.224.150.138
```

### 2. Setup-Skript ausführen

```bash
cd /root/nextcloud
chmod +x setup_domain.sh
./setup_domain.sh
```

Das Skript führt automatisch aus:
- Installation von Nginx
- Installation von Certbot (Let's Encrypt)
- Nginx-Konfiguration für Reverse Proxy
- Anpassung von Docker-Compose (Port 8080 statt 80)
- Nextcloud trusted_domains Konfiguration
- SSL-Zertifikat-Einrichtung (wenn DNS bereit ist)

## 📝 Manuelle Schritte (falls nötig)

### DNS A-Record einrichten

Bei deinem DNS-Provider (z.B. Cloudflare, Hetzner DNS, etc.):

```
Typ: A
Name: files
Wert: 46.224.150.138
TTL: 3600 (oder Auto)
```

### SSL-Zertifikat manuell einrichten

Falls das automatische SSL-Setup fehlgeschlagen ist:

```bash
certbot --nginx -d files.schels.info
```

### Nextcloud trusted_domains prüfen

```bash
docker exec nextcloud php occ config:system:get trusted_domains
```

Sollte enthalten:
- `localhost`
- `46.224.150.138`
- `files.schels.info`

### Nextcloud trusted_domains manuell setzen

```bash
docker exec nextcloud php occ config:system:set trusted_domains 0 --value=localhost
docker exec nextcloud php occ config:system:set trusted_domains 1 --value=46.224.150.138
docker exec nextcloud php occ config:system:set trusted_domains 2 --value=files.schels.info
docker exec nextcloud php occ config:system:set overwritehost --value=files.schels.info
docker exec nextcloud php occ config:system:set overwriteprotocol --value=https
```

## 🔍 Troubleshooting

### Nginx startet nicht

```bash
# Prüfe Konfiguration
nginx -t

# Prüfe Logs
journalctl -u nginx -n 50
```

### SSL-Zertifikat wird nicht erstellt

1. Prüfe DNS: `dig files.schels.info` oder `nslookup files.schels.info`
2. Stelle sicher, dass Port 80 von außen erreichbar ist
3. Prüfe Firewall: `ufw status`

### Nextcloud zeigt "Zugriff verweigert"

1. Prüfe trusted_domains: `docker exec nextcloud php occ config:system:get trusted_domains`
2. Füge Domain hinzu (siehe oben)
3. Setze overwritehost und overwriteprotocol

### Port 80 bereits belegt

Falls Port 80 bereits von einem anderen Service verwendet wird:

1. Prüfe: `netstat -tulpn | grep :80`
2. Stoppe den Service oder ändere Port in Nginx-Konfiguration

## ✅ Nach dem Setup

1. **Teste Domain**: Öffne `https://files.schels.info` im Browser
2. **Prüfe SSL**: Browser sollte grünes Schloss zeigen
3. **Teste Nextcloud**: Login sollte funktionieren
4. **Prüfe Logs**: `docker logs nextcloud --tail 50`

## 🔄 SSL-Zertifikat erneuern

Let's Encrypt-Zertifikate laufen nach 90 Tagen ab. Automatische Erneuerung sollte eingerichtet sein:

```bash
# Teste Erneuerung
certbot renew --dry-run

# Manuelle Erneuerung
certbot renew
```

## 📚 Weitere Informationen

- [Nextcloud Reverse Proxy Dokumentation](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/reverse_proxy_configuration.html)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Let's Encrypt Dokumentation](https://letsencrypt.org/docs/)
