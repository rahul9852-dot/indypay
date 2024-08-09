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
import { OnboardingUsersEntity } from "@/entities/onboarding-user.entity";

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
  async handleMobileVerify(@MessageBody() body: OnboardingUsersEntity) {
    return this.server.emit("onMobileVerify", {
      mobile: body.mobile,
      isVerified: true,
    });
  }
}
