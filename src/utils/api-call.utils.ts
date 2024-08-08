import { appConfig } from "@/config/app.config";
import { OnboardingUsersEntity } from "@/entities/onboarding-user.entity";
import { AxiosService } from "@/shared/axios/axios.service";

const { beBaseUrl } = appConfig();

export class ManageUsers {
  axiosInstance = new AxiosService(beBaseUrl);

  async registerUser(body: OnboardingUsersEntity) {
    await this.axiosInstance.postRequest("/api/v1/auth/users/register", body);
  }

  async deleteOnboardingUser(email: string) {
    await this.axiosInstance.postRequest("/api/v1/auth/users/onboarding-user", {
      email,
    });
  }
}
