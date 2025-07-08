#!/bin/bash
set -e

TOKEN_FILE="/shared/kibana_token"

echo "Recherche du token Kibana..."
timeout=60
count=0
while [ ! -f "$TOKEN_FILE" ] && [ $count -lt $timeout ]; do
    sleep 1
    count=$((count + 1))
done

if [ -f "$TOKEN_FILE" ]; then
	cat $TOKEN_FILE
    TOKEN=$(cat "$TOKEN_FILE")
    echo "Token Kibana chargé depuis $TOKEN_FILE"
else
    echo "Erreur : fichier token $TOKEN_FILE non trouvé après ${timeout}s d'attente !"
    echo "Démarrage de Kibana sans token (à configurer manuellement)"
fi

echo "Démarrage de Kibana..."
exec /usr/local/bin/kibana-docker --elasticsearch.serviceAccountToken="$TOKEN" "$@"