import { APIController } from "@/controllers/api/index.js";
import { PublicController } from "@/controllers/public.js";

import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import z from "zod";

const PORT = Number(process.env.PORT) || 3000;

const info = {
    title: "Huawei LTE Gateway API",
    description: "API for interacting with Huawei LTE modems",
    version: "1.0.0",
};

export const app = new Elysia()
    .use(
        openapi({
            path: "",
            specPath: "/openapi.json",
            mapJsonSchema: {
                zod: z.toJSONSchema,
            },
            documentation: { info },
            scalar: {
                layout: "modern",
                hideDarkModeToggle: true,
                hideClientButton: false,
                showSidebar: true,
                operationTitleSource: "summary",
                theme: "bluePlanet",
                persistAuth: true,
                telemetry: true,
                isEditable: false,
                isLoading: false,
                hideModels: false,
                documentDownloadType: "both",
                hideTestRequestButton: false,
                hideSearch: false,
                withDefaultFonts: true,
                defaultOpenAllTags: false,
                expandAllModelSections: false,
                expandAllResponses: false,
                orderSchemaPropertiesBy: "alpha",
                orderRequiredPropertiesFirst: true,
                favicon: "https://api.dicebear.com/9.x/icons/svg?seed=aSDSJJn&scale=110&radius=50&backgroundColor[]",
                customCss: `
                body > div:nth-child(1) > div > div > aside > div.flex.flex-col.gap-3.p-3.border-t.border-sidebar-border.darklight-reference > div { 
                    display: none !important; 
                }
            `,
            },
        })
    )
    .use(cors())
    .use(PublicController)
    .use(APIController);

export type App = typeof app;

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Huawei LTE Gateway Service - Listening on port ${PORT}`);
    });
}
