#!/bin/bash

echo "🔍 Diagnostic de connexion pour accès distant"
echo "============================================="
echo ""

TARGET_IP="10.16.11.13"
HTTP_PORT="3000"
HTTPS_PORT="3443"

echo "🎯 Cible: $TARGET_IP"
echo "📡 Ports: $HTTP_PORT (HTTP), $HTTPS_PORT (HTTPS)"
echo ""

echo "1️⃣ Vérification que le serveur Node.js fonctionne:"
echo "================================================"
ps aux | grep node | grep -v grep
if [ $? -eq 0 ]; then
    echo "✅ Processus Node.js détecté"
else
    echo "❌ Aucun processus Node.js détecté - le serveur n'est pas démarré!"
fi
echo ""

echo "2️⃣ Vérification des ports en écoute:"
echo "===================================="
echo "Ports en écoute sur toutes les interfaces:"
netstat -tlnp | grep -E ":(3000|3443)"
echo ""
echo "Détail des connexions:"
ss -tlnp | grep -E ":(3000|3443)"
echo ""

echo "3️⃣ Test de connectivité locale:"
echo "==============================="
echo "Test localhost:"
curl -s --connect-timeout 3 -k https://localhost:3443/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Connexion localhost OK"
else
    echo "❌ Connexion localhost échoue"
fi
echo ""

echo "Test IP publique depuis la même machine:"
curl -s --connect-timeout 3 -k https://$TARGET_IP:$HTTPS_PORT/health 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Connexion IP publique OK"
else
    echo "❌ Connexion IP publique échoue depuis la même machine"
fi
echo ""

echo "4️⃣ Vérification du firewall:"
echo "============================"
if command -v ufw &> /dev/null; then
    echo "📋 Statut UFW:"
    sudo ufw status | grep -E "(Status|$HTTP_PORT|$HTTPS_PORT)"
elif command -v iptables &> /dev/null; then
    echo "📋 Règles iptables pour nos ports:"
    sudo iptables -L -n | grep -E "(3000|3443)" || echo "Aucune règle trouvée"
else
    echo "❓ Système de firewall non détecté"
fi
echo ""

echo "5️⃣ Vérification des interfaces réseau:"
echo "======================================"
echo "Interfaces UP avec IP:"
ip addr show | grep -A 2 "state UP" | grep -E "(inet|UP)"
echo ""

echo "6️⃣ Test de connectivité réseau basique:"
echo "======================================="
echo "Test ping vers l'IP publique:"
ping -c 2 $TARGET_IP 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Ping OK"
else
    echo "❌ Ping échoue"
fi
echo ""

echo "Test de port avec telnet/nc:"
if command -v nc &> /dev/null; then
    echo "Test port $HTTPS_PORT avec netcat:"
    timeout 3 nc -zv $TARGET_IP $HTTPS_PORT 2>&1
    echo "Test port $HTTP_PORT avec netcat:"
    timeout 3 nc -zv $TARGET_IP $HTTP_PORT 2>&1
elif command -v telnet &> /dev/null; then
    echo "Test port $HTTPS_PORT avec telnet:"
    timeout 3 telnet $TARGET_IP $HTTPS_PORT 2>&1 | head -3
else
    echo "❓ Ni netcat ni telnet disponible pour tester les ports"
fi
echo ""

echo "7️⃣ Vérification de la configuration Docker (si applicable):"
echo "==========================================================="
if [ -f "/.dockerenv" ]; then
    echo "🐳 Environnement Docker détecté"
    echo "Mapping des ports Docker:"
    docker ps --filter "publish=3000" --filter "publish=3443" 2>/dev/null || echo "Commande docker non disponible dans le container"
else
    echo "📦 Pas d'environnement Docker détecté"
    if command -v docker &> /dev/null; then
        echo "Docker disponible - Vérification des containers:"
        docker ps | grep -E "(3000|3443)" || echo "Aucun container avec ports 3000/3443"
    fi
fi
echo ""

echo "🔧 Actions recommandées selon les résultats:"
echo "============================================"
echo "Si aucun processus Node.js:"
echo "  → Démarrer le serveur: npm start ou node server.js"
echo ""
echo "Si ports pas en écoute:"
echo "  → Vérifier que le serveur écoute sur 0.0.0.0 et non 127.0.0.1"
echo "  → Code: app.listen({ host: '0.0.0.0', port: 3443 })"
echo ""
echo "Si firewall bloque:"
echo "  → sudo ufw allow 3000 && sudo ufw allow 3443"
echo "  → ou sudo iptables -A INPUT -p tcp --dport 3443 -j ACCEPT"
echo ""
echo "Si problème Docker:"
echo "  → Vérifier le mapping: docker run -p 3000:3000 -p 3443:3443 ..."
echo ""
echo "Si connexion locale OK mais distante KO:"
echo "  → Problème de firewall réseau ou routage"