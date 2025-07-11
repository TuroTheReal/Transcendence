#!/bin/bash

set -e  # Arrêter en cas d'erreur

# === PROTECTION CONTRE LES DOUBLES EXECUTIONS ===
LOCK_FILE="/var/lock/transcendence-cleanup.lock"
SCRIPT_PID=$$

# Fonction pour nettoyer le fichier de verrou à la sortie
cleanup_lock() {
	if [ -f "$LOCK_FILE" ]; then
		local lock_pid=$(cat "$LOCK_FILE")
		if [ "$lock_pid" = "$SCRIPT_PID" ]; then
			rm -f "$LOCK_FILE"
			echo "[INFO] Verrou supprimé par le processus $SCRIPT_PID"
		fi
	fi
}

# Configurer le nettoyage automatique du verrou
trap cleanup_lock EXIT INT TERM

# Vérifier si une instance est déjà en cours d'exécution
if [ -f "$LOCK_FILE" ]; then
	lock_pid=$(cat "$LOCK_FILE")
	if kill -0 "$lock_pid" 2>/dev/null; then
		echo "[AVERTISSEMENT] Une instance du script est déjà en cours d'exécution (PID: $lock_pid)"
		echo "[INFO] Arrêt de cette instance pour éviter les conflits"
		exit 0
	else
		echo "[INFO] Fichier de verrou orphelin détecté, nettoyage en cours..."
		rm -f "$LOCK_FILE"
	fi
fi

# Créer le fichier de verrou
echo "$SCRIPT_PID" > "$LOCK_FILE"
echo "[INFO] Verrou créé avec PID: $SCRIPT_PID"

# === CHARGEMENT DES VARIABLES D'ENVIRONNEMENT ===
# Charger les variables d'environnement si nous sommes dans un contexte cron
if [ -f "/etc/cron.environment" ]; then
	# Source le fichier d'environnement créé par Docker
	source /etc/cron.environment
	echo "[INFO] Variables d'environnement chargées depuis /etc/cron.environment"
else
	echo "[AVERTISSEMENT] Fichier /etc/cron.environment non trouvé"
fi

# === CONFIGURATION ET VALIDATION ===
# Configuration avec valeurs par défaut robustes
ELASTIC_URL="${ELASTIC_URL:-http://elasticsearch:9200}"
ELASTIC_USER="${ELASTIC_USER:-elastic}"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD}"
INDEX_PATTERN="transcendence*"
LOG_FILE="/var/log/transcendence-cleanup.log"
METRICS_FILE="/var/log/transcendence-cleanup-metrics.log"

# Créer les fichiers de log s'ils n'existent pas
touch "$LOG_FILE" "$METRICS_FILE"

# Vérification que les variables critiques sont définies
if [ -z "$ELASTIC_PASSWORD" ]; then
	echo "[ERREUR] $(date '+%Y-%m-%d %H:%M:%S') ELASTIC_PASSWORD non défini" >> "$LOG_FILE"
	exit 1
fi

# Configuration du fuseau horaire
export TZ="Europe/Paris"

# === FONCTIONS UTILITAIRES ===
# Fonction de logging avec timestamp améliorée
log_message() {
	local level="${2:-INFO}"
	local message="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [PID:$SCRIPT_PID] $1"
	echo "$message" >> "$LOG_FILE"
}

# Fonction de vérification de la connectivité avec retry améliorée
check_elasticsearch_connectivity() {
	local max_retries=3
	local retry_delay=5
	local attempt=1

	while [ $attempt -le $max_retries ]; do
		log_message "Tentative de connexion à Elasticsearch ($attempt/$max_retries)"

		# Test de connectivité plus robuste
		local health_response=$(curl -s -w "%{http_code}" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
			"$ELASTIC_URL/_cluster/health" -o /tmp/health_response.json)

		if [ "$health_response" = "200" ]; then
			log_message "Connexion à Elasticsearch réussie"
			local cluster_status=$(grep -o '"status":"[^"]*"' /tmp/health_response.json | cut -d'"' -f4)
			log_message "Statut du cluster: $cluster_status"
			return 0
		else
			log_message "Échec de la connexion à Elasticsearch (tentative $attempt) - Code HTTP: $health_response" "WARN"
			if [ $attempt -lt $max_retries ]; then
				log_message "Nouvelle tentative dans ${retry_delay} secondes..."
				sleep $retry_delay
			fi
		fi

		attempt=$((attempt + 1))
	done

	log_message "ERREUR: Impossible de se connecter à Elasticsearch après $max_retries tentatives" "ERROR"
	return 1
}

# Fonction pour supprimer les documents selon leurs critères de rétention
cleanup_by_retention() {
	local category=$1
	local retention_days=$2

	log_message "Nettoyage des logs de catégorie '$category' avec rétention de $retention_days jours"

	# Construire la requête de suppression
	local query='{
		"query": {
			"bool": {
				"must": [
					{"term": {"log_category": "'$category'"}},
					{"range": {"@timestamp": {"lte": "now-'$retention_days'd"}}}
				]
			}
		}
	}'

	# Compter d'abord les documents qui vont être supprimés
	local count_response=$(curl -s -w "%{http_code}" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
		-X POST "$ELASTIC_URL/$INDEX_PATTERN/_count" \
		-H "Content-Type: application/json" \
		-d "$query" -o /tmp/count_response.json)

	if [ "$count_response" != "200" ]; then
		log_message "Erreur lors du comptage des documents pour la catégorie '$category' - Code HTTP: $count_response" "ERROR"
		return 1
	fi

	local count=$(grep -o '"count":[0-9]*' /tmp/count_response.json | cut -d':' -f2)

	if [[ "$count" =~ ^[0-9]+$ ]] && [ "$count" -gt 0 ]; then
		log_message "Suppression de $count documents de catégorie '$category'"

		# Effectuer la suppression
		local delete_response=$(curl -s -w "%{http_code}" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
			-X POST "$ELASTIC_URL/$INDEX_PATTERN/_delete_by_query" \
			-H "Content-Type: application/json" \
			-d "$query" -o /tmp/delete_response.json)

		if [ "$delete_response" = "200" ]; then
			# Extraire les métriques du résultat
			local deleted=$(grep -o '"deleted":[0-9]*' /tmp/delete_response.json | cut -d':' -f2)
			local took=$(grep -o '"took":[0-9]*' /tmp/delete_response.json | cut -d':' -f2)

			log_message "Suppression terminée: $deleted documents supprimés en ${took}ms"

			# Écrire les métriques pour Prometheus
			echo "transcendence_logs_deleted_total{category=\"$category\"} $deleted" >> "$METRICS_FILE"
			echo "transcendence_logs_cleanup_duration_ms{category=\"$category\"} $took" >> "$METRICS_FILE"
		else
			log_message "Erreur lors de la suppression des documents pour la catégorie '$category' - Code HTTP: $delete_response" "ERROR"
		fi
	else
		log_message "Aucun document à supprimer pour la catégorie '$category'"
	fi
}

# Fonction pour nettoyer les index vides
cleanup_empty_indices() {
	log_message "Recherche des index vides à supprimer"

	local indices_response=$(curl -s -w "%{http_code}" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
		"$ELASTIC_URL/_cat/indices/$INDEX_PATTERN?h=index,docs.count" -o /tmp/indices_response.txt)

	if [ "$indices_response" != "200" ]; then
		log_message "Erreur lors de la récupération des index - Code HTTP: $indices_response" "ERROR"
		return 1
	fi

	local indices=$(awk '$2 == "0" {print $1}' /tmp/indices_response.txt)

	for index in $indices; do
		log_message "Suppression de l'index vide: $index"
		local delete_response=$(curl -s -w "%{http_code}" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
			-X DELETE "$ELASTIC_URL/$index" -o /dev/null)

		if [ "$delete_response" = "200" ]; then
			log_message "Index $index supprimé avec succès"
		else
			log_message "Erreur lors de la suppression de l'index $index - Code HTTP: $delete_response" "ERROR"
		fi
	done
}

# Fonction pour calculer l'espace libéré
calculate_space_freed() {
	local space_response=$(curl -s -w "%{http_code}" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
		"$ELASTIC_URL/_cat/indices/$INDEX_PATTERN?h=store.size&bytes=b" -o /tmp/space_response.txt)

	if [ "$space_response" = "200" ]; then
		local total_bytes=$(awk '{sum += $1} END {print sum}' /tmp/space_response.txt)
		echo "${total_bytes:-0}"
	else
		echo "0"
	fi
}

# === FONCTION PRINCIPALE ===
main() {
	log_message "=== Début du nettoyage des logs (PID: $SCRIPT_PID) ==="

	# Afficher les informations de configuration pour le debug
	log_message "Configuration: ELASTIC_URL=$ELASTIC_URL, ELASTIC_USER=$ELASTIC_USER"

	# Vérifier la connectivité à Elasticsearch avec retry
	if ! check_elasticsearch_connectivity; then
		log_message "Échec de la connectivité - Arrêt du script" "ERROR"
		exit 1
	fi

	# Initialiser le fichier de métriques
	echo "# Métriques de nettoyage des logs - $(date)" > "$METRICS_FILE"

	# Calculer l'espace avant nettoyage
	local space_before=$(calculate_space_freed)
	log_message "Espace utilisé avant nettoyage: $space_before bytes"

	# Nettoyer selon les catégories définies
	cleanup_by_retention "critical" 60	# Logs critiques : 60 jours
	cleanup_by_retention "important" 30   # Logs importants : 30 jours
	cleanup_by_retention "standard" 10	# Logs standard : 10 jours
	cleanup_by_retention "temporary" 5	# Logs temporaires : 5 jours
	cleanup_by_retention "unknown" 30	 # Logs sans catégorie : 30 jours

	# Nettoyer les index vides
	cleanup_empty_indices

	# Calculer l'espace après nettoyage
	local space_after=$(calculate_space_freed)
	local space_freed=$((space_before - space_after))

	log_message "Espace libéré: ${space_freed} bytes"
	echo "transcendence_logs_space_freed_bytes $space_freed" >> "$METRICS_FILE"

	log_message "=== Nettoyage terminé (PID: $SCRIPT_PID) ==="

	# Le verrou sera automatiquement supprimé par la fonction cleanup_lock()
}

# === EXECUTION ===
# Exécuter le script
main "$@"
