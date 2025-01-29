import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerService } from "./customer.service";
import { CustomerController } from "./customer.controller";
import { CustomerEntity } from "@/entities/invoice-customer.entity";
import { UsersEntity } from "@/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, UsersEntity])],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
