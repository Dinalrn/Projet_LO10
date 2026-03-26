## File: /FRONTEND/front-app/prod.Dockerfile

# STEP 1 : Builder
FROM node:23-slim AS builder

# ENV SECRETS :
# ARG JWT_SECRET
# ARG DATABASE_URL  
# ARG BETTER_AUTH_SECRET

# ENV JWT_SECRET=$JWT_SECRET
# ENV DATABASE_URL=$DATABASE_URL
# ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile --force

COPY . .
#Temporar but unused warn keep from production to switch back to RUN npm run build
RUN npm run build -- --no-lint 

# STEP 2 : Staging App
FROM node:23-slim

WORKDIR /app
ENV NODE_ENV=production

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