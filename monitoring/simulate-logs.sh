#!/bin/bash

ELASTIC_URL="${ELASTIC_URL:-http://elasticsearch:9200}"
ELASTIC_USER="${ELASTIC_USER:-elastic}"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD}"
INDEX_NAME="transcendence-logs-$(date +%Y.%m.%d)"

create_test_log() {
    local category=$1
    local days_ago=$2
    local message=$3

    local timestamp=$(date -d "$days_ago days ago" --iso-8601=seconds)

    local document='{
        "@timestamp": "'$timestamp'",
        "log_category": "'$category'",
        "level": "info",
        "message": "'$message'",
        "service": "test-service",
        "environment": "test",
        "test_data": true
    }'

    curl -sf -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
        -X POST "$ELASTIC_URL/$INDEX_NAME/_doc" \
        -H "Content-Type: application/json" \
        -d "$document"

    echo -e "Log créé: $category ($days_ago jours) - $message \n"
}

generate_test_logs() {
    echo "=== Génération des logs de test ==="

    if ! curl -sf -u "$ELASTIC_USER:$ELASTIC_PASSWORD" "$ELASTIC_URL/_cluster/health" > /dev/null; then
        echo "ERREUR: Impossible de se connecter à Elasticsearch"
        exit 1
    fi

    echo -e "Création de logs 'critical' anciens (plus de 60 jours)... \n"
    create_test_log "critical" 65 "Erreur critique test - devrait être supprimé"
    create_test_log "critical" 70 "Autre erreur critique ancienne"
    create_test_log "critical" 80 "Erreur très ancienne"

    echo -e "Création de logs 'important' anciens (plus de 30 jours)... \n"
    create_test_log "important" 35 "Warning important ancien"
    create_test_log "important" 45 "Autre warning à supprimer"

    echo -e "Création de logs 'standard' anciens (plus de 10 jours)... \n"
    create_test_log "standard" 12 "Log info ancien"
    create_test_log "standard" 15 "Autre log standard ancien"

    echo -e "Création de logs 'temporary' anciens (plus de 5 jours)... \n"
    create_test_log "temporary" 7 "Log debug ancien"
    create_test_log "temporary" 10 "Autre log temporaire"

    echo -e "Création de logs 'unknown' anciens (plus de 30 jours)... \n"
    create_test_log "unknown" 35 "Log sans catégorie définie"

    echo -e "Création de logs récents (à conserver)... \n"
    create_test_log "critical" 1 "Erreur récente à conserver"
    create_test_log "important" 5 "Warning récent à conserver"
    create_test_log "standard" 2 "Log info récent"
    create_test_log "temporary" 1 "Log debug récent"

    echo -e "=== Génération terminée ==="
}

verify_test_logs() {
    echo "=== Vérification des logs créés ==="

    local categories=("critical" "important" "standard" "temporary" "unknown")

    for category in "${categories[@]}"; do
        local count=$(curl -sf -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
            -X GET "$ELASTIC_URL/transcendence-logs-*/_count" \
            -H "Content-Type: application/json" \
            -d '{
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"log_category": "'$category'"}},
                            {"term": {"test_data": true}}
                        ]
                    }
                }
            }' | grep -o '"count":[0-9]*' | cut -d':' -f2)

        echo "Catégorie '$category': $count logs de test"
    done
}

cleanup_test_logs() {
    echo "=== Nettoyage des logs de test ==="

    curl -sf -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
        -X POST "$ELASTIC_URL/transcendence-logs-*/_delete_by_query" \
        -H "Content-Type: application/json" \
        -d '{
            "query": {
                "term": {"test_data": true}
            }
        }'

    echo "Logs de test supprimés"
}

case "$1" in
    "generate")
        generate_test_logs
        ;;
    "verify")
        verify_test_logs
        ;;
    "cleanup")
        cleanup_test_logs
        ;;
    *)
        echo "Usage: $0 {generate|verify|cleanup}"
        echo "  generate - Créer différents logs de test"
        echo "  verify   - Vérifier les logs de test créés"
        echo "  cleanup  - Supprimer tous les logs de test"
        exit 1
        ;;
esac