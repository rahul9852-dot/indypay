import { OnModuleInit } from "@nestjs/common";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";

import { CustomLogger } from "@/logger";
import { appConfig } from "@/config/app.config";

const { allowedOrigins } = appConfig();

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
  },
})
export class VerificationGateway implements OnModuleInit {
  logger = new CustomLogger(VerificationGateway.name);

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on("connection", (socket) => {
      this.logger.debug(`Client connected: ${socket.id}`);
    });
  }

  @SubscribeMessage("mobileVerify")
  handleMobileVerify(
    @MessageBody() body: { mobile: string; isVerified: boolean },
  ) {
    return this.server.emit("onMobileVerify", {
      mobile: body.mobile,
      isVerified: body.isVerified,
    });
  }
}
