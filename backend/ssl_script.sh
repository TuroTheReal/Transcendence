#!/bin/bash

# Se placer dans le dossier du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

mkdir -p ssl

echo "📝 Configuration OpenSSL (ssl/openssl.conf) créée."
echo ""

echo "🔑 Génération de la clé privée (key.pem)..."
openssl genrsa -out ssl/key.pem 4096

echo "📜 Génération du certificat (cert.pem) avec les bonnes extensions..."
openssl req -new -x509 -nodes -key ssl/key.pem -out ssl/cert.pem -days 365 -config ssl/openssl.conf -extensions v3_req

echo "🔒 Configuration des permissions..."
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo ""
echo "✅ Certificats générés avec succès dans le dossier 'ssl/' !"
echo ""
echo "🔍 Vérification du certificat (vous devriez voir les bonnes IP/DNS dans 'Subject Alternative Name'):"
openssl x509 -in ssl/cert.pem -text -noout | grep -A 5 "Subject Alternative Name"

echo ""
echo "🚀 Vous pouvez maintenant relancer votre serveur."
echo "   N'oubliez pas d'importer 'ssl/cert.pem' dans l'autorité de confiance de votre navigateur si l'erreur persiste."
