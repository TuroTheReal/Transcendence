#!/bin/bash

# Colors
RED="\033[1;31m"
YELLOW="\033[1;33m"
GREEN="\033[1;32m"
RESET="\033[0m"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${RESET} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${RESET} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${RESET} $1"
}

# Check if running inside a Docker container
is_running_in_docker() {
    if grep -qE '/docker|/lxc' /proc/1/cgroup 2>/dev/null; then
        return 0
    elif [ -f /.dockerenv ]; then
        return 0
    else
        return 1
    fi
}

# Get the best matching 10.x.x.x IP
get_best_ip() {
    ip a | grep 'inet 10\.' | awk '{print $2}' | cut -d/ -f1 | head -n 1
}

# Main logic
main() {
    if is_running_in_docker; then
        log_error "Ce script ne doit pas être exécuté depuis un conteneur Docker."
        exit 1
    fi

    detected_ip=$(get_best_ip)

    if [[ -z "$detected_ip" ]]; then
        log_warn "Aucune IP 10.x.x.x détectée. Utilisation de l'adresse locale par défaut (127.0.0.1)."
        detected_ip="127.0.0.1"
    else
        log_info "IP 10.x détectée : $detected_ip"
    fi

    echo
    log_info "Lancement de Docker Compose avec PUBLIC_IP=$detected_ip ..."
    PUBLIC_IP="$detected_ip" docker compose -f .devcontainer/docker-compose.yml up -d && docker exec -it trans-dev bash
    # PUBLIC_IP="$detected_ip" docker compose -f .devcontainer/docker-compose.yml up -d && docker exec -it trans-prod bash -c "npm run prod"
}

main "$@"
