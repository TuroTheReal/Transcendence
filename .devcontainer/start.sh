#!/bin/bash

# Colors
RED="\033[1;31m"
YELLOW="\033[1;33m"
GREEN="\033[1;32m"
RESET="\033[0m"

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${RESET} $1";}

log_warn() { echo -e "${YELLOW}[WARN]${RESET} $1";}

log_error() { echo -e "${RED}[ERROR]${RESET} $1";}

is_running_in_docker() {
    grep -qE '/docker|/lxc' /proc/1/cgroup 2>/dev/null || [ -f /.dockerenv ]
}

get_best_ip() {
    ip a | grep 'inet 10\.' | awk '{print $2}' | cut -d/ -f1 | head -n 1
}
main() {
    if is_running_in_docker; then
        log_error "Ce script ne doit pas être exécuté depuis un conteneur Docker."
        exit 1
    fi

    # Chemin absolu du dossier où se trouve ce script
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    BACKEND_DIR="$SCRIPT_DIR/../backend"
    SSL_DIR="$BACKEND_DIR/ssl"
    EXTERNAL_SCRIPT="$BACKEND_DIR/ssl_script.sh"

    detected_ip=$(get_best_ip)

    if [[ -z "$detected_ip" ]]; then
        log_warn "Aucune IP 10.x.x.x détectée. Utilisation de l'adresse locale par défaut (127.0.0.1)."
        detected_ip="127.0.0.1"
    else
        log_info "IP 10.x détectée : $detected_ip"
    fi

    CNF_FILE="$SSL_DIR/openssl.conf"
    CERT_KEY="$SSL_DIR/key.pem"
    CERT_PEM="$SSL_DIR/cert.pem"

    mkdir -p "$SSL_DIR"

    cat > "$CNF_FILE" <<EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C=FR
ST=Ile-de-France
L=Paris
O=Production
OU=TransApp
CN=localhost

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ${detected_ip}
EOF

    if [[ -x "$EXTERNAL_SCRIPT" ]]; then
        log_info "Exécution de $EXTERNAL_SCRIPT..."
        "$EXTERNAL_SCRIPT"
        if [[ $? -ne 0 ]]; then
            log_error "Le script $EXTERNAL_SCRIPT a échoué."
            exit 1
        fi
    else
        log_warn "Le script $EXTERNAL_SCRIPT est introuvable ou non exécutable."
    fi

    echo
    log_info "Lancement de Docker Compose avec PUBLIC_IP=$detected_ip ..."
	PUBLIC_IP="$detected_ip" docker compose -f .devcontainer/docker-compose.yml up -d && docker exec -it trans-dev bash
    # PUBLIC_IP="$detected_ip" docker compose -f .devcontainer/docker-compose.yml up -d && docker exec -it trans-prod bash -c "npm run prod"}
}

main "$@"
