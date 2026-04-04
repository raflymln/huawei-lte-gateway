import { APIController } from "@/controllers/api/index.js";
import { PublicController } from "@/controllers/public.js";

import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

const PORT = Number(process.env.PORT) || 3000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app = new Elysia()
    .use(cors())
    .use(
        openapi({
            documentation: {
                info: {
                    title: "Huawei LTE Gateway API",
                    version: "1.0.0",
                    description: "API for interacting with Huawei LTE modems",
                },
            },
        })
    )
    .use(PublicController)
    .use(APIController)
    .listen(PORT, () => {
        console.log(`Huawei LTE Gateway Service - Listening on port ${PORT}`);
    });

export type App = typeof app;
