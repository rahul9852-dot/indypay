import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import { BadRequestException, Injectable } from "@nestjs/common";

import { GenerateQRcodeDto, VerifyCodeDto } from "./mf-auth.dto";
import { UsersService } from "@/modules/users/users.service";
import { MessageResponseDto } from "@/dtos/common.dto";

const secret = "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLX";

@Injectable()
export class MfAuthService {
  private readonly issuer = "PayBolt Demo";
  private readonly numberOfBytes = 20;

  constructor(private readonly _userService: UsersService) {}

  async verifyCode({ token, secret }: VerifyCodeDto) {
    return authenticator.verify({ token, secret });
  }

  async generateQRcode({ email }: GenerateQRcodeDto) {
    // verify user
    const user = await this._userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException(new MessageResponseDto("User not found"));
    }
    // generate secret
    const secret: string = authenticator.generateSecret(this.numberOfBytes);

    // save in database
    await this._userService.update2FA({
      email,
      is2FAEnabled: true,
      secret2FA: secret,
    });

    // generate QRcode
    const qrUri: string = authenticator.keyuri(email, this.issuer, secret);
    const qrCode: string = await toDataURL(qrUri);

    return {
      qrCode,
    };
  }
  verify() {
    return "Verify";
  }

  validate() {
    return "Validate";
  }

  reset() {
    return "Reset";
  }
}
