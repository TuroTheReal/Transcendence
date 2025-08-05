# # FOR DEV
# FROM node:22-slim AS dev

# WORKDIR /app

# RUN apt-get update && \
# apt-get install -y bash git curl procps lsof  iproute2 iputils-ping net-tools && \
# rm -rf /var/lib/apt/lists/*

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 3002

# CMD ["bash", "-c", "echo 'Container ready. Run npm run dev manually.' && tail -f /dev/null"]

# FOR PROD AS prod
FROM node:22-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl iproute2 && \
    rm -rf /var/lib/apt/lists/*

# Install tsx globally for frontend build
RUN npm install -g tsx

COPY package*.json ./

RUN npm ci && \
    npm cache clean --force




COPY . .

# Create SSL directory
RUN mkdir -p backend/ssl

# Create entrypoint script
RUN echo '#!/bin/bash\n\
\n\
# Generate SSL certificates if they don'\''t exist\n\
if [ ! -f backend/ssl/cert.pem ] || [ ! -f backend/ssl/key.pem ]; then\n\
    echo "Generating SSL certificates..."\n\
    \n\
    # Detect IP address\n\
    DETECTED_IP=$(ip route get 8.8.8.8 | awk '\''{print $7; exit}'\'' 2>/dev/null || echo "127.0.0.1")\n\
    if [[ -z "$DETECTED_IP" ]]; then\n\
        DETECTED_IP="127.0.0.1"\n\
    fi\n\
    \n\
    # Create SSL directory if it doesn'\''t exist\n\
    mkdir -p backend/ssl\n\
    \n\
    # Generate OpenSSL configuration\n\
    cat > backend/ssl/openssl.conf <<EOF\n\
[req]\n\
distinguished_name = req_distinguished_name\n\
x509_extensions = v3_req\n\
prompt = no\n\
\n\
[req_distinguished_name]\n\
C=FR\n\
ST=Ile-de-France\n\
L=Paris\n\
O=Production\n\
OU=TransApp\n\
CN=localhost\n\
\n\
[v3_req]\n\
keyUsage = critical, digitalSignature, keyEncipherment\n\
extendedKeyUsage = serverAuth\n\
subjectAltName = @alt_names\n\
\n\
[alt_names]\n\
DNS.1 = localhost\n\
IP.1 = 127.0.0.1\n\
IP.2 = ${DETECTED_IP}\n\
EOF\n\
    \n\
    # Generate SSL certificates\n\
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\\n\
        -keyout backend/ssl/key.pem \\\n\
        -out backend/ssl/cert.pem \\\n\
        -config backend/ssl/openssl.conf\n\
    \n\
    # Set proper permissions\n\
    chmod 600 backend/ssl/*.pem\n\
    \n\
    echo "SSL certificates generated successfully with IP: $DETECTED_IP"\n\
else\n\
    echo "SSL certificates already exist, skipping generation."\n\
fi\n\
\n\
# Install frontend dependencies and build if dist doesn'\''t exist\n\
if [ ! -d frontend/dist ]; then\n\
    echo "Installing frontend dependencies..."\n\
    cd frontend\n\
    npm install --include=dev\n\
    echo "Building frontend..."\n\
    npm run build\n\
    cd ..\n\
    echo "Frontend build completed"\n\
fi\n\
\n\
# Execute the original command\n\
exec "$@"' > /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Build backend only (frontend will be built at runtime)
RUN npm run build:backend

RUN rm -rf backend/src/ && \
    rm -rf backend/tsconfig.json

EXPOSE 3002

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]
