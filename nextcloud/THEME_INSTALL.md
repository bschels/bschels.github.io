# Theme-Installation für Nextcloud

## Schnellinstallation

Da Nextcloud bereits läuft, müssen wir nur das Theme installieren und aktivieren.

### Option 1: Automatisch (mit SSH-Key)

```bash
cd nextcloud
./install_theme.sh 46.224.150.138
```

### Option 2: Manuell

#### 1. Theme-Dateien auf Server kopieren

```bash
cd nextcloud
scp -r theme/schels root@46.224.150.138:/root/nextcloud/theme/
```

#### 2. Auf Server einloggen

```bash
ssh root@46.224.150.138
```

#### 3. Theme in Nextcloud Container kopieren

```bash
cd /root/nextcloud
docker cp theme/schels nextcloud:/var/www/html/custom_apps/schels
```

#### 4. Theme aktivieren

```bash
docker exec nextcloud php occ theme:enable schels
docker exec nextcloud php occ maintenance:mode --off
```

#### 5. Browser-Cache leeren

Im Browser: **Strg+Shift+R** (Windows/Linux) oder **Cmd+Shift+R** (Mac)

## Überprüfung

Nach der Installation sollte:
- Der Header schwarz sein
- Die Schriftart Avenir Next verwendet werden
- Keine runden Ecken sichtbar sein
- Das Logo "architekturbüro schels" im Header erscheinen

## Troubleshooting

### Theme wird nicht angezeigt

1. **Browser-Cache leeren** (wichtig!)
2. **Theme-Status prüfen:**
   ```bash
   docker exec nextcloud php occ theme:list
   ```
3. **Theme erneut aktivieren:**
   ```bash
   docker exec nextcloud php occ theme:enable schels
   ```

### Container-Name ist anders

Falls der Container nicht "nextcloud" heißt:
```bash
docker ps  # Zeigt alle laufenden Container
# Dann ersetze "nextcloud" durch den tatsächlichen Container-Namen
```

### CSS-Änderungen werden nicht übernommen

```bash
# CSS neu kopieren
docker cp theme/schels/core/css/styles.css nextcloud:/var/www/html/custom_apps/schels/core/css/styles.css

# Cache leeren
docker exec nextcloud php occ maintenance:mode --on
docker exec nextcloud php occ maintenance:mode --off
```
