import { Request, Response, NextFunction } from "express";
import { CustomLogger } from "@/logger";

const logger = new CustomLogger();

export const webhookBodyParser = (
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
      // req.body = JSON.parse(data);
      req.body = Object.fromEntries(new URLSearchParams(data));
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

export const WEBHOOK_ROUTES = ["/api/v1/payments/payin/webhook"];
