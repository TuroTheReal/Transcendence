#!/bin/bash

# Detect IP address
DETECTED_IP=$(ip route get 8.8.8.8 | awk '{print $7; exit}' 2>/dev/null || echo "127.0.0.1")
if [[ -z "$DETECTED_IP" ]]; then
    DETECTED_IP="127.0.0.1"
fi

# Create SSL directory if it doesn't exist
mkdir -p backend/ssl

# Generate OpenSSL configuration
cat > backend/ssl/openssl.conf <<EOF
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
IP.2 = ${DETECTED_IP}
EOF

# Generate SSL certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout backend/ssl/key.pem \
    -out backend/ssl/cert.pem \
    -config backend/ssl/openssl.conf

# Set proper permissions
chmod 600 backend/ssl/*.pem

echo "SSL certificates generated successfully with IP: $DETECTED_IP"
echo "Generated files:"
ls -la backend/ssl/