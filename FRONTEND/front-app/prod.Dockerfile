# STEP 1 : Builder
FROM node:23-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile --force
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder values satisfy module-level checks during static analysis at build time.
# Real values are injected at runtime via compose env_file and override these.
ENV DATABASE_URL=postgresql://build-placeholder:x@localhost:5432/placeholder
ENV JWT_SECRET_KEY=build-placeholder
ENV BACKEND_URL=http://localhost:8000
ENV AUTH_USERNAME=build
ENV AUTH_PASSWORD=build
RUN npm run build

# STEP 2 : Runtime
FROM node:23-slim
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/middleware.ts ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/tsconfig.json ./
EXPOSE 3000
CMD ["npm", "start"]
