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

RUN pnpm run build

FROM node:alpine AS runner

ENV PNPM_HOME="/pnpm"
RUN corepack enable

WORKDIR /build

COPY --from=builder /build/node_modules /build/node_modules
COPY --from=builder /build .

CMD ["pnpm", "run", "start"]
