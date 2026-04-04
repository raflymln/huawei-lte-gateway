import { getAuth, parseXml } from "@/lib/utils.js";

import { Elysia } from "elysia";
import { z } from "zod";

const MODEM_URL = process.env.MODEM_URL ?? "http://192.168.8.1/api";

const SendSmsSchema = z.object({
    to: z.string().min(1),
    message: z.string().min(1),
});

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

function sortByDate(arr: SmsMessage[]): SmsMessage[] {
    return arr.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date.localeCompare(b.date);
    });
}

export const SMSController = new Elysia({ prefix: "/sms", tags: ["SMS"] })
    .post(
        "/send",
        async ({ body }) => {
            const { to, message } = body as { to: string; message: string };
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
            const obj = parseXml(text);

            if (obj.error) {
                throw new Error(`Modem error: ${obj.error.code}`);
            }

            const success = text.includes("<response>") && text.includes("OK");
            return { success };
        },
        {
            body: SendSmsSchema,
            response: {
                200: z.object({ success: z.boolean() }),
            },
            detail: {
                summary: "Send SMS message",
            },
        }
    )
    .get("/inbox", async () => {
        const { session, token } = await getAuth();

        async function fetchSmsList(boxType: number) {
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
            const obj = parseXml(text);

            if (obj.error) {
                return [];
            }

            const messages = (((obj.response as Record<string, unknown>)?.Messages as Record<string, unknown>)?.Message ?? []) as Record<string, unknown>[];
            return Array.isArray(messages) ? messages : [messages];
        }

        const [inboxMessages, outboxMessages] = await Promise.all([fetchSmsList(1), fetchSmsList(2)]);

        const normalize = (msg: Record<string, unknown>): SmsMessage => ({
            index: typeof msg.Index === "string" ? parseInt(msg.Index, 10) : Number(msg.Index) || 0,
            phone: String(msg.Phone ?? ""),
            content: String(msg.Content ?? ""),
            date: String(msg.Date ?? ""),
            smstat: Number(msg.smstat),
            sca: String(msg.sca ?? ""),
            saveType: Number(msg.saveType),
            priority: Number(msg.priority),
            smsType: Number(msg.smsType),
        });

        const inbox = sortByDate(inboxMessages.map(normalize));
        const outbox = sortByDate(outboxMessages.map(normalize));

        return { inbox, outbox };
    })
    .get("/inbox/:phone", async ({ params }) => {
        const { phone } = params as { phone: string };
        const { session, token } = await getAuth();

        async function fetchSmsList(boxType: number) {
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
            const obj = parseXml(text);

            if (obj.error) {
                return [];
            }

            const messages = (((obj.response as Record<string, unknown>)?.Messages as Record<string, unknown>)?.Message ?? []) as Record<string, unknown>[];
            return Array.isArray(messages) ? messages : [messages];
        }

        const [inboxMessages, outboxMessages] = await Promise.all([fetchSmsList(1), fetchSmsList(2)]);

        const allMessages = [...inboxMessages, ...outboxMessages];
        const searchPhone = phone.replace(/\D/g, "");
        const filtered = allMessages.filter((msg) => {
            if (!searchPhone) return false;
            const msgPhone = String(msg.Phone ?? "").replace(/\D/g, "");
            return msgPhone.length > 0 && (msgPhone.includes(searchPhone) || searchPhone.includes(msgPhone));
        });

        const normalize = (msg: Record<string, unknown>): SmsMessage => ({
            index: typeof msg.Index === "string" ? parseInt(msg.Index, 10) : Number(msg.Index) || 0,
            phone: String(msg.Phone ?? ""),
            content: String(msg.Content ?? ""),
            date: String(msg.Date ?? ""),
            smstat: Number(msg.smstat),
            sca: String(msg.sca ?? ""),
            saveType: Number(msg.saveType),
            priority: Number(msg.priority),
            smsType: Number(msg.smsType),
        });

        const messages = sortByDate(filtered.map(normalize));

        return { phone, messages };
    });
