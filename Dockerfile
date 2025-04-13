FROM node:23-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS dependencies
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile

FROM dependencies AS builder
WORKDIR /app

COPY . .

RUN pnpm run build

FROM base AS production
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next

ENV NODE_ENV=production

# Start both services
CMD ["pnpm", "run", "start"]
