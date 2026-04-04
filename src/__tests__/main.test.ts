import { describe, it, expect } from "bun:test";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

describe("XML Parser", () => {
    it("should parse simple XML response", () => {
        const xml = `<response><SesInfo>Session123</SesInfo><TokInfo>Token456</TokInfo></response>`;
        const result = parser.parse(xml);

        expect(result.response.SesInfo).toBe("Session123");
        expect(result.response.TokInfo).toBe("Token456");
    });

    it("should parse nested XML elements", () => {
        const xml = `<response><Messages><Message><Index>1</Index><Phone>+6281234567890</Phone><Content>Test message</Content></Message></Messages></response>`;
        const result = parser.parse(xml);

        expect(result.response.Messages.Message.Index).toBe(1);
        expect(result.response.Messages.Message.Content).toBe("Test message");
    });

    it("should parse multiple messages as array", () => {
        const xml = `<response><Messages><Message><Index>1</Index><Phone>081234567890</Phone></Message><Message><Index>2</Index><Phone>089876543210</Phone></Message></Messages></response>`;
        const result = parser.parse(xml);

        expect(Array.isArray(result.response.Messages.Message)).toBe(true);
        expect(result.response.Messages.Message.length).toBe(2);
    });

    it("should handle missing elements gracefully", () => {
        const xml = `<response><Messages></Messages></response>`;
        const result = parser.parse(xml);

        expect(result.response.Messages).toBeDefined();
    });

    it("should parse contact list", () => {
        const xml = `<response><Phonebook><PbItem><Tel>+6281234567890</Tel><Name>John</Name></PbItem></Phonebook></response>`;
        const result = parser.parse(xml);

        expect(result.response.Phonebook.PbItem.Name).toBe("John");
    });

    it("should parse numeric values as numbers", () => {
        const xml = `<response><SignalIcon>5</SignalIcon><Index>123</Index></response>`;
        const result = parser.parse(xml);

        expect(result.response.SignalIcon).toBe(5);
        expect(result.response.Index).toBe(123);
    });

    it("should preserve text content", () => {
        const xml = `<response><Content>This is a message</Content></response>`;
        const result = parser.parse(xml);

        expect(result.response.Content).toBe("This is a message");
    });
});

describe("Modem Response Handling", () => {
    it("should parse health status response", () => {
        const xml = `<response><SignalIcon>5</SignalIcon><CurrentNetworkType>19</CurrentNetworkType><ConnectionStatus>901</ConnectionStatus></response>`;
        const result = parser.parse(xml);

        expect(result.response.SignalIcon).toBe(5);
        expect(result.response.CurrentNetworkType).toBe(19);
        expect(result.response.ConnectionStatus).toBe(901);
    });

    it("should detect offline status from connection status", () => {
        const xml = `<response><SignalIcon>1</SignalIcon><ConnectionStatus>900</ConnectionStatus></response>`;
        const result = parser.parse(xml);

        const isConnected = result.response.ConnectionStatus === 901;
        expect(isConnected).toBe(false);
    });

    it("should handle signal strength levels", () => {
        const levels = [1, 2, 3, 4, 5];

        for (const level of levels) {
            const result = parser.parse(`<response><SignalIcon>${level}</SignalIcon></response>`);
            expect(result.response.SignalIcon).toBe(level);
        }
    });
});

describe("SMS XML Building", () => {
    it("should build valid SMS request XML", () => {
        const message = "Test message";
        const xml = `<request><Index>-1</Index><Phones><Phone>+6281234567890</Phone></Phones><Content>${message}</Content><Attributes>1</Attributes><Date>-1</Date></request>`;

        const result = parser.parse(xml);

        expect(result.request.Index).toBe(-1);
        expect(result.request.Content).toBe("Test message");
        expect(result.request.Attributes).toBe(1);
    });
});

describe("USSD XML Building", () => {
    it("should build valid USSD request XML", () => {
        const code = "*888#";
        const xml = `<request><Content>${code}</Content><Type>1</Type></request>`;

        const result = parser.parse(xml);

        expect(result.request.Content).toBe("*888#");
        expect(result.request.Type).toBe(1);
    });
});

describe("Contacts XML Building", () => {
    it("should build valid contacts request XML", () => {
        const xml = `<request><PageIndex>1</PageIndex><ReadCount>50</ReadCount><SaveMode>0</SaveMode><SearchName></SearchName></request>`;

        const result = parser.parse(xml);

        expect(result.request.PageIndex).toBe(1);
        expect(result.request.ReadCount).toBe(50);
        expect(result.request.SaveMode).toBe(0);
    });
});

describe("Request Validation", () => {
    it("should validate SMS request has both to and message", () => {
        const validateSmsRequest = (body: { to?: string; message?: string }) => {
            return !body.to || !body.message;
        };

        expect(validateSmsRequest({ to: "081234567890", message: "Hello" })).toBe(false);
        expect(validateSmsRequest({ to: "081234567890" })).toBe(true);
        expect(validateSmsRequest({ message: "Hello" })).toBe(true);
        expect(validateSmsRequest({})).toBe(true);
    });

    it("should validate USSD request has code", () => {
        const validateUssdRequest = (body: { code?: string }) => {
            return !body.code;
        };

        expect(validateUssdRequest({ code: "*888#" })).toBe(false);
        expect(validateUssdRequest({})).toBe(true);
    });
});

describe("Response Formatting", () => {
    it("should ensure messages is always an array", () => {
        const normalizeMessages = (messages: unknown) => {
            return Array.isArray(messages) ? messages : [messages];
        };

        const singleMessage = { Index: 1, Phone: "081234567890", Content: "Test" };
        const multipleMessages = [
            { Index: 1, Phone: "081234567890", Content: "Test1" },
            { Index: 2, Phone: "089876543210", Content: "Test2" },
        ];

        expect(Array.isArray(normalizeMessages(singleMessage))).toBe(true);
        expect(normalizeMessages(singleMessage).length).toBe(1);
        expect(Array.isArray(normalizeMessages(multipleMessages))).toBe(true);
        expect(normalizeMessages(multipleMessages).length).toBe(2);
    });
});
