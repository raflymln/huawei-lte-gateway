import { parseXml } from "@/lib/utils.js";

import { describe, expect, it } from "bun:test";

describe("Utils", () => {
    describe("parseXml", () => {
        it("should parse auth response", () => {
            const xml = `<response><SesInfo>Session123</SesInfo><TokInfo>Token456</TokInfo></response>`;
            const result = parseXml(xml);

            expect(result.response).toBeDefined();
            expect(result.response?.SesInfo).toBe("Session123");
            expect(result.response?.TokInfo).toBe("Token456");
        });

        it("should parse error response", () => {
            const xml = `<error><code>125003</code><message>Action Failed</message></error>`;
            const result = parseXml(xml);

            expect(result.error).toBeDefined();
            expect(result.error?.code).toBe(125003);
        });

        it("should parse SMS inbox response", () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?><response><Messages><Message><Index>1</Index><Phone>+6281234567890</Phone><Content>Test</Content><Date>2024-01-01 12:00:00</Date></Message></Messages></response>`;
            const result = parseXml(xml);

            expect((result.response as Record<string, unknown>)?.Messages).toBeDefined();
        });

        it("should parse contacts response", () => {
            const xml = `<?xml version="1.0" encoding="UTF-8"?><response><Phonebook><PbItem><Tel>+6281234567890</Tel><Name>John</Name></PbItem></Phonebook></response>`;
            const result = parseXml(xml);

            expect((result.response as Record<string, unknown>)?.Phonebook).toBeDefined();
        });

        it("should parse health status response", () => {
            const xml = `<response><SignalIcon>5</SignalIcon><CurrentNetworkType>19</CurrentNetworkType><ConnectionStatus>901</ConnectionStatus></response>`;
            const result = parseXml(xml);

            expect((result.response as Record<string, unknown>)?.SignalIcon).toBe(5);
            expect((result.response as Record<string, unknown>)?.CurrentNetworkType).toBe(19);
            expect((result.response as Record<string, unknown>)?.ConnectionStatus).toBe(901);
        });
    });

    describe("SMS normalization", () => {
        it("should normalize SMS message fields", () => {
            const raw = {
                Index: "123",
                Phone: "+6281234567890",
                Content: "Test message",
                Date: "2024-01-01 12:00:00",
                smstat: 1,
            };

            const normalized = {
                index: typeof raw.Index === "string" ? parseInt(raw.Index, 10) : Number(raw.Index) || 0,
                phone: String(raw.Phone ?? ""),
                content: String(raw.Content ?? ""),
                date: String(raw.Date ?? ""),
                smstat: Number(raw.smstat),
                sca: String(""),
                saveType: Number(undefined),
                priority: Number(undefined),
                smsType: Number(undefined),
            };

            expect(normalized.index).toBe(123);
            expect(normalized.phone).toBe("+6281234567890");
            expect(normalized.content).toBe("Test message");
            expect(normalized.smstat).toBe(1);
        });

        it("should handle numeric Index values", () => {
            const raw = { Index: 456 };

            const index = typeof raw.Index === "string" ? parseInt(raw.Index, 10) : Number(raw.Index) || 0;

            expect(index).toBe(456);
        });
    });

    describe("Contacts normalization", () => {
        it("should normalize contact fields", () => {
            const raw = { Tel: "+6281234567890", Name: "John Doe" };

            const normalized = {
                tel: String(raw.Tel ?? ""),
                name: String(raw.Name ?? ""),
            };

            expect(normalized.tel).toBe("+6281234567890");
            expect(normalized.name).toBe("John Doe");
        });

        it("should sort contacts by name", () => {
            const contacts = [
                { tel: "111", name: "Charlie" },
                { tel: "222", name: "Alice" },
                { tel: "333", name: "Bob" },
            ];

            const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));

            expect(sorted[0]?.name).toBe("Alice");
            expect(sorted[1]?.name).toBe("Bob");
            expect(sorted[2]?.name).toBe("Charlie");
        });
    });

    describe("SMS date sorting", () => {
        it("should sort messages by date ascending", () => {
            const messages = [{ date: "2024-01-03 12:00:00" }, { date: "2024-01-01 12:00:00" }, { date: "2024-01-02 12:00:00" }];

            const sorted = messages.sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date.localeCompare(b.date);
            });

            expect(sorted[0]?.date).toBe("2024-01-01 12:00:00");
            expect(sorted[1]?.date).toBe("2024-01-02 12:00:00");
            expect(sorted[2]?.date).toBe("2024-01-03 12:00:00");
        });

        it("should handle missing dates", () => {
            const messages = [{ date: "2024-01-01 12:00:00" }, { date: "" }, { date: "2024-01-02 12:00:00" }];

            const sorted = messages.sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date.localeCompare(b.date);
            });

            expect(sorted[0]?.date).toBe("2024-01-01 12:00:00");
            expect(sorted[1]?.date).toBe("2024-01-02 12:00:00");
            expect(sorted[2]?.date).toBe("");
        });
    });

    describe("Phone number filtering", () => {
        it("should filter messages by phone number", () => {
            const messages = [{ Phone: "+6281234567890" }, { Phone: "+6289876543210" }, { Phone: "+6281230000000" }];

            const searchPhone = "8123";
            const filtered = messages.filter((msg) => {
                if (!searchPhone) return false;
                const msgPhone = String(msg.Phone ?? "").replace(/\D/g, "");
                return msgPhone.length > 0 && (msgPhone.includes(searchPhone) || searchPhone.includes(msgPhone));
            });

            expect(filtered.length).toBe(2);
            expect(filtered[0]?.Phone).toBe("+6281234567890");
            expect(filtered[1]?.Phone).toBe("+6281230000000");
        });
    });

    describe("Array normalization", () => {
        it("should wrap single item in array", () => {
            const single = { Name: "Test" };
            const wrapped = Array.isArray(single) ? single : [single];

            expect(Array.isArray(wrapped)).toBe(true);
            expect(wrapped.length).toBe(1);
        });

        it("should keep array as array", () => {
            const multiple = [{ Name: "Test1" }, { Name: "Test2" }];
            const wrapped = Array.isArray(multiple) ? multiple : [multiple];

            expect(wrapped.length).toBe(2);
        });
    });
});
