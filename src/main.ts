/**
 * Orange Pi LTE Gateway Service
 * Handles modem communications via HTTP endpoints for Orange Pi Zero 3
 */

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { XMLParser, JSONType } from "fast-xml-parser";

const app = new Hono();
const parser = new XMLParser<{ response: any }>({ ignoreAttributes: false });
const MODEM_URL = "http://192.168.8.1/api";

// Interfaces for type safety
interface SessionToken {
  session: string;
  token: string;
}

interface HealthResponse {
  status: "online" | "offline";
  signal?: number;
  network?: number;
  is_connected?: boolean;
  error?: string;
}

interface SMSSendRequest {
  to: string;
  message: string;
}

interface USSDRequest {
  code: string;
}

// Helper: Ambil Session & Token dari Modem
async function getAuth(): Promise<SessionToken> {
  const res = await fetch(`${MODEM_URL}/webserver/SesTokInfo`);
  const text = await res.text();
  const obj = parser.parse(text);
  return {
    session: obj.response.SesInfo,
    token: obj.response.TokInfo,
  };
}

/**
 * Healthcheck: Cek status koneksi modem dan sinyal
 */
app.get("/health", async (c) => {
  try {
    const res = await fetch(`${MODEM_URL}/monitoring/status`);
    const obj = parser.parse(await res.text());
    const status = obj.response;

    // SignalIcon 5 berarti sinyal penuh
    return c.json<HealthResponse>({
      status: "online",
      signal: status.SignalIcon,
      network: status.CurrentNetworkType, // 19 = LTE
      is_connected: status.ConnectionStatus === "901",
    });
  } catch (err) {
    return c.json<HealthResponse>({ status: "offline", error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

/**
 * Send SMS
 */
app.post("/sms/send", async (c) => {
  const { to, message }: { to: string; message: string } = await c.req.json();
  const { session, token } = await getAuth();

  const xml = `<request><Index>-1</Index><Phones><Phone>${to}</Phone></Phones><Content>${message}</Content><Attributes>1</Attributes><Date>-1</Date></request>`;

  const res = await fetch(`${MODEM_URL}/sms/send-sms`, {
    method: "POST",
    headers: { Cookie: session, __RequestVerificationToken: token },
    body: xml,
  });

  const text = await res.text();
  return c.json({ success: text.includes("OK") });
});

/**
 * Read SMS: Mengambil list SMS terbaru (Inbox)
 */
app.get("/sms/inbox", async (c) => {
  const { session, token } = await getAuth();
  const xml = `<request><PageIndicator>1</PageIndicator><ReadCount>10</ReadCount><BoxType>1</BoxType><SortType>0</SortType><Ascending>0</Ascending><UnreadPreferred>0</UnreadPreferred></request>`;

  const res = await fetch(`${MODEM_URL}/sms/sms-list`, {
    method: "POST",
    headers: { Cookie: session, __RequestVerificationToken: token },
    body: xml,
  });

  const obj = parser.parse(await res.text());
  const messages = obj.response.Messages?.Message || [];
  // Pastikan selalu return array
  return c.json(Array.isArray(messages) ? messages : [messages]);
});

/**
 * Balance Check / USSD (Contoh: *888#)
 * Catatan: Response USSD di Huawei seringkali ter-encode Base64/Hex
 */
app.post("/ussd", async (c) => {
  const { code }: { code: string } = await c.req.json();
  const { session, token } = await getAuth();

  const xml = `<request><Content>${code}</Content><Type>1</Type></request>`;
  await fetch(`${MODEM_URL}/ussd/send`, {
    method: "POST",
    headers: { Cookie: session, __RequestVerificationToken: token },
    body: xml,
  });

  // Tunggu sebentar agar modem mendapat balasan dari provider
  await new Promise((r) => setTimeout(r, 4000));

  const res = await fetch(`${MODEM_URL}/ussd/get`);
  const obj = parser.parse(await res.text());
  return c.json({ content: obj.response.Content });
});

/**
 * Contacts: Mengambil kontak dari SIM Card
 */
app.get("/contacts", async (c) => {
  const { session, token } = await getAuth();
  const xml = `<request><PageIndex>1</PageIndex><ReadCount>50</ReadCount><SaveMode>0</SaveMode><SearchName></SearchName></request>`;

  const res = await fetch(`${MODEM_URL}/pb/pb-list`, {
    method: "POST",
    headers: { Cookie: session, __RequestVerificationToken: token },
    body: xml,
  });

  const obj = parser.parse(await res.text());
  return c.json(obj.response.Phonebook?.PbItem || []);
});

// Start server
console.log("Orange Pi SMS Gateway Service - Online");
serve({ fetch: app.fetch, port: 3000 });