#!/bin/bash

# Configuration du service à tester
TARGET_SERVICE="${TARGET_SERVICE:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour vérifier que le service est accessible
check_service_health() {
    log_info "Vérification de la disponibilité du service..."

    if ! curl -sf "$TARGET_SERVICE/metrics" > /dev/null; then
        log_error "Service non accessible à $TARGET_SERVICE"
        log_info "Vérifiez que votre application Transcendence est démarrée"
        exit 1
    fi

    log_success "Service accessible à $TARGET_SERVICE"
}

# Fonction pour obtenir les métriques actuelles
get_current_metrics() {
    local metrics_output=$(curl -s "$TARGET_SERVICE/metrics")

    # Extraire les valeurs des métriques importantes
    local total_requests=$(echo "$metrics_output" | grep 'transcendence_http_requests_total{' | grep -v '#' | wc -l)
    local error_requests=$(echo "$metrics_output" | grep 'transcendence_http_requests_total{.*status_code="5' | wc -l)

    echo "📊 Métriques actuelles:"
    echo "   - Routes avec métriques: $total_requests"
    echo "   - Routes avec erreurs 5xx: $error_requests"
    echo ""
}

# Test de l'alerte HighHttpErrorRate
trigger_high_error_rate() {
    echo "🚨 === Déclenchement de l'alerte HighHttpErrorRate ==="
    log_info "Génération d'un taux d'erreur HTTP élevé (>5%)..."
    echo ""

    # Créer un endpoint qui génère des erreurs 500
    log_info "Stratégie: Envoyer des requêtes vers des endpoints inexistants ou qui génèrent des erreurs"

    # Générer des erreurs 500/404 en masse
    log_info "Envoi de 50 requêtes vers des endpoints générant des erreurs..."
    for i in {1..50}; do
        # Requêtes vers des endpoints inexistants (404) ou qui peuvent causer des erreurs
        curl -s "$TARGET_SERVICE/api/nonexistent-endpoint-$i" > /dev/null 2>&1 &
        curl -s "$TARGET_SERVICE/error-test-$i" > /dev/null 2>&1 &
        curl -s -X POST "$TARGET_SERVICE/api/invalid-data" -d "invalid json {{{" > /dev/null 2>&1 &

        # Ne pas surcharger le serveur
        if [ $((i % 10)) -eq 0 ]; then
            sleep 0.5
            echo -n "."
        fi
    done

    # Attendre que toutes les requêtes se terminent
    wait
    echo ""

    log_success "50 requêtes d'erreur envoyées"
    log_warning "Attendez 2-3 minutes pour que l'alerte se déclenche (seuil: >5% sur 30s pendant 2min)"

    echo ""
    log_info "Pour vérifier l'effet:"
    echo "  curl $TARGET_SERVICE/metrics | grep 'transcendence_http_requests_total'"
    echo ""
}

# Test de l'alerte HighResponseTime
trigger_high_response_time() {
    echo "🐌 === Déclenchement de l'alerte HighResponseTime ==="
    log_info "Génération de temps de réponse élevés (>1s)..."
    echo ""

    # Stratégie: créer de la charge ou utiliser des endpoints lents
    log_info "Stratégie: Surcharger le serveur avec de nombreuses requêtes simultanées"

    # Créer une charge importante avec des requêtes simultanées
    log_info "Lancement de 100 requêtes simultanées pour surcharger le serveur..."

    for i in {1..100}; do
        # Requêtes simultanées vers différents endpoints
        curl -s "$TARGET_SERVICE/" > /dev/null 2>&1 &
        curl -s "$TARGET_SERVICE/metrics" > /dev/null 2>&1 &
        curl -s "$TARGET_SERVICE/api/status" > /dev/null 2>&1 &

        # Affichage du progrès
        if [ $((i % 20)) -eq 0 ]; then
            echo -n "█"
        fi
    done

    log_info "Toutes les requêtes lancées, attente de la fin..."
    wait
    echo ""

    log_success "Charge générée sur le serveur"
    log_warning "Attendez 3-4 minutes pour que l'alerte se déclenche (seuil: >1s sur 30s pendant 3min)"

    echo ""
    log_info "Pour vérifier l'effet:"
    echo "  curl $TARGET_SERVICE/metrics | grep 'transcendence_http_request_duration_seconds'"
    echo ""
}

# Test de l'alerte ServiceDown
trigger_service_down() {
    echo "💀 === Déclenchement de l'alerte ServiceDown ==="
    log_warning "ATTENTION: Cette action va arrêter temporairement votre service!"
    echo ""

    read -p "Êtes-vous sûr de vouloir arrêter le service? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Test annulé par l'utilisateur"
        return
    fi

    log_info "Recherche du processus du service Transcendence..."

    # Trouver le PID du processus Node.js
    local node_pid=$(pgrep -f "node.*transcendence\|npm.*start\|node.*app.js\|node.*server.js" | head -1)

    if [ -z "$node_pid" ]; then
        log_error "Impossible de trouver le processus du service"
        log_info "Le service semble déjà arrêté ou utilise un nom différent"
        return
    fi

    log_warning "Service trouvé (PID: $node_pid), arrêt en cours..."

    # Arrêter le service temporairement
    kill -STOP "$node_pid"

    log_success "Service mis en pause"
    log_warning "Attendez 1-2 minutes pour que l'alerte se déclenche"

    echo ""
    log_info "Le service sera automatiquement redémarré dans 90 secondes..."

    # Attendre 90 secondes puis redémarrer
    sleep 90

    log_info "Redémarrage du service..."
    kill -CONT "$node_pid"

    # Vérifier que le service répond à nouveau
    sleep 5
    if curl -sf "$TARGET_SERVICE/metrics" > /dev/null; then
        log_success "Service redémarré avec succès"
    else
        log_error "Le service ne répond pas après redémarrage"
        log_info "Vous devrez peut-être le redémarrer manuellement"
    fi
}

# Fonction pour vérifier l'état des alertes via Prometheus
check_alerts_status() {
    echo "🔍 === Vérification de l'état des alertes ==="

    if ! curl -sf "$PROMETHEUS_URL" > /dev/null; then
        log_warning "Impossible d'accéder à Prometheus à $PROMETHEUS_URL"
        log_info "Vérifiez manuellement les alertes dans votre interface Prometheus"
        return
    fi

    log_info "Récupération de l'état des alertes depuis Prometheus..."

    # Vérifier les alertes actives
    local alerts_response=$(curl -s "$PROMETHEUS_URL/api/v1/alerts")
    local active_transcendence_alerts=$(echo "$alerts_response" | grep -o '"alertname":"[^"]*transcendence[^"]*"' | wc -l)

    echo "📊 État actuel des alertes:"
    echo "   - Alertes Transcendence actives: $active_transcendence_alerts"

    echo ""
    log_info "Interfaces utiles pour le monitoring:"
    echo "   🎯 Alertes Prometheus: $PROMETHEUS_URL/alerts"
    echo "   📊 Métriques de l'app: $TARGET_SERVICE/metrics"
}

# Fonction pour afficher les métriques actuelles de manière lisible
show_current_metrics() {
    echo "📈 === Métriques actuelles de l'application ==="

    local metrics_output=$(curl -s "$TARGET_SERVICE/metrics")

    echo ""
    echo "🌐 Requêtes HTTP totales par status:"
    echo "$metrics_output" | grep 'transcendence_http_requests_total{' | grep -v '#' | while read -r line; do
        local status=$(echo "$line" | grep -o 'status_code="[^"]*"' | cut -d'"' -f2)
        local count=$(echo "$line" | awk '{print $NF}')
        printf "   Status %s: %s requêtes\n" "$status" "$count"
    done

    echo ""
    echo "⏱️  Temps de réponse (histogramme):"
    echo "$metrics_output" | grep 'transcendence_http_request_duration_seconds_count' | head -5 | while read -r line; do
        local route=$(echo "$line" | grep -o 'route="[^"]*"' | cut -d'"' -f2 | head -c 20)
        local count=$(echo "$line" | awk '{print $NF}')
        printf "   Route %-20s: %s requêtes\n" "$route" "$count"
    done

    echo ""
    echo "👥 Utilisateurs connectés:"
    local connected_users=$(echo "$metrics_output" | grep 'transcendence_connected_users ' | awk '{print $NF}')
    echo "   Utilisateurs actuels: ${connected_users:-0}"

    echo ""
}

# Test rapide pour vérifier la connectivité
test_connectivity() {
    echo "🔧 === Test de connectivité ==="

    log_info "Test de connexion au service principal..."
    if curl -sf "$TARGET_SERVICE/metrics" > /dev/null; then
        log_success "Service principal accessible"
    else
        log_error "Service principal inaccessible"
    fi

    log_info "Test de connexion à Prometheus..."
    if curl -sf "$PROMETHEUS_URL" > /dev/null; then
        log_success "Prometheus accessible"
    else
        log_warning "Prometheus inaccessible (optionnel pour les tests)"
    fi

    echo ""
    get_current_metrics
}

# Déclencher toutes les alertes en séquence (mode démo)
trigger_all_alerts() {
    echo "🎭 === MODE DÉMO: Déclenchement de toutes les alertes ==="
    echo ""

    log_warning "Cette démonstration va:"
    echo "  1. Générer des erreurs HTTP (2-3 minutes)"
    echo "  2. Surcharger le serveur (3-4 minutes)"
    echo "  3. Arrêter temporairement le service (1-2 minutes)"
    echo ""

    read -p "Continuer avec la démonstration complète? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Démonstration annulée"
        return
    fi

    trigger_high_error_rate
    log_info "⏳ Pause de 60 secondes avant le test suivant..."
    sleep 60

    trigger_high_response_time
    log_info "⏳ Pause de 60 secondes avant le test suivant..."
    sleep 60

    trigger_service_down

    log_success "🎉 Démonstration terminée!"
    log_info "Consultez vos interfaces de monitoring pour voir les alertes"
}

# Fonction d'aide
show_help() {
    echo "🚨 Script de test des alertes Transcendence"
    echo ""
    echo "Usage: $0 {error-rate|response-time|service-down|all|check|metrics|test|help}"
    echo ""
    echo "📋 Commandes disponibles:"
    echo "  error-rate    - Générer un taux d'erreur HTTP élevé (>5%)"
    echo "  response-time - Générer des temps de réponse élevés (>1s)"
    echo "  service-down  - Arrêter temporairement le service"
    echo "  all          - Démonstration complète (toutes les alertes)"
    echo "  check        - Vérifier l'état des alertes"
    echo "  metrics      - Afficher les métriques actuelles"
    echo "  test         - Tester la connectivité"
    echo "  help         - Afficher cette aide"
    echo ""
    echo "🔧 Variables d'environnement:"
    echo "  TARGET_SERVICE    - URL du service (défaut: http://localhost:3000)"
    echo "  PROMETHEUS_URL    - URL de Prometheus (défaut: http://prometheus:9090)"
    echo ""
    echo "💡 Exemples d'utilisation:"
    echo "  $0 test          # Vérifier que tout fonctionne"
    echo "  $0 metrics       # Voir les métriques actuelles"
    echo "  $0 error-rate    # Déclencher l'alerte d'erreur HTTP"
    echo "  TARGET_SERVICE=http://localhost:4000 $0 check"
    echo ""
    echo "📚 Alertes configurées dans votre système:"
    echo "  • HighHttpErrorRate: >5% d'erreurs HTTP sur 30s pendant 2min"
    echo "  • HighResponseTime: >1s de temps de réponse sur 30s pendant 3min"
    echo "  • ServiceDown: Service non disponible pendant 1min"
    echo ""
}

# Traitement des arguments
case "$1" in
    "error-rate")
        check_service_health
        trigger_high_error_rate
        ;;
    "response-time")
        check_service_health
        trigger_high_response_time
        ;;
    "service-down")
        check_service_health
        trigger_service_down
        ;;
    "all")
        check_service_health
        trigger_all_alerts
        ;;
    "check")
        check_service_health
        check_alerts_status
        ;;
    "metrics")
        check_service_health
        show_current_metrics
        ;;
    "test")
        test_connectivity
        ;;
    *)
        if [ -n "$1" ]; then
            log_error "Commande non reconnue: $1"
            echo ""
        fi
        show_help
        exit 1
        ;;
esac