# Agents

## Quick Reference

| Item      | Value                        |
| --------- | ---------------------------- |
| Runtime   | Bun 1.x                      |
| Framework | ElysiaJS                     |
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

| File                              | Purpose                            |
| --------------------------------- | ---------------------------------- |
| `src/app.ts`                      | Main application entry point       |
| `src/lib/`                        | Core utilities                     |
| `src/lib/utils.ts`                | Shared helpers (auth, XML parsing) |
| `src/controllers/`                | Controller directory               |
| `src/controllers/public.ts`       | Public routes (health)             |
| `src/controllers/api/`            | API controller directory           |
| `src/controllers/api/index.ts`    | API aggregator                     |
| `src/controllers/api/sms.ts`      | SMS endpoints                      |
| `src/controllers/api/ussd.ts`     | USSD endpoints                     |
| `src/controllers/api/contacts.ts` | Contacts endpoints                 |
| `src/types.d.ts`                  | Environment type definitions       |
| `src/__tests__/`                  | Unit tests                         |
| `Dockerfile`                      | Container build                    |
| `docker-compose.yml`              | Container orchestration            |
| `package.json`                    | Dependencies & scripts             |
| `tsconfig.json`                   | TypeScript config                  |

## Code Style

- English comments only
- TypeScript strict mode
- ESLint + Prettier via lefthook
- Conventional commits
- Use `@/` alias for internal imports
- Import order: internal → external → builtin

## Architecture

```
Request → ElysiaJS → Controllers → Modem API
```

Controllers are Elysia instances with `prefix` and `tags`:

```typescript
export const Controller = new Elysia({ prefix: "/path", tags: ["Tag"] })
    .post("/action", handler, { body: Schema, detail: {...} })
    .get("/list", handler);
```

## Environment

| Variable    | Default                  |
| ----------- | ------------------------ |
| `PORT`      | `3000`                   |
| `MODEM_URL` | `http://192.168.8.1/api` |
