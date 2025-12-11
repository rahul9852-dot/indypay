import { Request, Response, NextFunction } from "express";
import { CustomLogger } from "@/logger";

const logger = new CustomLogger();

export const webhookBodyParserUtkarsh = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let data = "";
  req.setEncoding("utf8");

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", () => {
    // Add raw body to request
    (req as any).rawBody = data;

    try {
      req.body = JSON.parse(data);
      // req.body = Object.fromEntries(new URLSearchParams(data));
      logger.info("Webhook body parsed successfully");
    } catch (e) {
      logger.error(
        "Failed to parse webhook JSON:",
        e instanceof Error ? e.message : "Unknown error",
      );
      req.body = {};
    }
    next();
  });

  // req.on("end", () => {
  //   (req as any).rawBody = data;

  //   try {
  //     const body = data;

  //     // Find JSON between multipart boundaries:
  //     const match = body.match(/\r\n\r\n([\s\S]*?)\r\n-+/);

  //     if (match && match[1]) {
  //       req.body = JSON.parse(match[1]);
  //     } else {
  //       req.body = {};
  //     }

  //     logger.info("Webhook body parsed successfully");
  //   } catch (e) {
  //     logger.error(
  //       "Failed to parse webhook JSON:",
  //       e instanceof Error ? e.message : "Unknown error",
  //     );
  //     req.body = {};
  //   }

  //   next();
  // });
};

export const WEBHOOK_ROUTES_UTK = ["/api/v1/payments/v2/payin/webhook"];

export const webhookBodyParserJio = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let data = "";
  req.setEncoding("utf8");

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", () => {
    (req as any).rawBody = data;

    try {
      const body = data;

      // Find JSON between multipart boundaries:
      const match = body.match(/\r\n\r\n([\s\S]*?)\r\n-+/);

      if (match && match[1]) {
        req.body = JSON.parse(match[1]);
      } else {
        req.body = {};
      }

      logger.info("Webhook body parsed successfully");
    } catch (e) {
      logger.error(
        "Failed to parse webhook JSON:",
        e instanceof Error ? e.message : "Unknown error",
      );
      req.body = {};
    }

    next();
  });
};

export const WEBHOOK_ROUTES_JIO = ["/api/v1/payments/payin/webhook"];
