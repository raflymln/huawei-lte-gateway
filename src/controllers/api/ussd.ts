import { getAuth, parseXml } from "@/lib/utils.js";

import { Elysia } from "elysia";
import { z } from "zod";

const MODEM_URL = process.env.MODEM_URL ?? "http://192.168.8.1/api";

const UssdSchema = z.object({
    code: z.string().min(1),
});

export const UssdController = new Elysia({ prefix: "/ussd", tags: ["USSD"] }).post(
    "/",
    async ({ body }) => {
        const { code } = body as { code: string };
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
        const obj = parseXml(text);

        if (obj.error) {
            throw new Error(`Modem error: ${obj.error.code}`);
        }

        const rawResponse = obj.response ?? {};
        const content = ((rawResponse as Record<string, unknown>)?.content as string) ?? "";

        return { content };
    },
    {
        body: UssdSchema,
        response: {
            200: z.object({ content: z.string() }),
        },
        detail: {
            summary: "Send USSD code",
        },
    }
);
