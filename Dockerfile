# FOR DEV
FROM node:22-slim AS dev

WORKDIR /app

# COPY package*.json ./

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# RUN npm install

# COPY . .

CMD [ "npm", "run", "dev" ]


# FOR PROD
FROM node:22-slim AS prod

WORKDIR /app

COPY --from=dev /app .

RUN npm prune --production

CMD ["node", "dist/index.js"]
