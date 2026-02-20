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
    const route = request.url;

    // Check if this route requires decrypting the request body
    const requiresDecryption = this.encryptedRoutes.some((encryptedRoute) =>
      route.includes(encryptedRoute),
    );

    if (!requiresDecryption) {
      return next.handle();
    }

    // Decrypt request body so credentials are not sent in plain text
    if (request.body && typeof request.body === "object") {
      try {
        if (request.body.encryptedData) {
          const decryptedString = this.authEncryptionService.decrypt(
            request.body.encryptedData,
          );
          const decryptedData = JSON.parse(decryptedString);
          request.body = decryptedData;
          this.logger.debug("Request body decrypted successfully");
        }
        // If no encryptedData, body stays as-is (e.g. for non-encrypted clients during dev)
      } catch (error) {
        this.logger.error("Failed to decrypt request body:", error);
        throw new BadRequestException(
          "Invalid encrypted data format. Please ensure login data is encrypted before sending.",
        );
      }
    }

    // Response is left as plain JSON - no response encryption
    return next.handle();
  }
}
