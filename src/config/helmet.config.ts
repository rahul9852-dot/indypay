import { HelmetOptions } from "helmet";
import { appConfig } from "./app.config";

const { beBaseUrl } = appConfig();

export const helmetConfigs: Readonly<HelmetOptions> = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://secure-axispg.freecharge.in",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://secure-axispg.freecharge.in",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      "img-src": ["'self'", "https:", "data:"],
      "connect-src": ["'self'", beBaseUrl],
      "form-action": [
        "'self'",
        "https://securepay.sabpaisa.in",
        "https://secure-axispg.freecharge.in",
        "https://gopaydigital.in",
      ],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
  frameguard: { action: "deny" },
  noSniff: true,
  ieNoOpen: true,
};
