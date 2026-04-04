// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalFetch = (globalThis as any).fetch;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalSetTimeout = (globalThis as any).setTimeout;

const mockResponses: Record<string, string> = {
    "/webserver/SesTokInfo": `<response><SesInfo>mock-session-id</SesInfo><TokInfo>mock-token-value</TokInfo></response>`,
    "/monitoring/status": `<response><SignalIcon>5</SignalIcon><CurrentNetworkType>19</CurrentNetworkType><connectionStatus>901</connectionStatus></response>`,
    "/sms/send-sms": `<response>OK</response>`,
    "/ussd/send": `<response>OK</response>`,
    "/ussd/get": `<response><content>1.Promo Favorit\n2.Spesial Buat U</content></response>`,
};

function getMockSmsList(boxType: number): string {
    if (boxType === 1) {
        return `<?xml version="1.0" encoding="UTF-8"?><response><Messages><Message><Index>40000</Index><Phone>+1234567890</Phone><Content>Hello from friend</Content><Date>2024-01-01 12:00:00</Date></Message><Message><Index>40001</Index><Phone>+0987654321</Phone><Content>Meeting at 3pm</Content><Date>2024-01-02 14:30:00</Date></Message></Messages></response>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?><response><Messages><Message><Index>50000</Index><Phone>+1111111111</Phone><Content>Sent message</Content><Date>2024-01-03 10:00:00</Date></Message></Messages></response>`;
}

function getMockContacts(): string {
    return `<?xml version="1.0" encoding="UTF-8"?><response><Phonebook><PbItem><Tel>+1234567890</Tel><Name>Alice</Name></PbItem><PbItem><Tel>+0987654321</Tel><Name>Charlie</Name></PbItem><PbItem><Tel>+1111111111</Tel><Name>Bob</Name></PbItem></Phonebook></response>`;
}

function createMockResponse(url: string, init?: RequestInit): Response {
    if (url.includes("/html/index.html") || url.includes("/webserver/SesTokInfo")) {
        return new Response(mockResponses["/webserver/SesTokInfo"], {
            headers: { "Content-Type": "text/xml" },
        });
    }

    if (url.includes("/monitoring/status")) {
        return new Response(mockResponses["/monitoring/status"], {
            headers: { "Content-Type": "text/xml" },
        });
    }

    if (url.includes("/sms/send-sms")) {
        return new Response(mockResponses["/sms/send-sms"], {
            headers: { "Content-Type": "text/xml" },
        });
    }

    if (url.includes("/sms/sms-list")) {
        const body = init?.body as string | undefined;
        const boxTypeMatch = body?.match(/<BoxType>(\d+)<\/BoxType>/);
        const boxType = boxTypeMatch ? parseInt(boxTypeMatch[1] ?? "1", 10) : 1;
        return new Response(getMockSmsList(boxType), {
            headers: { "Content-Type": "text/xml" },
        });
    }

    if (url.includes("/ussd/send")) {
        return new Response(mockResponses["/ussd/send"], {
            headers: { "Content-Type": "text/xml" },
        });
    }

    if (url.includes("/ussd/get")) {
        return new Response(mockResponses["/ussd/get"], {
            headers: { "Content-Type": "text/xml" },
        });
    }

    if (url.includes("/pb/pb-list")) {
        return new Response(getMockContacts(), {
            headers: { "Content-Type": "text/xml" },
        });
    }

    return new Response("Not Found", { status: 404 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mockFetch(input: any, init?: any): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return createMockResponse(url, init);
}

// Add all fetch-related methods
mockFetch.preconnect = async () => null;
mockFetch.dns = async () => null;

export function enableModemMock() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = mockFetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).setTimeout = (callback: () => void) => {
        callback();
        return 0;
    };
}

export function disableModemMock() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = originalFetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).setTimeout = originalSetTimeout;
}
