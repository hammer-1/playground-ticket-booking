# syntax=docker/dockerfile:1
# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22 AS build
WORKDIR /app

# pnpm + a persistent store cache mount: packages download once and are reused on
# every later build, and pnpm installs faster than npm ci. Bootstrap pnpm with npm
# (not corepack): corepack uses a hard 10s connect timeout that a throttled network
# fails, whereas npm honors fetch-timeout.
RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 5 \
    && npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --store-dir=/pnpm/store

COPY . .

# Vite inlines these at build time (the browser uses them, so they point at the
# published host ports). Passed from docker-compose build args.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN pnpm run build

# ── Serve stage ──────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
