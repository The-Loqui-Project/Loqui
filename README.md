<img src="./docs/media/icon.svg" width="100px" align="left" style="filter: invert(1);">

<div id="toc">
  <ul style="list-style: none">
    <summary>
      <h1> The Loqui Project</h1>
    </summary>
  </ul>
</div>

[!['Build and Publish Loqui' workflow](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_and_publish_image.yml/badge.svg?branch=dev)](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_and_publish_image.yml)
[!['Build Loqui API' workflow](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_api.yml/badge.svg?branch=dev)](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_api.yml)
[!['Build Loqui Web' workflow](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_web.yml/badge.svg?branch=dev)](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_web.yml)

Loqui is a free and open-source platform that makes translating Minecraft mods easy through crowdsourcing.

## Contributing

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
