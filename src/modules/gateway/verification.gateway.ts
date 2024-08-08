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
import { AxiosService } from "@/shared/axios/axios.service";

const { allowedOrigins, beBaseUrl } = appConfig();

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
  },
})
export class VerificationGateway implements OnModuleInit {
  logger = new CustomLogger(VerificationGateway.name);

  private axiosInstance = new AxiosService(beBaseUrl);

  // constructor(private readonly _authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on("connection", (socket) => {
      this.logger.debug(`Client connected: ${socket.id}`);
    });
  }

  @SubscribeMessage("mobileVerify")
  async handleMobileVerify(@MessageBody() body: OnboardingUsersEntity) {
    await this.axiosInstance.postRequest("/api/v1/auth/users/register", {
      businessName: body.businessName,
      designation: body.designation,
      email: body.email,
      fullName: body.fullName,
      mobile: body.mobile,
    });

    return this.server.emit("onMobileVerify", {
      mobile: body.mobile,
      isVerified: true,
    });
  }
}
