/**
 * Huawei LTE Gateway Service
 * Handles modem communications via HTTP endpoints for Orange Pi Zero 3
 */

import { serve } from "@hono/node-server";
import { XMLParser } from "fast-xml-parser";
import { Hono } from "hono";

const app = new Hono();

const parser = new XMLParser({ ignoreAttributes: false });
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
    is_connected?: boolean;
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
    Index: number;
    Phone: string;
    Content: string;
    Date: string;
};

type SmsInboxResponse = SmsMessage[];

type UssdRequest = {
    code: string;
};

type UssdResponse = {
    content: string;
    error?: string;
};

type Contact = {
    Tel: string;
    Name: string;
};

type ContactsResponse = Contact[];

async function getAuth(): Promise<SessionToken> {
    const res = await fetch(`${MODEM_URL}/webserver/SesTokInfo`);
    const text = await res.text();
    const obj = parser.parse(text);
    return {
        session: obj.response.SesInfo,
        token: obj.response.TokInfo,
    };
}

app.get("/health", async (c) => {
    try {
        const res = await fetch(`${MODEM_URL}/monitoring/status`);
        const obj = parser.parse(await res.text());
        const status = obj.response;

        return c.json<HealthResponse>({
            status: "online",
            signal: status.SignalIcon,
            network: status.CurrentNetworkType,
            is_connected: status.ConnectionStatus === "901",
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
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
        const xml = `<request><Index>-1</Index><Phones><Phone>${to}</Phone></Phones><Content>${message}</Content><Attributes>1</Attributes><Date>-1</Date></request>`;

        const res = await fetch(`${MODEM_URL}/sms/send-sms`, {
            method: "POST",
            headers: {
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        const text = await res.text();
        const success = text.includes("OK");

        return c.json<SendSmsResponse>({ success });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return c.json<SendSmsResponse>({ success: false, error: message }, 500);
    }
});

app.get("/sms/inbox", async (c) => {
    try {
        const { session, token } = await getAuth();
        const xml = `<request><PageIndicator>1</PageIndicator><ReadCount>10</ReadCount><BoxType>1</BoxType><SortType>0</SortType><Ascending>0</Ascending><UnreadPreferred>0</UnreadPreferred></request>`;

        const res = await fetch(`${MODEM_URL}/sms/sms-list`, {
            method: "POST",
            headers: {
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        const obj = parser.parse(await res.text());
        const messages = obj.response.Messages?.Message ?? [];

        return c.json<SmsInboxResponse>(Array.isArray(messages) ? messages : [messages]);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
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
        const xml = `<request><Content>${code}</Content><Type>1</Type></request>`;

        await fetch(`${MODEM_URL}/ussd/send`, {
            method: "POST",
            headers: {
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        await new Promise((resolve) => setTimeout(resolve, 4000));

        const res = await fetch(`${MODEM_URL}/ussd/get`);
        const obj = parser.parse(await res.text());

        return c.json<UssdResponse>({ content: obj.response.Content });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return c.json<UssdResponse>({ content: "", error: message }, 500);
    }
});

app.get("/contacts", async (c) => {
    try {
        const { session, token } = await getAuth();
        const xml = `<request><PageIndex>1</PageIndex><ReadCount>50</ReadCount><SaveMode>0</SaveMode><SearchName></SearchName></request>`;

        const res = await fetch(`${MODEM_URL}/pb/pb-list`, {
            method: "POST",
            headers: {
                Cookie: session,
                __RequestVerificationToken: token,
            },
            body: xml,
        });

        const obj = parser.parse(await res.text());

        return c.json<ContactsResponse>(obj.response.Phonebook?.PbItem ?? []);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return c.json<{ error: string }>({ error: message }, 500);
    }
});

console.log(`Huawei LTE Gateway Service - Listening on port ${PORT}`);
serve({ fetch: app.fetch, port: PORT });
