import { BadRequestException, Injectable } from "@nestjs/common";
import { LoginUserDto } from "modules/users/users.dto";
import { UsersService } from "modules/users/users.service";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { MessageResponseDto } from "dtos/common.dto";
import { RegisterUserDto } from "./auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly _userService: UsersService,
    private readonly _bcryptService: BcryptService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    return this._userService.create(registerUserDto);
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this._userService.findActiveUser(loginUserDto.email);

    if (!user) {
      throw new BadRequestException(
        new MessageResponseDto("User or password is incorrect"),
      );
    }

    const isMatch = await this._bcryptService.comparePassword(
      loginUserDto.password,
      user.password,
    );

    if (!isMatch) {
      throw new BadRequestException(
        new MessageResponseDto("User or password is incorrect"),
      );
    }

    const { password: _, ...rest } = user;

    return {
      ...rest,
    };
  }
}
