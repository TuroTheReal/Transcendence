#!/bin/sh
set -e

echo "🔧 Configuration d'AlertManager avec vos variables..."

# Phase 1: Vérification des variables d'environnement critiques
# Cette étape est cruciale car sans ces variables, AlertManager ne peut pas envoyer d'emails
if [ -z "$ALERT_EMAIL" ]; then
    echo "❌ Erreur: Variable ALERT_EMAIL manquante"
    echo "Assurez-vous que ALERT_EMAIL est définie dans votre fichier .env"
    exit 1
fi

if [ -z "$ALERT_PASSWORD" ]; then
    echo "❌ Erreur: Variable ALERT_PASSWORD manquante"
    echo "Assurez-vous que ALERT_PASSWORD est définie dans votre fichier .env"
    exit 1
fi

echo "📧 Email configuré: $ALERT_EMAIL"
echo "🔐 Mot de passe configuré: [MASQUÉ]"
echo "🌐 Port configuré: $ALERT_PORT"

# Phase 3: Préparation du fichier de configuration
# Nous copions le template vers le fichier final que AlertManager utilisera
echo "📝 Préparation du fichier de configuration..."
cp /etc/alertmanager/alertmanager.yml.template /etc/alertmanager/alertmanager.yml

# Vérification que le template existe
if [ ! -f "/etc/alertmanager/alertmanager.yml.template" ]; then
    echo "❌ Erreur: Le fichier template alertmanager.yml.template est introuvable"
    exit 1
fi

# Phase 4: Remplacement des placeholders par les vraies valeurs
# Utilisation du délimiteur | pour éviter les conflits avec les caractères spéciaux dans l'email
echo "🔄 Remplacement des variables dans le fichier de configuration..."
sed -i "s|__ALERT_EMAIL__|$ALERT_EMAIL|g" /etc/alertmanager/alertmanager.yml

# Traitement spécial pour le mot de passe qui peut contenir des caractères spéciaux
# Nous échappons d'abord les caractères qui pourraient casser la commande sed
ESCAPED_PASSWORD=$(printf '%s\n' "$ALERT_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')
sed -i "s|__ALERT_PASSWORD__|$ESCAPED_PASSWORD|g" /etc/alertmanager/alertmanager.yml

# Phase 5: Vérification que toutes les substitutions ont réussi
# Si des placeholders restent, c'est qu'il y a eu un problème
echo "🔍 Vérification de la configuration..."
if grep -q "__ALERT_EMAIL__\|__ALERT_PASSWORD__" /etc/alertmanager/alertmanager.yml; then
    echo "❌ Erreur: Des placeholders n'ont pas été remplacés correctement"
    echo "Contenu du fichier de configuration généré:"
    echo "----------------------------------------"
    cat /etc/alertmanager/alertmanager.yml
    echo "----------------------------------------"
    exit 1
fi

# Phase 6: Vérification de la présence du template d'email
if [ ! -f "/etc/alertmanager/email.tmpl" ]; then
    echo "⚠️  Attention: Template d'email introuvable, les notifications pourraient ne pas être formatées"
fi

echo "✅ Configuration AlertManager complète et validée"
echo "🚀 Démarrage d'AlertManager..."

# Phase 7: Démarrage d'AlertManager
# Le mot-clé 'exec' remplace complètement ce processus par AlertManager
# Cela garantit que AlertManager devient le processus principal du conteneur
# et recevra correctement les signaux Docker (SIGTERM, etc.)
exec /bin/alertmanager \
    --config.file=/etc/alertmanager/alertmanager.yml \
    --storage.path=/alertmanager \
    --web.external-url=http://localhost:9093 \
    --cluster.listen-address=