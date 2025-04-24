FROM node:23-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Define build arguments for URLs
ARG CURRENT_URL
ARG API_URL

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

# Set environment variables for the build process
ENV CURRENT_URL=${CURRENT_URL}
ENV API_URL=${API_URL}

COPY . .

# Create .env file for Next.js build time
RUN mkdir -p apps/web && \
    echo "API_URL=${API_URL}" > apps/web/.env && \
    echo "CURRENT_URL=${CURRENT_URL}" >> apps/web/.env && \
    echo "IS_DEV_MODE=false" >> apps/web/.env

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
COPY --from=builder /app/apps/api/db/drizzle ./apps/api/dist/db/drizzle
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/.env ./apps/web/.env

ENV NODE_ENV=production

# Start both services
CMD ["pnpm", "run", "start"]
