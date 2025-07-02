# FOR DEV
FROM node:22-slim AS dev

WORKDIR /app

RUN apt-get update && \
apt-get install -y bash git curl procps lsof && \
rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000 5173

CMD ["bash", "-c", "exec npm run dev"]


# FOR PROD
FROM node:22-slim AS prod

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci && \
    npm cache clean --force

COPY . .

RUN npm run build

RUN rm -rf backend/src/ && \
    rm -rf *.config.js && \
    rm -rf backend/tsconfig.json && \
    rm -rf node_modules && \
    npm ci --only=production

EXPOSE 3000

CMD ["npm", "start"]