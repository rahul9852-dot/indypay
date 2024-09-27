// import { BadRequestException } from "@nestjs/common";
// import { appConfig } from "@/config/app.config";
// import { MessageResponseDto } from "@/dtos/common.dto";
// import { CustomLogger, LoggerPlaceHolder } from "@/logger";
// import { AxiosService } from "@/shared/axios/axios.service";
// import { OTPLESS_REDIRECT_URI } from "@/constants/callback-routes.constant";

// const {
//   otpless: { clientId, clientSecret },
// } = appConfig();

// export class NotificationService {
//   logger = new CustomLogger(NotificationService.name);

//   constructor(
//     private readonly axiosInstance = new AxiosService(
//       "https://auth.otpless.app/auth/v1",
//     ),
//   ) {}

//   async getUserWithCode(code: string): Promise<OtpLessUserData> {
//     try {
//       const res = await this.axiosInstance.postRequest<OtpLessTokenData>(
//         "token",
//         {
//           grant_type: "code",
//           code,
//           client_id: clientId,
//           client_secret: clientSecret,
//         },
//       );

//       if (!res.access_token) {
//         this.logger.error(
//           `getUserWithCode - res: ${LoggerPlaceHolder.Json}`,
//           res,
//         );
//         throw new BadRequestException(
//           new MessageResponseDto("Failed to get user"),
//         );
//       }

//       return this.axiosInstance.postRequest(
//         "userinfo",
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${res.access_token}`,
//           },
//         },
//       );
//     } catch (error: any) {
//       this.logger.error(
//         `getUserWithCode - error: ${LoggerPlaceHolder.Json}`,
//         error,
//       );
//       throw new BadRequestException(
//         new MessageResponseDto(
//           error?.response?.message ?? "Failed to get user",
//         ),
//       );
//     }
//   }

//   async sendMagicLinkOnWhatsapp(mobile: string) {
//     const res = await this.axiosInstance.getRequest("authorize", {
//       params: {
//         mobile_number: mobile,
//         redirect_uri: OTPLESS_REDIRECT_URI,
//         client_id: clientId,
//         client_secret: clientSecret,
//       },
//     });

//     this.logger.info(
//       `sendMagicLinkOnWhatsapp - res: ${LoggerPlaceHolder.Json}`,
//       res,
//     );

//     return res;
//   }
// }
