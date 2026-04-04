# Agents

## Quick Reference

| Item      | Value                        |
| --------- | ---------------------------- |
| Runtime   | Bun 1.x                      |
| Framework | Hono                         |
| Language  | TypeScript 6                 |
| Container | Podman/Docker (ARM64, AMD64) |
| License   | MPL-2.0                      |

## Commands

```bash
bun run build       # Build
bun run typecheck   # Type check
bun run lint        # Lint
bun run test        # Tests
bun run format      # Format
```

## Files

| File                 | Purpose                 |
| -------------------- | ----------------------- |
| `src/main.ts`        | Main application        |
| `src/__tests__/`     | Unit tests              |
| `Dockerfile`         | Container build         |
| `docker-compose.yml` | Container orchestration |
| `package.json`       | Dependencies & scripts  |
| `tsconfig.json`      | TypeScript config       |

## Code Style

- English comments only
- TypeScript strict mode
- ESLint + Prettier via lefthook
- Conventional commits

## Environment

| Variable    | Default                  |
| ----------- | ------------------------ |
| `PORT`      | `3000`                   |
| `MODEM_URL` | `http://192.168.8.1/api` |
