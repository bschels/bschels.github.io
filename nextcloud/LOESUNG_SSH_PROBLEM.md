# Lösung für SSH-Passwort-Problem

## 🔍 Problem-Analyse

Die Fehlermeldung `Permission denied (publickey,password)` bedeutet:
- Der Server akzeptiert **keine Passwort-Authentifizierung**
- Nur **SSH-Keys** sind erlaubt
- Oder das Passwort mit `*` wird nicht korrekt übertragen

## ✅ Lösungen (in Reihenfolge)

### Lösung 1: SSH-Keys einrichten (EMPFOHLEN) ⭐

**Vorteile:**
- Sicherer als Passwörter
- Keine Passwort-Eingabe nötig
- Funktioniert zuverlässig mit Skripten

**Schritte:**

1. **SSH-Key generieren** (falls noch nicht vorhanden):
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "nextcloud-setup"
   ```

2. **Key auf Server kopieren**:
   ```bash
   ssh-copy-id root@46.224.150.138
   ```
   (Passwort einmalig eingeben: `Dstlfnk*1688`)

3. **Testen**:
   ```bash
   ssh root@46.224.150.138 "echo 'Funktioniert!'"
   ```

4. **Dann Setup ausführen**:
   ```bash
   cd nextcloud
   ./setup_domain_remote.sh
   ```

**Oder automatisch:**
```bash
cd nextcloud
chmod +x setup_ssh_key.sh
./setup_ssh_key.sh
```

---

### Lösung 2: Passwort-Authentifizierung auf Server aktivieren

**WICHTIG:** Nur wenn du keinen SSH-Key einrichten kannst!

**Auf dem Server ausführen** (über Hetzner Console oder bestehende SSH-Verbindung):

```bash
# SSH-Konfiguration bearbeiten
nano /etc/ssh/sshd_config

# Diese Zeile finden und ändern:
# PasswordAuthentication no
# zu:
PasswordAuthentication yes

# SSH-Dienst neu starten
systemctl restart sshd
```

**Dann Setup erneut versuchen.**

---

### Lösung 3: Passwort ohne Sonderzeichen verwenden

Falls das `*` im Passwort Probleme verursacht:

1. **Passwort auf Server ändern** (über Hetzner Console):
   ```bash
   passwd root
   ```
   (Neues Passwort ohne `*` verwenden, z.B. `Dstlfnk1688`)

2. **In Skripten anpassen:**
   - `setup_domain_remote.sh`: Zeile 8 ändern
   - `setup_domain_python.py`: Zeile 10 ändern

---

### Lösung 4: Manuelles Setup (wenn nichts funktioniert)

**Skript auf Server kopieren und ausführen:**

1. **Skript lokal anzeigen:**
   ```bash
   cat nextcloud/setup_domain_einfach.sh
   ```

2. **Auf Server einloggen** (manuell):
   ```bash
   ssh root@46.224.150.138
   ```

3. **Skript-Inhalt auf Server erstellen:**
   ```bash
   nano /root/setup_domain.sh
   # [Inhalt von setup_domain_einfach.sh einfügen]
   ```

4. **Ausführen:**
   ```bash
   chmod +x /root/setup_domain.sh
   /root/setup_domain.sh
   ```

---

## 🎯 Empfohlener Ablauf

1. **SSH-Key einrichten** (Lösung 1) - dauert 2 Minuten
2. **Setup automatisch ausführen** - dann funktioniert alles

## 📝 Warum SSH-Keys besser sind

- ✅ Sicherer (keine Passwörter im Klartext)
- ✅ Bequemer (keine Passwort-Eingabe)
- ✅ Zuverlässiger (keine Probleme mit Sonderzeichen)
- ✅ Standard für Server-Administration

## ❓ Hilfe

Falls nichts funktioniert:
1. Prüfe Hetzner Console - ist der Server erreichbar?
2. Prüfe Firewall - ist Port 22 offen?
3. Kontaktiere Hetzner Support
