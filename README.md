# Huawei LTE Gateway Service

Service gateway for interacting with Huawei LTE Modem web API endpoints. Built with Hono for fast routing and communication handling.

## Features

- **Healthcheck** (`/health`): Checks modem connection status and signal strength
- **SMS Sending** (`/sms/send`): Sends SMS messages via modem API
- **SMS Inbox** (`/sms/inbox`): Fetches latest received SMS messages
- **USSD/Balance Check** (`/ussd`): Sends USSD codes and retrieves responses
- **Contacts** (`/contacts`): Fetches contacts stored on the SIM card

## Quick Deploy

```bash
# One-liner install
curl -fsSL https://raw.githubusercontent.com/raflymln/huawei-lte-gateway/main/install.sh | bash

# Or manually create compose.yml and run
podman compose up -d
```

## Deployment

### Prerequisites

- Podman or Docker

### Environment Variables

| Variable    | Default                  | Description          |
| ----------- | ------------------------ | -------------------- |
| `PORT`      | `3000`                   | Service port         |
| `MODEM_URL` | `http://192.168.8.1/api` | Huawei modem API URL |

### Run with Podman

```bash
# Pull latest image
podman pull ghcr.io/raflymln/huawei-lte-gateway:latest

# Start
podman compose up -d

# Update
podman compose pull && podman compose up -d
```

## Local Development

```bash
bun install
bun run build
bun run dev
```

## API Reference

Base URL: `http://192.168.8.1/api`

### Authentication

All requests (except `/health`) require session and token authentication, automatically fetched from the modem's webserver.

### Endpoints

| Method | Endpoint     | Description                   |
| ------ | ------------ | ----------------------------- |
| GET    | `/health`    | Check modem status and signal |
| POST   | `/sms/send`  | Send SMS (`{ to, message }`)  |
| GET    | `/sms/inbox` | Get latest SMS messages       |
| POST   | `/ussd`      | Send USSD code (`{ code }`)   |
| GET    | `/contacts`  | Get SIM card contacts         |

## Development Scripts

```bash
bun run typecheck  # TypeScript type checking
bun run lint       # ESLint
bun run format     # Prettier formatting
bun run test       # Run tests
```

## License

MPL-2.0 - Rafly Maulana (rafly@tako.id)
