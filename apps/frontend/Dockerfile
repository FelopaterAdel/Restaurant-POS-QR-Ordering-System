# Restaurant POS frontend (Vite build served by nginx).
# Build from the repo root: docker build -f apps/frontend/Dockerfile .
# Override the API base with --build-arg VITE_API_URL=/api/v1 (default below
# proxies /api to the backend container).
ARG VITE_API_URL=/api/v1

FROM node:22-alpine AS build
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/frontend ./apps/frontend

RUN pnpm install --frozen-lockfile --filter frontend... --fetch-retries 5 --fetch-timeout 120000
RUN pnpm --filter frontend build

FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
