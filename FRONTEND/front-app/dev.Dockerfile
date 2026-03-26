## File: FRONTEND/front-app/dev.Dockerfile

FROM node:23-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --fetch-timeout=60000 --fetch-retries=5

COPY . .
# COPY ./migrations ./migrations

CMD ["npm", "run", "dev"]