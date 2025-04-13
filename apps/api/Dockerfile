FROM node:21-slim AS builder

ENV PNPM_HOME="/pnpm"
RUN corepack enable

WORKDIR /build/apps/api
COPY . .

RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache before install: $(ls -la ${PNPM_HOME})"
RUN --mount=type=cache,target=${PNPM_HOME} \
  pnpm config set store-dir ${PNPM_HOME} && \
  pnpm install --frozen-lockfile --prefer-offline
RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache after install: $(ls -la ${PNPM_HOME})"

RUN cp .env.example .env && \
  sed -i "s/DEV_MODE=true/DEV_MODE=false/g" .env && \
  sed -i "s/MODRINTH_CLIENT_SECRET=*******/MODRINTH_CLIENT_SECRET=$MODRINTH_CLIENT_SECRET/g" .env && \
  sed -i "s/loqui_test_db/$DATABASE_NAME/g" .env && \
  sed -i "s/password/$DATABASE_PASSWORD/g" .env

FROM node:alpine AS runner

WORKDIR /build/apps/api

COPY --from=builder /build/apps/api/node_modules /build/apps/api/node_modules
COPY --from=builder /build/apps/api .

CMD ["pnpm", "run", "db:push"]
