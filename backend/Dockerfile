# syntax=docker/dockerfile:1
# ── Build stage ──────────────────────────────────────────────────────────────
# Full node image (not -slim/-alpine): ships openssl/libssl3 that Prisma needs, so
# no apt-get is required.
FROM node:22 AS build
WORKDIR /app

# pnpm installs faster than npm: a content-addressed store + parallel fetch, and the
# BuildKit cache mount below means packages are downloaded once and reused across
# every build. Bootstrap pnpm with npm (not corepack): corepack uses a hard 10s
# connect timeout that a throttled network fails, whereas npm honors fetch-timeout.
RUN npm config set fetch-timeout 600000 && npm config set fetch-retries 5 \
    && npm install -g pnpm@10

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --store-dir=/pnpm/store

# Generate the Prisma client before compiling (TS imports it).
COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

# node_modules includes @prisma/client (generated) and the prisma CLI used by
# `prisma migrate deploy` at container start. pnpm's node_modules is self-contained
# (its virtual store lives in node_modules/.pnpm), so copying the dir is enough.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 4000
CMD ["node", "dist/main.js"]
