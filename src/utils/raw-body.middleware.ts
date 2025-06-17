import * as bodyParser from "body-parser";
import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Accept ALL content types
    bodyParser.raw({
      type: () => true, // Accept any content type
      limit: "10mb",
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString(); // Always store the raw body
      },
    })(req, res, () => {
      // Try to parse as JSON if possible
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (err) {
        req.body = req.rawBody; // Fallback to raw text
      }
      next();
    });
  }
}
