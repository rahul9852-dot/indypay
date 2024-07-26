import { Injectable } from "@nestjs/common";
import { CustomLogger } from "logger";

@Injectable()
export class AuthService {
  private logger = new CustomLogger(AuthService.name);

  constructor() {}

  async signUp() {
    return {
      message: "Sign up",
    };
  }
}
