import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Status } from "enums";
import { MessageResponseDto } from "dtos/common.dto";
import { BcryptService } from "shared/bcrypt/bcrypt.service";
import { UsersEntity } from "entities/users.entity";
import { CreateUserDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly _usersRepository: Repository<UsersEntity>,
    private readonly _bcryptService: BcryptService,
  ) {}

  async findUserByEmail(email: string): Promise<UsersEntity> {
    return this._usersRepository.findOne({ where: { email } });
  }

  async findUserById(id: number): Promise<UsersEntity> {
    return this._usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        image: true,
        contactNo: true,
        isKycVerified: true,
        isOTPVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUsers() {
    return this._usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
        image: true,
        contactNo: true,
        isKycVerified: true,
        isOTPVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(user: CreateUserDto): Promise<MessageResponseDto> {
    // Check if user already exists
    const existingUser = await this.findUserByEmail(user.email);

    if (existingUser) {
      throw new BadRequestException(
        new MessageResponseDto("User already exists"),
      );
    }

    // Hash password
    const { password, ...rest } = user;
    const hashedPassword = await this._bcryptService.hashPassword(password);

    // Create new user
    const createdUser = this._usersRepository.create({
      ...rest,
      password: hashedPassword,
    });

    // Save user
    await this._usersRepository.save(createdUser);

    return new MessageResponseDto("User created successfully");
  }

  async findActiveUser(email: string): Promise<UsersEntity> {
    return this._usersRepository.findOne({
      where: { email, status: Status.Active },
    });
  }

  async changeStatus(id: number, status: Status): Promise<MessageResponseDto> {
    // Check if user exists
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(
        new MessageResponseDto("User does not exist"),
      );
    }

    // change status of user
    const newUser = this._usersRepository.create({
      ...user,
      status,
    });

    // Save user
    await this._usersRepository.save(newUser);

    return new MessageResponseDto(
      `User ${status === Status.Active ? "activated" : "deactivated"} successfully`,
    );
  }
}
