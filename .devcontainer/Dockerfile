# FOR DEV
FROM node:22-slim AS dev

WORKDIR /app

RUN apt-get update && \
apt-get install -y bash git curl procps && \
rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

CMD ["bash", "-c", "exec npm run dev"]

EXPOSE 3000 5173


# FOR PROD
FROM node:22-slim AS prod

WORKDIR /app

COPY package*.json ./

RUN npm ci && \
    npm cache clean --force

COPY . .

RUN npm run build:prod

RUN rm -rf src/ && \
    rm -rf public/ && \
    rm -rf *.config.js && \
    rm -rf tsconfig.json && \
    rm -rf node_modules && \
    npm ci --only=production

EXPOSE 3000

CMD ["npm", "start"]
