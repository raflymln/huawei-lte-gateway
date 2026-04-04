import { getAuth, parseXml } from "@/lib/utils.js";

import { Elysia } from "elysia";

const MODEM_URL = process.env.MODEM_URL ?? "http://192.168.8.1/api";

type Contact = {
    tel: string;
    name: string;
};

export const ContactsController = new Elysia({ prefix: "/contacts", tags: ["Contacts"] }).get("/", async () => {
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

    const obj = parseXml(await res.text());

    if (obj.error) {
        throw new Error(`Modem error: ${obj.error.code}`);
    }

    const contacts = ((obj.response as Record<string, unknown>)?.Phonebook as Record<string, unknown>)?.PbItem ?? [];
    const normalized = Array.isArray(contacts) ? (contacts as Contact[]) : [contacts as Contact];

    return normalized
        .map((c) => ({
            tel: c.tel ?? "",
            name: c.name ?? "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
});
