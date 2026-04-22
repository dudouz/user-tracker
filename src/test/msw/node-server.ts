import { setupServer } from "msw/node";

import { authApiHandlers } from "./auth-api-handlers";

export const mswNodeServer = setupServer(...authApiHandlers);
