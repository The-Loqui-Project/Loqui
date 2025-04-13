FROM node:21-slim AS builder

ENV PNPM_HOME="/pnpm"
RUN corepack enable

WORKDIR /build
COPY . .

RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache before install: $(ls -la ${PNPM_HOME})"
RUN --mount=type=cache,target=${PNPM_HOME} \
  pnpm config set store-dir ${PNPM_HOME} && \
  pnpm install --frozen-lockfile --prefer-offline
RUN --mount=type=cache,target=${PNPM_HOME} echo "PNPM cache after install: $(ls -la ${PNPM_HOME})"

RUN cp apps/web/template.env apps/web/.env && \
  sed -i "s/IS_DEV_MODE=true/IS_DEV_MODE=false/g" apps/web/.env

FROM node:alpine AS runner

WORKDIR /build

COPY --from=builder /build/node_modules /build/node_modules
COPY --from=builder /build .

CMD ["pnpm", "run", "start"]
