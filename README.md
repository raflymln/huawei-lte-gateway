# Huawei LTE Gateway Service

Service gateway for interacting with Huawei LTE Modem web API endpoints. Built with ElysiaJS for high performance and type-safe routing.

> **Note**: Tested on Huawei E3372H-607. Other models may work but are not guaranteed.

## Features

- **Healthcheck** (`/health/`): Checks modem connection status and signal strength
- **SMS Sending** (`/api/sms/send/`): Sends SMS messages via modem API
- **SMS Inbox** (`/api/sms/inbox/`): Fetches latest received SMS messages
- **USSD/Balance Check** (`/api/ussd/`): Sends USSD codes and retrieves responses
- **Contacts** (`/api/contacts/`): Fetches contacts stored on the SIM card

## Quick Deploy

```bash
# Pull and run the latest release
podman run -d \
  --name huawei-gateway \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MODEM_URL=http://192.168.8.1/api \
  ghcr.io/raflymln/huawei-lte-gateway:latest
```

## Deployment

### Prerequisites

- Podman or Docker
- Huawei LTE modem (tested on E3372H-607)

### Environment Variables

| Variable    | Default                  | Description          |
| ----------- | ------------------------ | -------------------- |
| `PORT`      | `3000`                   | Service port         |
| `MODEM_URL` | `http://192.168.8.1/api` | Huawei modem API URL |

### Run with Podman

```bash
podman compose up -d
```

### Docker Image

| Tag                                          | Description           |
| -------------------------------------------- | --------------------- |
| `ghcr.io/raflymln/huawei-lte-gateway:latest` | Latest stable release |
| `ghcr.io/raflymln/huawei-lte-gateway:1.0.0`  | Specific version      |
| `ghcr.io/raflymln/huawei-lte-gateway:<sha>`  | Commit SHA            |

## Local Development

```bash
bun install
bun run build
bun run dev
bun run test     # Run tests with mocked modem API
```

## API Reference

Interactive API documentation available at `/` when running.

Base URL: `http://localhost:3000`

### Authentication

All requests (except `/health/`) require session and token authentication, automatically fetched from the modem's webserver.

### Endpoints

| Method | Endpoint                | Description                   |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/health/`              | Check modem status and signal |
| POST   | `/api/sms/send/`        | Send SMS (`{ to, message }`)  |
| GET    | `/api/sms/inbox/`       | Get inbox & outbox SMS        |
| GET    | `/api/sms/inbox/:phone` | Get SMS by phone number       |
| POST   | `/api/ussd/`            | Send USSD code (`{ code }`)   |
| GET    | `/api/contacts/`        | Get SIM card contacts         |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MPL-2.0 - Rafly Maulana (rafly@tako.id)
