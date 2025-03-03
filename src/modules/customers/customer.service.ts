import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CustomerEntity } from "@/entities/invoice-customer.entity";
import { UsersEntity } from "@/entities/user.entity";
import { MessageResponseDto } from "@/dtos/common.dto";

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
  ) {}

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
    merchant: UsersEntity,
  ) {
    const existingCustomer = await this.customerRepo.findOne({
      where: [
        {
          email: createCustomerDto.email,
        },
        {
          contactNumber: createCustomerDto.contactNumber,
        },
      ],
    });

    if (existingCustomer) {
      throw new ConflictException("Customer already exists.");
    }

    const customer = this.customerRepo.create({
      ...createCustomerDto,
      merchantId: merchant.id,
      merchant,
    });

    await this.customerRepo.save(customer);

    return new MessageResponseDto("Customer created successfully");
  }

  async getListOfCustomersForMerchant(merchantId: string, search?: string) {
    return this.customerRepo.find({
      where: {
        merchantId,
        ...(search && { name: ILike(`%${search}%`) }),
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async findOne(id: string) {
    return this.customerRepo.findOne({ where: { id } });
  }

  async getCustomerById(id: string) {
    return this.customerRepo.findOne({
      where: { id },
      relations: {
        merchant: true,
      },
      select: {
        id: true,
        name: true,
        merchantId: true,
        email: true,
        contactNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        country: true,
        gstin: true,
        createdAt: true,
        updatedAt: true,
        merchant: {
          id: true,
          fullName: true,
        },
      },
    });
  }
}
