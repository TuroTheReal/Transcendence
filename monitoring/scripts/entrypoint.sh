#!/bin/bash

# Script d'initialisation pour conteneur Docker avec cron
# init-container.sh

set -e  # Arrêter en cas d'erreur

echo "=== Initialisation du conteneur ==="

# Mise à jour et installation des paquets
echo "Installation des dépendances..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y curl procps cron rsyslog

# Préparation de l'environnement cron
echo "Préparation de l'environnement cron..."
printenv | grep -E '^(ELASTIC_)' | sed 's/^/export /' > /etc/cron.environment
echo "Variables d'environnement préparées:"
cat /etc/cron.environment

# Configuration de rsyslog pour éviter les conflits
echo "Configuration de rsyslog..."
# Créer un fichier de configuration minimal
cat > /etc/rsyslog.d/50-transcendence.conf << EOF
# Configuration pour les logs transcendence
local0.*    /var/log/transcendence-cleanup.log
local1.*    /var/log/transcendence-cleanup-metrics.log
EOF

# Créer les fichiers de log avec les bonnes permissions
touch /var/log/transcendence-cleanup.log
touch /var/log/transcendence-cleanup-metrics.log
chmod 644 /var/log/transcendence-cleanup.log
chmod 644 /var/log/transcendence-cleanup-metrics.log

# Démarrer rsyslog en arrière-plan de manière contrôlée
echo "Démarrage de rsyslog..."
rsyslogd

# Attendre que rsyslog soit prêt
sleep 2

# Vérifier que cron peut accéder aux variables d'environnement
echo "Test de l'environnement cron..."
if [ -f "/etc/cron.environment" ]; then
    echo "✓ Fichier d'environnement cron créé"
else
    echo "✗ Problème avec le fichier d'environnement cron"
    exit 1
fi

# Afficher la configuration cron actuelle pour debug
echo "Configuration cron actuelle:"
crontab -l || echo "Aucune crontab configurée"

# Démarrer cron en premier plan
echo "Démarrage de cron en premier plan..."
echo "=== Conteneur prêt ==="
exec cron -f