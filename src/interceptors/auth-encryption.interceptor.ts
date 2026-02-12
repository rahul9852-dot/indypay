import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { AuthEncryptionService } from "@/utils/auth-encryption.utils";

@Injectable()
export class AuthEncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthEncryptionInterceptor.name);
  private readonly authEncryptionService = new AuthEncryptionService();

  // Routes that should have encryption/decryption
  private readonly encryptedRoutes = [
    "/api/v1/auth/login",
    "/api/v1/auth/register-contact",
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const route = request.url;

    // Check if this route requires encryption/decryption
    const requiresEncryption = this.encryptedRoutes.some((encryptedRoute) =>
      route.includes(encryptedRoute),
    );

    if (!requiresEncryption) {
      return next.handle();
    }

    // Decrypt request body if present
    if (request.body && typeof request.body === "object") {
      try {
        // Check if body has encrypted data field
        if (request.body.encryptedData) {
          const decryptedString = this.authEncryptionService.decrypt(
            request.body.encryptedData,
          );
          const decryptedData = JSON.parse(decryptedString);
          request.body = decryptedData;
          this.logger.debug("Request body decrypted successfully");
        }
      } catch (error) {
        this.logger.error("Failed to decrypt request body:", error);
        throw new BadRequestException(
          "Invalid encrypted data format. Please ensure data is properly encrypted.",
        );
      }
    }

    // Store original json method to intercept response.json() calls
    const originalJson = response.json.bind(response);
    const {authEncryptionService} = this;
    const {logger} = this;

    // Override response.json to encrypt before sending
    response.json = function (body: any) {
      try {
        // Encrypt the response body
        const responseString = JSON.stringify(body);
        const encryptedResponse = authEncryptionService.encrypt(responseString);

        logger.debug("Response encrypted successfully");

        // Call original json with encrypted data
        return originalJson.call(this, {
          encryptedData: encryptedResponse,
        });
      } catch (error) {
        logger.error("Failed to encrypt response:", error);

        // Fallback to original response if encryption fails
        return originalJson.call(this, body);
      }
    };

    return next.handle();
  }
}
