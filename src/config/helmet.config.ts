import { HelmetOptions } from "helmet";
import { appConfig } from "./app.config";

const { beBaseUrl } = appConfig();

export const helmetConfigs: Readonly<HelmetOptions> = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      "img-src": ["'self'", "https:", "data:"],
      "connect-src": ["'self'", beBaseUrl],
      "form-action": [
        "'self'",
        "https://securepay.sabpaisa.in",
        "https://secure-axispg.freecharge.in",
      ],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
  frameguard: { action: "deny" },
  noSniff: true,
  ieNoOpen: true,
};
