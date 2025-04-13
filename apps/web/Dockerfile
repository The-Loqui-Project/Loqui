FROM node:21-slim AS builder

ENV PNPM_HOME="/pnpm"
RUN corepack enable

WORKDIR /build/apps/web
COPY . .

RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache before install: $(ls -la ${PNPM_HOME})"
RUN --mount=type=cache,target=${PNPM_HOME} \
  pnpm config set store-dir ${PNPM_HOME} && \
  pnpm install --frozen-lockfile --prefer-offline
RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache after install: $(ls -la ${PNPM_HOME})"

RUN cp template.env .env && \
  sed -i "s/IS_DEV_MODE=true/IS_DEV_MODE=false/g" .env

FROM node:alpine AS runner

WORKDIR /build/apps/web

COPY --from=builder /build/apps/web/node_modules /build/apps/web/node_modules
COPY --from=builder /build/apps/web .

CMD ["pnpm", "run", "start"]
