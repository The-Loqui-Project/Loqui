FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Define build arguments for URLs
ARG CURRENT_URL
ARG API_URL

FROM base AS dependencies
WORKDIR /app

COPY . .

RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile

FROM dependencies AS builder
WORKDIR /app

# Set environment variables for the build process
ENV CURRENT_URL=${CURRENT_URL}
ENV API_URL=${API_URL}

# Create .env file for Next.js build time
RUN mkdir -p apps/web && \
    echo "API_URL=${API_URL}" > apps/web/.env && \
    echo "CURRENT_URL=${CURRENT_URL}" >> apps/web/.env && \
    echo "IS_DEV_MODE=false" >> apps/web/.env

RUN pnpm run build

FROM base AS production
WORKDIR /app

COPY --from=builder /app .

# Install production dependencies only
RUN --mount=type=cache,target=${PNPM_HOME} pnpm install --frozen-lockfile --prod

ENV NODE_ENV=production

# Start both services
CMD ["pnpm", "run", "start"]
