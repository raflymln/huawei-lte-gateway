# Agents

Documentation for AI agents working on this project.

## Project Overview

- **Type**: Service gateway for Huawei LTE Modem web API
- **Stack**: Bun, TypeScript, Hono, Podman
- **Target**: Orange Pi Zero 3 (ARM64)

## Tech Stack

- **Runtime**: Bun 1.x
- **Framework**: Hono
- **Language**: TypeScript 6
- **Linting**: ESLint 9 + typescript-eslint
- **Testing**: Bun test
- **Container**: Podman/Docker with multi-arch (ARM64, AMD64)
- **CI/CD**: GitHub Actions

## Commands

```bash
bun run build      # Build TypeScript to dist/
bun run typecheck  # TypeScript type checking
bun run lint       # ESLint
bun run test       # Run tests
bun run format     # Prettier formatting
bun run commitlint # Validate commit messages
```

## Development

1. Install dependencies: `bun install`
2. Build: `bun run build`
3. Run locally: `bun run dev` (or use Podman)

## Deployment

```bash
# Via install script
curl -fsSL https://raw.githubusercontent.com/raflymln/huawei-lte-gateway/main/install.sh | bash

# Via Podman
podman compose up -d
```

## Architecture

- `src/main.ts` - Main application with routes
- `src/__tests__/` - Unit tests
- `Dockerfile` - Multi-stage Alpine build
- `compose.yml` - Gateway container

## Code Style

- English comments only
- TypeScript strict mode
- ESLint + Prettier enforced via lefthook
- Conventional commits required

## Environment Variables

| Variable    | Default                  | Description   |
| ----------- | ------------------------ | ------------- |
| `PORT`      | `3000`                   | Service port  |
| `MODEM_URL` | `http://192.168.8.1/api` | Modem API URL |
