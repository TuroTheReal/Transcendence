#!/bin/bash
set -e

KIBANA_URL="http://kibana:5601"
SAVED_OBJECTS_DIR="/usr/share/kibana/saved_objects"
TOKEN_FILE="/shared/kibana_token"

echo "Attente d'Elasticsearch..."
until curl -sf -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" "${ELASTIC_URL}/_cluster/health" > /dev/null; do
    sleep 3
done
echo "Elasticsearch disponible."

mkdir -p /shared
chmod 777 /shared

TOKEN=""
if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
    if curl -sf -H "Authorization: Bearer $TOKEN" "${ELASTIC_URL}/_security/_authenticate" > /dev/null 2>&1; then
        echo "Token existant valide"
    else
        echo "Token invalide, génération d'un nouveau..."
        TOKEN=""
    fi
else
    echo "Aucun token trouvé, génération..."
fi

if [ -z "$TOKEN" ]; then
    echo "Génération du token Kibana..."
    TOKEN_RESPONSE=$(curl -sf -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
    -X POST "${ELASTIC_URL}/_security/service/elastic/kibana/credential/token" \
    -H "Content-Type: application/json")

    if [ $? -eq 0 ] && [ -n "$TOKEN_RESPONSE" ]; then
        echo "Réponse API: $TOKEN_RESPONSE"
		TOKEN=$(echo "$TOKEN_RESPONSE" | grep -oP '"value"\s*:\s*"\K[^"]+')
        if [ -n "$TOKEN" ]; then
            echo "$TOKEN" > "$TOKEN_FILE"
            echo "Token généré et sauvegardé: $(echo $TOKEN)"
        else
            echo "Erreur lors de l'extraction du token"
            echo "Response brute: $TOKEN_RESPONSE"
            exit 1
        fi
    else
        echo "Erreur lors de la génération du token"
        echo "Response: $TOKEN_RESPONSE"
        exit 1
    fi
fi



echo "Attente de Kibana..."
until curl -sf "$KIBANA_URL/api/status" > /dev/null; do
    sleep 3
done

echo "Recherche des fichiers de dashboards..."
for file in "$SAVED_OBJECTS_DIR"/*.ndjson; do
    if [ -f "$file" ]; then
        echo "Import du fichier : $(basename "$file")"
        curl -X POST "$KIBANA_URL/api/saved_objects/_import" \
			-u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
            -H "kbn-xsrf: true" \
            -F "file=@$file"
        echo "Import de $(basename "$file") terminé"
    fi
done

echo "Tous les imports sont terminés"