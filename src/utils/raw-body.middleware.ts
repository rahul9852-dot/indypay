import * as bodyParser from "body-parser";
import { Injectable, NestMiddleware } from "@nestjs/common";

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString(); // Save raw body as string
      },
    })(req, res, next);
  }
}
