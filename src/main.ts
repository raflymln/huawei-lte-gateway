/**
 * Huawei LTE Gateway Service
 * Handles modem communications via HTTP endpoints for Orange Pi Zero 3
 */

import { serve } from "@hono/node-server";
import { XMLParser } from "fast-xml-parser";
import { Hono } from "hono";

const app = new Hono();

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
});

const MODEM_URL = process.env.MODEM_URL ?? "http://192.168.8.1/api";
const PORT = Number(process.env.PORT) || 3000;

type SessionToken = {
    session: string;
    token: string;
};

type HealthResponse = {
    status: "online" | "offline";
    signal?: number;
    network?: number;
    isConnected?: boolean;
    error?: string;
};

type SendSmsRequest = {
    to: string;
    message: string;
};

type SendSmsResponse = {
    success: boolean;
    error?: string;
};

type SmsMessage = {
    index: number;
    phone: string;
    content: string;
    date: string;
    smstat?: number;
    sca?: string;
    saveType?: number;
    priority?: number;
    smsType?: number;
};

type SmsInboxResponse = {
    inbox: SmsMessage[];
    outbox: SmsMessage[];
};

type SmsConversationResponse = {
    phone: string;
    messages: SmsMessage[];
};

type UssdRequest = {
    code: string;
};

type UssdResponse = {
    content: string;
    error?: string;
};

type Contact = {
    tel: string;
    name: string;
};

type ContactsResponse = Contact[];

async function getAuth(): Promise<SessionToken> {
    await fetch(`${MODEM_URL}/html/index.html`);

    const res = await fetch(`${MODEM_URL}/webserver/SesTokInfo`);
    const text = await res.text();
    const obj = parser.parse(text);

    if (obj.error) {
        throw new Error(`Auth failed: ${obj.error.code || "unknown"}`);
    }

    return {
        session: obj.response?.SesInfo ?? "",
        token: obj.response?.TokInfo ?? "",
    };
}

function isErrorResponse(obj: unknown): obj is { error: { code: number; message: string } } {
    return typeof obj === "object" && obj !== null && "error" in obj;
}

function toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function convertKeysToCamelCase<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map((item) => convertKeysToCamelCase<T extends unknown[] ? T[number] : never>(item as never)) as T;
    }
    if (obj !== null && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[toCamelCase(key)] = convertKeysToCamelCase(value);
        }
        return result as T;
    }
    return obj as T;
}

function sortByDate<T extends { date?: string }>(arr: T[]): T[] {
    return arr.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
    });
}

async function fetchSmsList(session: string, token: string, boxType: number): Promise<Record<string, unknown>[]> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><request><PageIndex>1</PageIndex><ReadCount>50</ReadCount><BoxType>${boxType}</BoxType><SortType>0</SortType><Ascending>0</Ascending><UnreadPreferred>0</UnreadPreferred></request>`;

    const res = await fetch(`${MODEM_URL}/sms/sms-list`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Cookie: session,
            __RequestVerificationToken: token,
        },
        body: xml,
    });

    const text = await res.text();
    const obj = parser.parse(text);

    if (isErrorResponse(obj)) {
        return [];
    }

    const messages = (((obj.response as Record<string, unknown>)?.Messages as Record<string, unknown>)?.Message ?? []) as Record<string, unknown>[];
    return Array.isArray(messages) ? messages : [messages];
}

app.get("/health", async (c) => {
    try {
        const { session, token } = await getAuth();

        const res = await fetch(`${MODEM_URL}/monitoring/status`, {
            headers: {
                Cookie: session,
                __RequestVerificationToken: token,
            },
        });

        if (!res.ok) {
            return c.json<HealthResponse>({
                status: "offline",
                error: `HTTP ${res.status}: ${res.statusText}`,
            });
        }

        const text = await res.text();
        const obj = parser.parse(text);

        if (isErrorResponse(obj)) {
            return c.json<HealthResponse>({
                status: "offline",
                error: `Modem error: ${obj.error.code}`,
            });
        }

        if (!obj.response) {
            return c.json<HealthResponse>({
                status: "offline",
                error: "Invalid response structure",
            });
        }

        const status = convertKeysToCamelCase<Record<string, unknown>>(obj.response);

        return c.json<HealthResponse>({
            status: "online",
            signal: status.signalIcon as number | undefined,
            network: status.currentNetworkType as number | undefined,
            isConnected: status.connectionStatus === "901" || status.connectionStatus === 901,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json<HealthResponse>({ status: "offline", error: message }, 500);
    }
});

app.post("/sms/send", async (c) => {
    try {
        const body = await c.req.json<SendSmsRequest>();
        const { to, message } = body;

        if (!to || !message) {
            return c.json<SendSmsResponse>({ success: false, error: "Missing 'to' or 'message' field" }, 400);
        }

        const { session, token } = await getAuth();
        const now = new Date();
        const dateStr = now.toISOString().replace("T", " ").substring(0, 19);
        const xml = `<request><Index>-1</Index><Phones><Phone>${to}</Phone></Phones><Sca></Sca><Content>${message}</Content><Length>${message.length}</Length><Reserved>1</Reserved><Date>${dateStr}</Date></request>`;

        const res = await fetch(`${MODEM_URL}/sms/send-sms`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        const text = await res.text();
        const obj = parser.parse(text);

        if (isErrorResponse(obj)) {
            return c.json<SendSmsResponse>({ success: false, error: `Modem error: ${obj.error.code}` });
        }

        const success = text.includes("<response>") && text.includes("OK");

        return c.json<SendSmsResponse>({ success });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json<SendSmsResponse>({ success: false, error: message }, 500);
    }
});

app.get("/sms/inbox", async (c) => {
    try {
        const { session, token } = await getAuth();

        const [inboxMessages, outboxMessages] = await Promise.all([fetchSmsList(session, token, 1), fetchSmsList(session, token, 2)]);

        const inbox = sortByDate(convertKeysToCamelCase<SmsMessage[]>(inboxMessages));
        const outbox = sortByDate(convertKeysToCamelCase<SmsMessage[]>(outboxMessages));

        return c.json<SmsInboxResponse>({ inbox, outbox });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json<{ error: string }>({ error: message }, 500);
    }
});

app.get("/sms/inbox/:phone", async (c) => {
    try {
        const phone = c.req.param("phone");
        const { session, token } = await getAuth();

        const [inboxMessages, outboxMessages] = await Promise.all([fetchSmsList(session, token, 1), fetchSmsList(session, token, 2)]);

        const allMessages = [...inboxMessages, ...outboxMessages];
        const searchPhone = phone.replace(/\D/g, "");
        const filtered = allMessages.filter((msg) => {
            if (!searchPhone) return false;
            const msgPhone = String(msg.Phone ?? "").replace(/\D/g, "");
            return msgPhone.length > 0 && (msgPhone.includes(searchPhone) || searchPhone.includes(msgPhone));
        });

        const messages = sortByDate(convertKeysToCamelCase<SmsMessage[]>(filtered));

        return c.json<SmsConversationResponse>({ phone, messages });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json<{ error: string }>({ error: message }, 500);
    }
});

app.post("/ussd", async (c) => {
    try {
        const body = await c.req.json<UssdRequest>();
        const { code } = body;

        if (!code) {
            return c.json<UssdResponse>({ content: "", error: "Missing 'code' field" }, 400);
        }

        const { session, token } = await getAuth();
        const xml = `<?xml version="1.0" encoding="UTF-8"?><request><content>${code}</content><codeType>CodeType</codeType><timeout></timeout></request>`;

        await fetch(`${MODEM_URL}/ussd/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        await new Promise((resolve) => setTimeout(resolve, 6000));

        const res = await fetch(`${MODEM_URL}/ussd/get`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Cookie: session,
                __RequestVerificationToken: token,
            },
        });
        const text = await res.text();
        const obj = parser.parse(text);

        if (isErrorResponse(obj)) {
            return c.json<UssdResponse>({ content: "", error: `Modem error: ${obj.error.code}` });
        }

        const rawResponse = obj.response ?? {};
        const response = convertKeysToCamelCase<Record<string, unknown>>(rawResponse as Record<string, unknown>);

        return c.json<UssdResponse>({ content: (response.content as string) ?? "" });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json<UssdResponse>({ content: "", error: message }, 500);
    }
});

app.get("/contacts", async (c) => {
    try {
        const { session, token } = await getAuth();
        const xml = `<?xml version="1.0" encoding="UTF-8"?><request><GroupID>0</GroupID><PageIndex>1</PageIndex><ReadCount>15</ReadCount><SaveType>0</SaveType><SortType>1</SortType><Ascending>1</Ascending><KeyWord></KeyWord></request>`;

        const res = await fetch(`${MODEM_URL}/pb/pb-list`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        const obj = parser.parse(await res.text());

        if (isErrorResponse(obj)) {
            return c.json<{ error: string }>({ error: `Modem error: ${obj.error.code}` }, 500);
        }

        const contacts = ((obj.response as Record<string, unknown>)?.Phonebook as Record<string, unknown>)?.PbItem ?? [];
        const normalized = Array.isArray(contacts) ? contacts : [contacts];
        const sorted = convertKeysToCamelCase<Contact[]>(normalized).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

        return c.json<ContactsResponse>(sorted);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return c.json<{ error: string }>({ error: message }, 500);
    }
});

console.log(`Huawei LTE Gateway Service - Listening on port ${PORT}`);
serve({ fetch: app.fetch, port: PORT });
