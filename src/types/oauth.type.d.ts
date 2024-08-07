declare interface OAuthCallbackParam {
  code: string;
}

declare interface OtpLessCallbackParam extends OAuthCallbackParam {}

declare interface OtpLessTokenData {
  id_token: "jwt_token";
  access_token: "access_token";
  token_type: "Bearer";
  expires_in: 3600;
  user_id: "user123";
}

declare interface OtpLessUserData {
  name: string;
  phone_number: string;
  national_phone_number: string;
  phone_number_without_code: string;
  country_code: string;
  auth_time: string;
}

declare interface OAuthGoogleTokenData {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: string;
  exp: string;
  alg: string;
  kid: string;
  typ: string;
}

declare interface OAuthMicrosoftTokenData {
  iss: string;
  aud: string;
  exp: string;
  iat: string;
  nbf: string;
  sub: string;
  tid: string;
  name: string;
  oid: string;
  unique_name: string;
  ver: string;
}
