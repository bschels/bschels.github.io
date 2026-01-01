#!/bin/bash
# SSH-Key einrichten für automatische Authentifizierung

SERVER_IP="46.224.150.138"
SERVER_PASS="Dstlfnk*1688"

echo "🔑 SSH-Key einrichten..."
echo "========================"
echo ""

# Prüfe ob SSH-Key bereits existiert
if [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo "📝 Erstelle neuen SSH-Key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "nextcloud-setup"
    echo "✅ SSH-Key erstellt"
else
    echo "✅ SSH-Key bereits vorhanden"
fi

echo ""
echo "📤 Kopiere öffentlichen Schlüssel auf Server..."
echo "   (Passwort wird einmalig benötigt: $SERVER_PASS)"
echo ""

# Kopiere Key auf Server
ssh-copy-id -o StrictHostKeyChecking=no root@$SERVER_IP || {
    echo ""
    echo "⚠️  Automatisches Kopieren fehlgeschlagen"
    echo ""
    echo "📋 Manuell ausführen:"
    echo "   ssh-copy-id root@$SERVER_IP"
    echo "   (Passwort: $SERVER_PASS)"
    echo ""
    echo "Oder manuell kopieren:"
    echo "   cat ~/.ssh/id_rsa.pub | ssh root@$SERVER_IP 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'"
    exit 1
}

echo ""
echo "✅ SSH-Key erfolgreich eingerichtet!"
echo ""
echo "🧪 Teste Verbindung..."
ssh -o StrictHostKeyChecking=no root@$SERVER_IP "echo '✅ SSH-Verbindung ohne Passwort funktioniert!'" && {
    echo ""
    echo "🎉 Erfolg! Du kannst jetzt ohne Passwort auf den Server zugreifen."
    echo ""
    echo "📝 Nächster Schritt:"
    echo "   ./setup_domain_remote.sh"
} || {
    echo ""
    echo "❌ Verbindung funktioniert noch nicht. Bitte manuell prüfen."
}
