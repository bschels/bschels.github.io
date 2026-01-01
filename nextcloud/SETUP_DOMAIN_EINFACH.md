# Einfaches Domain-Setup für files.schels.info

## Schritt 1: DNS bei United Domains einrichten

1. Bei United Domains anmelden: https://www.united-domains.de
2. Zu deiner Domain `schels.info` navigieren
3. DNS-Verwaltung öffnen
4. **A-Record hinzufügen:**
   - **Typ:** A
   - **Name:** `files` (oder `files.schels.info` - je nach Interface)
   - **Wert/IP:** `46.224.150.138`
   - **TTL:** 3600 (oder Standard)
5. Speichern

**Warte 5-30 Minuten** bis DNS propagiert ist (prüfen mit: `nslookup files.schels.info`)

## Schritt 2: Setup auf Server ausführen

### Option A: Skript von lokal hochladen und ausführen

```bash
# 1. Skript auf Server kopieren
scp nextcloud/setup_domain.sh root@46.224.150.138:/root/

# 2. Auf Server einloggen
ssh root@46.224.150.138

# 3. Skript ausführbar machen und starten
chmod +x /root/setup_domain.sh
/root/setup_domain.sh
```

### Option B: Skript direkt auf Server erstellen

```bash
# Auf Server einloggen
ssh root@46.224.150.138

# Skript erstellen (kopiere Inhalt von setup_domain.sh)
nano /root/setup_domain.sh
# [Inhalt einfügen, speichern mit Ctrl+O, Enter, Ctrl+X]

# Ausführbar machen und starten
chmod +x /root/setup_domain.sh
/root/setup_domain.sh
```

## Was das Skript macht:

1. ✅ Installiert Nginx
2. ✅ Installiert Certbot (SSL)
3. ✅ Konfiguriert Reverse Proxy
4. ✅ Passt Docker-Compose an (Port 8080)
5. ✅ Konfiguriert Nextcloud trusted_domains
6. ✅ Richtet SSL automatisch ein (wenn DNS bereit ist)

## Nach dem Setup:

1. **Teste Domain:** Öffne `https://files.schels.info` im Browser
2. **Prüfe SSL:** Browser sollte grünes Schloss zeigen
3. **Login:** Nextcloud sollte funktionieren

## Falls SSL nicht automatisch funktioniert:

```bash
ssh root@46.224.150.138
certbot --nginx -d files.schels.info
```

## Troubleshooting:

### DNS prüfen:
```bash
nslookup files.schels.info
# Sollte 46.224.150.138 zurückgeben
```

### Nextcloud trusted_domains prüfen:
```bash
ssh root@46.224.150.138
docker exec nextcloud php occ config:system:get trusted_domains
```

### Nginx Status prüfen:
```bash
ssh root@46.224.150.138
systemctl status nginx
nginx -t  # Testet Konfiguration
```
