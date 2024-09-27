// import { appConfig } from "@/config/app.config";
// import { OAUTH_GOOGLE_REDIRECT_URL } from "@/constants/callback-routes.constant";
// import { AxiosService } from "@/shared/axios/axios.service";

// const {
//   oauthGoogle: { clientId: clientIdGoogle, clientSecret: clientSecretGoogle },
// } = appConfig();

// export const getGoogleOAuthUrl = () => {
//   const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
//   const options = {
//     redirect_uri: OAUTH_GOOGLE_REDIRECT_URL,
//     client_id: clientIdGoogle,
//     access_type: "offline",
//     response_type: "code",
//     prompt: "consent",
//     scope: [
//       "https://www.googleapis.com/auth/userinfo.email",
//       "https://www.googleapis.com/auth/userinfo.profile",
//       "openid",
//     ].join(" "),
//   };
//   const qs = new URLSearchParams(options).toString();

//   return `${rootUrl}?${qs}`;
// };

interface GoogleTokensResult {
  access_token: string;
  expires_in: Number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

// export const getGoogleOAuthTokens = async ({
//   code,
// }: {
//   code: string;
// }): Promise<GoogleTokensResult> => {
//   const axiosInstance = new AxiosService("https://oauth2.googleapis.com/token");

//   const options = {
//     code,
//     client_id: clientIdGoogle,
//     client_secret: clientSecretGoogle,
//     redirect_uri: OAUTH_GOOGLE_REDIRECT_URL,
//     grant_type: "authorization_code",
//   };

//   const qs = new URLSearchParams(options).toString();

//   try {
//     const res = await axiosInstance.postRequest<GoogleTokensResult>("", qs, {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     });

//     return res;
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// };

// export const getMicrosoftOAuthUrl = () => {
//   const rootUrl =
//     "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
//   const options = {
//     redirect_uri: redirectUrlMicrosoft,
//     client_id: clientIdMicrosoft,
//     access_type: "offline",
//     response_type: "code",
//     prompt: "consent",
//     scope: [
//       "https://graph.microsoft.com/User.Read",
//       "https://graph.microsoft.com/User.ReadWrite",
//       "https://graph.microsoft.com/User.ReadBasic.All",
//     ].join(" "),
//   };
//   const qs = new URLSearchParams(options).toString();

//   return `${rootUrl}?${qs}`;
// };
