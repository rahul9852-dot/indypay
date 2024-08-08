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
import { ManageUsers } from "@/utils/api-call.utils";

const { allowedOrigins } = appConfig();

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
  },
})
export class VerificationGateway implements OnModuleInit {
  logger = new CustomLogger(VerificationGateway.name);

  private manageUsers = new ManageUsers();

  // constructor(private readonly _authService: AuthService) {} // TODO

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on("connection", (socket) => {
      this.logger.debug(`Client connected: ${socket.id}`);
    });
  }

  @SubscribeMessage("mobileVerify")
  async handleMobileVerify(@MessageBody() body: OnboardingUsersEntity) {
    await this.manageUsers.registerUser(body);
    await this.manageUsers.deleteOnboardingUser(body.email);

    return this.server.emit("onMobileVerify", {
      mobile: body.mobile,
      isVerified: true,
    });
  }
}
