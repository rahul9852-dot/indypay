import { HelmetOptions } from "helmet";
import { appConfig } from "./app.config";

const { beBaseUrl } = appConfig();

export const helmetConfigs: Readonly<HelmetOptions> = {
  // API server — allow cross-origin reads for CORS-enabled endpoints.
  // Helmet 6+ defaults to `same-origin` which blocks credentialed XHR responses
  // from other origins even when `Access-Control-Allow-Origin` is set.
  crossOriginResourcePolicy: { policy: "cross-origin" },
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
