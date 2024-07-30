import { HelmetOptions } from "helmet";

export const helmetConfigs: Readonly<HelmetOptions> = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
  frameguard: { action: "deny" },
  noSniff: true,
  ieNoOpen: true,
};
