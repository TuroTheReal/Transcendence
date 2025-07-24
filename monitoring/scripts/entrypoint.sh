#!/bin/bash

set -e

echo "=== Initialisation du conteneur ==="

echo "Installation des dépendances..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y curl procps cron rsyslog

echo "Préparation de l'environnement cron..."
printenv | grep -E '^(ELASTIC_)' | sed 's/^/export /' > /etc/cron.environment
echo "Variables d'environnement préparées:"
cat /etc/cron.environment

touch /var/log/transcendence-cleanup.log
touch /var/log/transcendence-cleanup-metrics.log
chmod 644 /var/log/transcendence-cleanup.log
chmod 644 /var/log/transcendence-cleanup-metrics.log

echo "Test de l'environnement cron..."
if [ -f "/etc/cron.environment" ]; then
    echo "✓ Fichier d'environnement cron créé"
else
    echo "✗ Problème avec le fichier d'environnement cron"
    exit 1
fi

echo "=== Conteneur prêt ==="
exec cron -f