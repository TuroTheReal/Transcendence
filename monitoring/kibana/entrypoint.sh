#!/bin/bash
set -e

TOKEN_FILE="/shared/kibana_token"

echo "=== DÉBUT DU DIAGNOSTIC KIBANA ==="
echo "Utilisateur initial: $(whoami)"
echo "UID/GID initial: $(id)"
echo "Variables d'environnement Kibana:"
env | grep -i kibana || echo "Aucune variable Kibana trouvée"

echo "Recherche du token Kibana..."
timeout=60
count=0

while [ ! -f "$TOKEN_FILE" ] && [ $count -lt $timeout ]; do
    sleep 1
    count=$((count + 1))
done

if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
    echo "Token Kibana chargé depuis $TOKEN_FILE (longueur: ${#TOKEN})"
    echo "Permissions du fichier token: $(ls -la "$TOKEN_FILE")"
else
    echo "Erreur : fichier token $TOKEN_FILE non trouvé après ${timeout}s d'attente !"
    echo "Contenu du répertoire /shared: $(ls -la /shared/ || echo 'Répertoire inaccessible')"
    TOKEN=""
fi

echo "=== PRÉPARATION DE L'ENVIRONNEMENT ==="
echo "gosu installé: $(gosu --version)"

# Créer l'utilisateur kibana avec diagnostics détaillés
if id kibana >/dev/null 2>&1; then
    echo "Utilisateur kibana existe déjà: $(id kibana)"
else
    echo "Création de l'utilisateur kibana..."
    groupadd -g 1000 kibana
    useradd -u 1000 -g 1000 -s /bin/bash -m kibana
    echo "Utilisateur kibana créé: $(id kibana)"
fi

# Diagnostic des répertoires et permissions
echo "=== DIAGNOSTIC DES PERMISSIONS ==="
echo "Répertoire /usr/share/kibana:"
ls -la /usr/share/kibana/ | head -10

echo "Création et ajustement des permissions..."
mkdir -p /usr/share/kibana/data
mkdir -p /usr/share/kibana/logs

# Ajuster les permissions de manière plus complète
echo "Ajustement des permissions pour l'utilisateur kibana..."
chown -R kibana:kibana /usr/share/kibana/data
chown -R kibana:kibana /usr/share/kibana/logs
# S'assurer que kibana peut lire sa propre configuration
chown kibana:kibana /usr/share/kibana/config/kibana.yml 2>/dev/null || echo "Pas de kibana.yml personnalisé"

# Vérifier que le répertoire /shared est accessible
chmod 755 /shared
echo "Permissions après ajustement:"
echo "/shared: $(ls -ld /shared)"
echo "/usr/share/kibana/data: $(ls -ld /usr/share/kibana/data)"

echo "=== TEST PRÉALABLE AVEC GOSU ==="
# Tester que gosu fonctionne correctement
echo "Test gosu - utilisateur actuel après changement:"
gosu kibana whoami
echo "Test gosu - UID/GID après changement:"
gosu kibana id

# Lancer Kibana avec diagnostics
echo "Démarrage de Kibana en tant qu'utilisateur kibana..."
ls -l /usr/local/bin/kibana-docker || echo "ERREUR : /usr/local/bin/kibana-docker introuvable"
exec gosu kibana /usr/local/bin/kibana-docker --elasticsearch.serviceAccountToken="$TOKEN" "$@"

# #!/bin/bash
# set -e

# TOKEN_FILE="/shared/kibana_token"

# echo "Recherche du token Kibana..."
# timeout=60
# count=0
# while [ ! -f "$TOKEN_FILE" ] && [ $count -lt $timeout ]; do
#     sleep 1
#     count=$((count + 1))
# done

# if [ -f "$TOKEN_FILE" ]; then
# 	cat $TOKEN_FILE
#     TOKEN=$(cat "$TOKEN_FILE")
#     echo "Token Kibana chargé depuis $TOKEN_FILE"
# else
#     echo "Erreur : fichier token $TOKEN_FILE non trouvé après ${timeout}s d'attente !"
#     echo "Démarrage de Kibana sans token (à configurer manuellement)"
# fi

# echo "Démarrage de Kibana..."
# exec /usr/local/bin/kibana-docker --elasticsearch.serviceAccountToken="$TOKEN" "$@"