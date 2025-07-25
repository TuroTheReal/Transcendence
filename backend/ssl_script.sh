#!/bin/bash

# IP de votre machine sur le réseau local.
# Changez cette valeur si votre IP change.
PUBLIC_IP="10.16.13.4"
DOMAIN_NAME="localhost"

echo "🔐 Génération des certificats SSL"
echo "=================================================="
echo "IP configurée: $PUBLIC_IP"
echo "Domaine/CN: $DOMAIN_NAME"
echo ""

# Créer le dossier ssl s'il n'existe pas
mkdir -p ssl

# Créer un fichier de configuration OpenSSL pour inclure les SAN (Subject Alternative Names)
# et le bon Key Usage, ce qui est crucial pour que les navigateurs modernes acceptent le certificat.
cat > ssl/openssl.conf << EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C=FR
ST=Ile de France
L=Paris
O=Development
OU=Dev
CN=$DOMAIN_NAME

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = $PUBLIC_IP
EOF

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