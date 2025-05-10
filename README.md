# ![Loqui Monorepo Cover](/docs/media/banner.webp)

[!['Build and Publish Loqui' workflow](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_and_publish_image.yml/badge.svg?branch=dev)](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_and_publish_image.yml)
[!['Build Loqui API' workflow](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_api.yml/badge.svg?branch=dev)](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_api.yml)
[!['Build Loqui Web' workflow](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_web.yml/badge.svg?branch=dev)](https://github.com/The-Loqui-Project/Loqui/actions/workflows/build_web.yml)

Loqui is a free and open-source platform that makes translating Minecraft mods easy through crowdsourcing. It's a powerful alternative to Lokalise & Crowdin with deep Modrinth integration.

Developers can easily manage translations with automatic updates and Modrinth OAuth integration, translators have user-friendly tools and earn community recognition and players enjoy seamless access to mods in their own languages through automatic updates or resource packs.

## Loqui Monorepo

Welcome to the repository containing all the code and resources to make Loqui work. The two most important branches you will find here are `dev` and `prod`. The `dev` branch contains code that is currently worked on and isnt live in an production environment, though you can still check out current progress on a staging deployment. The `prod` branch contains stable code that is deployed in production, code from the `dev` eventually ends up here. 
## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [pnpm](https://pnpm.io/) (v9 or later)
- [Docker](https://www.docker.com/) (for a local database setup)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/The-Loqui-Project/Loqui.git
   cd loqui
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Copy the `.env.example` files in `apps/web` and `apps/api` to `.env` and fill in the required values.

4. **Initialize the local test database**:
   ```bash
   cd apps/api
   pnpm run dev:test-db:setup
   pnpm run dev:test-db
   pnpm run db:push
   ```
   
5. **Start the development servers**:
   From the root directory:
   ```bash
   pnpm run dev
   ```
   This will concurrently start both the frontend and backend applications.

### Contributing

We welcome contributions from the community! To get started:

1. **Fork the repository** and create your branch from `dev`:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**.

3. **Run tests** to verify your changes:
   ```bash
   pnpm test
   ```

4. **Commit your changes** with a clear message, adhering to the [Conventional Commits](https://www.conventionalcommits.org) standard:
   ```bash
   git commit -m "feat: Add new feature"
   ```

5. **Push to your fork** and submit a pull request to the `dev` branch; the name of your PR should, like your commit messages, stick to the [Conventional Commits](https://www.conventionalcommits.org) format.
## License

This project is licensed under the [GPLv3/LGPLv3](LICENSE).
