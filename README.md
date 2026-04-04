# Huawei LTE Gateway Service

Service gateway for interacting with Huawei LTE Modem web API endpoints. Built with Hono for fast routing and communication handling.

> **Note**: Tested on Huawei E3372H-607. Other models may work but are not guaranteed.

## Features

- **Healthcheck** (`/health`): Checks modem connection status and signal strength
- **SMS Sending** (`/sms/send`): Sends SMS messages via modem API
- **SMS Inbox** (`/sms/inbox`): Fetches latest received SMS messages
- **USSD/Balance Check** (`/ussd`): Sends USSD codes and retrieves responses
- **Contacts** (`/contacts`): Fetches contacts stored on the SIM card

## Quick Deploy

```bash
curl -fsSL https://raw.githubusercontent.com/raflymln/huawei-lte-gateway/main/install.sh | bash
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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MPL-2.0 - Rafly Maulana (rafly@tako.id)
