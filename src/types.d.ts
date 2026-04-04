declare module "bun" {
    interface Env {
        PORT: string;
        MODEM_URL: string;
    }
}

interface ProcessEnv {
    PORT: string;
    MODEM_URL: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends GlobalProcessEnv {
            PORT: string;
            MODEM_URL: string;
        }
    }
}

export {};
