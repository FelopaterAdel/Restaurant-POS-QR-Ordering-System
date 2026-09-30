# Restaurant POS backend (Express + Prisma).
# Build from the repo root: docker build -f apps/backend/Dockerfile .
FROM node:22-alpine AS build
RUN corepack enable
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/database ./packages/database
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile --fetch-retries 5 --fetch-timeout 120000
RUN pnpm --filter @restaurant/database generate
RUN pnpm --filter @restaurant/database build
RUN pnpm --filter backend build

FROM node:22-alpine AS runtime
RUN corepack enable
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/database/dist ./packages/database/dist
COPY --from=build /app/packages/database/package.json ./packages/database/
COPY --from=build /app/packages/database/prisma ./packages/database/prisma
COPY --from=build /app/packages/database/prisma.config.ts ./packages/database/
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/

EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @restaurant/database deploy && node apps/backend/dist/server.js"]
