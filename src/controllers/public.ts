import { getAuth, parseXml } from "@/lib/utils.js";

import { Elysia } from "elysia";

const MODEM_URL = process.env.MODEM_URL ?? "http://192.168.8.1/api";

export const PublicController = new Elysia({ prefix: "/health", tags: ["Health"] }).get("/", async () => {
    try {
        const { session, token } = await getAuth();

        const res = await fetch(`${MODEM_URL}/monitoring/status`, {
            headers: {
                Cookie: session,
                __RequestVerificationToken: token,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const text = await res.text();
        const obj = parseXml(text);

        if (obj.error) {
            throw new Error(`Modem error: ${obj.error.code}`);
        }

        if (!obj.response) {
            throw new Error("Invalid response structure");
        }

        const status = obj.response;

        return {
            status: "online",
            signal: status.signalIcon,
            network: status.currentNetworkType,
            isConnected: status.connectionStatus === "901" || status.connectionStatus === 901,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { status: "offline", error: message };
    }
});
