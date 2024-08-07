export interface IAccessTokenPayload {
  id: string;
  email: string;
}

export type IRefreshTokenPayload = IAccessTokenPayload;
