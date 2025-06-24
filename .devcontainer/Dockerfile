# FOR DEV
FROM node:22-slim AS dev

WORKDIR /app

COPY package*.json ./

RUN apt-get update && \
    apt-get install -y git curl && \
	apt-get install -y procps && \
    rm -rf /var/lib/apt/lists/* \
	apt-get update


RUN npm install

COPY . .

CMD [ "npm", "run", "dev" ]

EXPOSE 3000 5173


# FOR PROD
FROM node:22-slim AS prod

WORKDIR /app

COPY --from=dev /app .

RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/index.js"]
