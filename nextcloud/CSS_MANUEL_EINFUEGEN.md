# Custom CSS manuell in Nextcloud einfügen

## Schritt-für-Schritt Anleitung

### 1. In Nextcloud einloggen
- Gehe zu: https://files.schels.info
- Logge dich als Administrator ein

### 2. Zu den Einstellungen gehen
- Klicke oben rechts auf dein Profilbild/Avatar
- Wähle "Einstellungen" aus dem Dropdown-Menü

### 3. Zum Theming-Bereich navigieren
- Im linken Menü: Klicke auf "Erscheinungsbild" oder "Theming" (je nach Nextcloud-Version)
- Oder gehe direkt zu: https://files.schels.info/settings/admin/theming

### 4. Custom CSS finden
- Scrolle nach unten zum Bereich "Custom CSS" oder "Eigene CSS-Regeln"
- Dort findest du ein großes Textfeld

### 5. CSS einfügen
- Öffne die Datei `custom-css-schels.txt` in deinem Editor
- Markiere **ALLES** (Cmd+A / Ctrl+A)
- Kopiere es (Cmd+C / Ctrl+C)
- Füge es in das Textfeld in Nextcloud ein (Cmd+V / Ctrl+V)

### 6. Speichern
- Klicke auf "Speichern" oder "Save"
- Warte ein paar Sekunden

### 7. Cache leeren
- Drücke in Chrome: **Cmd+Shift+R** (Mac) oder **Ctrl+Shift+R** (Windows/Linux)
- Oder öffne die Entwicklertools (F12) → Rechtsklick auf Reload-Button → "Empty Cache and Hard Reload"

### 8. Testen
- Gehe zu deiner öffentlichen Share-Seite: https://files.schels.info/s/YyYecaG5DKLKGc9?dir=/Test2
- Die Breadcrumbs sollten jetzt mit gelbem Hintergrund und rotem Rahmen sichtbar sein!

---

## Falls du das Textfeld nicht findest:

### Alternative: Über die Kommandozeile (auf dem Server)
Falls du keinen Zugriff auf die Weboberfläche hast, kannst du auch direkt auf dem Server arbeiten:

```bash
# SSH zum Server
ssh root@46.224.150.138

# CSS-Datei hochladen (falls noch nicht vorhanden)
# Dann im Container:
docker exec -it nextcloud bash
cd /var/www/html
php occ config:app:set theming_customcss css --value="$(cat /tmp/custom-css.txt)"
```

---

## Wichtig:
- Das CSS wird **sofort** nach dem Speichern aktiv
- Falls es nicht funktioniert: Browser-Cache leeren (Cmd+Shift+R)
- Falls es immer noch nicht funktioniert: Nextcloud-Cache leeren (Maintenance Mode an/aus)
