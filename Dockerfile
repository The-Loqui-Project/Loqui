FROM node:23-slim AS base

ENV PNPM_HOME="/pnpm"
RUN corepack enable

FROM base AS dependency_fetcher

WORKDIR /build

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=${PNPM_HOME} pnpm fetch --frozen-lockfile
RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile --prod

FROM base AS builder

WORKDIR /build

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache before install: $(ls -la ${PNPM_HOME})"
RUN --mount=type=cache,target=${PNPM_HOME} \
  pnpm config set store-dir ${PNPM_HOME} && \
  pnpm install --frozen-lockfile --prefer-offline
RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache after install: $(ls -la ${PNPM_HOME})"

COPY . .
RUN pnpm run build

FROM base

WORKDIR /app

# node_modules
COPY --from=dependency_fetcher /build/node_modules ./node_modules

# package.json
COPY --from=builder /build/package.json ./package.json

# apps/api
COPY --from=builder /build/apps/api/package.json ./apps/api/package.json
COPY --from=builder /build/apps/api/dist ./apps/api/dist

# apps/web
COPY --from=build /build/apps/web/package.json ./apps/web/package.json
COPY --from=build /build/apps/web/.next ./apps/web/.next

# Disable NextJS' telemetry
RUN ./node_modules/.bin/next telemetry disable

ENV NODE_ENV production

CMD ["pnpm", "run", "start"]
