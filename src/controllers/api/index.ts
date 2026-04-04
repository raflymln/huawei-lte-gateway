import { ContactsController } from "@/controllers/api/contacts.js";
import { SMSController } from "@/controllers/api/sms.js";
import { UssdController } from "@/controllers/api/ussd.js";

import { Elysia } from "elysia";

export const APIController = new Elysia({ prefix: "/api/v1", tags: ["API"] }).use(SMSController).use(UssdController).use(ContactsController);
