import { Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ERTITECH } from "@/constants/external-api.constant";
import { appConfig } from "@/config/app.config";
import { AxiosService } from "@/shared/axios/axios.service";
import { IExternalPayoutRequestEritechToken } from "@/interface/external-api.interface";
import { CustomLogger } from "@/logger";

const { externalPaymentConfig } = appConfig();
@Injectable()
export class ThirdPartyAuthService {
  private readonly logger = new CustomLogger(ThirdPartyAuthService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getEritechToken(): Promise<any> {
    try {
      const cachedToken = await this.cacheManager.get<string>("eritech_token");
      if (cachedToken) {
        return cachedToken;
      }
      const token = await this.authenticateWithEritech();
      await this.cacheManager.set("eritech_token", token, 3600000);

      return token;
    } catch (error) {
      this.logger.error("Failed to get Eritech token:", error);
      throw error;
    }
  }

  private async authenticateWithEritech() {
    const { email, password } = externalPaymentConfig.ertech;
    try {
      if (!email || !password) {
        throw new Error("Eritech credentials not configured");
      }

      this.logger.info(`Eritech credentials: ${email}, ${password}`);
      const axiosServiceEritech = new AxiosService(ERTITECH.BASE_URL);
      const response =
        await axiosServiceEritech.postRequest<IExternalPayoutRequestEritechToken>(
          ERTITECH.AUTH,
          {
            email,
            password,
          },
        );
      if (
        response &&
        response.success &&
        response.data &&
        response.data.token
      ) {
        return response.data.token;
      } else {
        this.logger.error("Eritech authentication failed:", response?.message);
        throw new Error("No token received from Eritech authentication");
      }
    } catch (error) {
      this.logger.error("Eritech authentication failed:", error);
      throw error;
    }
  }

  async invalidateEritechToken(): Promise<void> {
    await this.cacheManager.del("eritech_token");
  }
}
