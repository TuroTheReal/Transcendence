#!/bin/bash

KIBANA_URL="http://kibana:5601"
SAVED_OBJECTS_DIR="/usr/share/kibana/saved_objects"

echo "Attente de Kibana..."
until curl -sf "$KIBANA_URL/api/status" > /dev/null; do
    sleep 3
done

echo "Recherche des fichiers de dashboards..."
for file in "$SAVED_OBJECTS_DIR"/*.ndjson; do
    if [ -f "$file" ]; then
        echo "Import du fichier : $(basename "$file")"
        curl -X POST "$KIBANA_URL/api/saved_objects/_import" \
            -H "kbn-xsrf: true" \
            -F "file=@$file"
        echo "Import de $(basename "$file") terminé"
    fi
done

echo "Tous les imports sont terminés"