# Huawei LTE Gateway Service

This project implements a service gateway for interacting with a Huawei LTE Modem's web API endpoints. It utilizes Hono for fast routing and communication handling.

## Features

- Healthcheck endpoint (`/health`): Checks modem connection status and signal strength.
- SMS Sending (`/sms/send`): Sends SMS messages by authenticating with the modem API.
- SMS Inbox Retrieval (`/sms/inbox`): Fetches the latest received SMS messages.
- USSD/Balance Check (`/ussd`): Sends USSD codes and retrieves the response.
- Contact Retrieval (`/contacts`): Fetches contacts stored on the SIM card.

## Setup and Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run Locally:**
    ```bash
    npm run dev
    ```
    The service will start on `http://localhost:3000`.

## API Details

All endpoints communicate with the modem at the following base URL: `http://192.168.8.1/api`.

**Note on Authentication:**
The service relies on fetching session tokens and verification tokens from the modem's webserver endpoint, which must be accessible from the gateway host.

## Development Workflow

This repository enforces standard development best practices:

- **Linting:** ESLint will check code quality.
- **Pre-commit Hooks:** Git hooks managed by `lefthook` and `commitlint` ensure every commit message follows the Conventional Commits standard.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
