FROM node:23-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS dependency_fetcher

WORKDIR /build

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,target=${PNPM_HOME} pnpm fetch --frozen-lockfile
RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile --prod

FROM base AS builder

WORKDIR /build

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the project
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
COPY --from=builder /build/apps/web/package.json ./apps/web/package.json
COPY --from=builder /build/apps/web/.next ./apps/web/.next

ENV NODE_ENV production

CMD ["pnpm", "run", "start"]
