# Contributing

In root folder:

```sh
pnpm install
cd apps/api
(sudo) pnpm run dev:test-db:setup
(sudo) pnpm run dev:test-db
(sudo) pnpm run db:push
```

Fill out `.env` in `next.config.ts` (apps/web) and in (apps/api).

Run `pnpm run dev` (in root folder) to start both frontend and backend
