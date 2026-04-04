import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
});

const MODEM_URL = process.env.MODEM_URL ?? "http://192.168.8.1/api";

export type SessionToken = {
    session: string;
    token: string;
};

export type ModemResponse = {
    response?: Record<string, unknown>;
    error?: { code: number; message?: string };
};

export async function getAuth(): Promise<SessionToken> {
    await fetch(`${MODEM_URL}/html/index.html`);

    const res = await fetch(`${MODEM_URL}/webserver/SesTokInfo`);
    const text = await res.text();
    const obj = parser.parse(text) as ModemResponse;

    if (obj.error) {
        throw new Error(`Auth failed: ${obj.error.code || "unknown"}`);
    }

    return {
        session: String(obj.response?.SesInfo ?? ""),
        token: String(obj.response?.TokInfo ?? ""),
    };
}

export function parseXml(text: string): ModemResponse {
    return parser.parse(text) as ModemResponse;
}
