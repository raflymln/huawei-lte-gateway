import { enableModemMock, disableModemMock } from "@/__tests__/mock.js";
import { app } from "@/app.js";

import { describe, expect, it, beforeEach, afterEach } from "bun:test";

describe("API Endpoints", () => {
    beforeEach(() => {
        enableModemMock();
    });

    afterEach(() => {
        disableModemMock();
    });

    describe("Health", () => {
        it("GET /health should return online status", async () => {
            const response = (await app.handle(new Request("http://localhost/health/")).then((res) => res.json())) as {
                status: string;
                isConnected: boolean;
            };

            expect(response.status).toBe("online");
            expect(response.isConnected).toBe(true);
        });

        it("GET /health should have correct status code", async () => {
            const response = await app.handle(new Request("http://localhost/health/"));

            expect(response.status).toBe(200);
        });
    });

    describe("SMS", () => {
        it("POST /api/sms/send should return success", async () => {
            const response = (await app
                .handle(
                    new Request("http://localhost/api/sms/send/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ to: "+1234567890", message: "Test message" }),
                    })
                )
                .then((res) => res.json())) as { success: boolean };

            expect(response.success).toBe(true);
        });

        it("POST /api/sms/send should validate body", async () => {
            const response = await app.handle(
                new Request("http://localhost/api/sms/send/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ to: "", message: "" }),
                })
            );

            expect(response.status).toBe(422);
        });

        it("GET /api/sms/inbox should return messages", async () => {
            const response = (await app.handle(new Request("http://localhost/api/sms/inbox/")).then((res) => res.json())) as {
                inbox: unknown[];
                outbox: unknown[];
            };

            expect(response.inbox).toBeDefined();
            expect(Array.isArray(response.inbox)).toBe(true);
            expect(response.inbox.length).toBe(2);
        });

        it("GET /api/sms/inbox should return correct status code", async () => {
            const response = await app.handle(new Request("http://localhost/api/sms/inbox/"));

            expect(response.status).toBe(200);
        });
    });

    describe("USSD", () => {
        it("POST /api/ussd should return content", async () => {
            const response = (await app
                .handle(
                    new Request("http://localhost/api/ussd/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: "*888#" }),
                    })
                )
                .then((res) => res.json())) as { content: string };

            expect(response.content).toBeDefined();
            expect(typeof response.content).toBe("string");
        });

        it("POST /api/ussd should validate body", async () => {
            const response = await app.handle(
                new Request("http://localhost/api/ussd/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: "" }),
                })
            );

            expect(response.status).toBe(422);
        });
    });

    describe("Contacts", () => {
        it("GET /api/contacts should return contacts array", async () => {
            const response = (await app.handle(new Request("http://localhost/api/contacts/")).then((res) => res.json())) as unknown[];

            expect(Array.isArray(response)).toBe(true);
            expect(response.length).toBe(3);
        });

        it("GET /api/contacts should return correct status code", async () => {
            const response = await app.handle(new Request("http://localhost/api/contacts/"));

            expect(response.status).toBe(200);
        });
    });
});
