## File: /FRONTEND/front-app/prod.Dockerfile
# STEP 1 : Builder
FROM node:23-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile --force
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# STEP 2 : Staging App
FROM node:23-slim
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tailwind.config.js ./
COPY --from=builder /app/tailwind.config.ts ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/components.json ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/migrations ./migrations
EXPOSE 3000
CMD ["npm", "start"]
