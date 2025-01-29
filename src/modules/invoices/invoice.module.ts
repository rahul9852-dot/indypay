import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoiceEntity } from "../../entities/invoice.entity";
import { CustomerEntity } from "../../entities/invoice-customer.entity";
import { InvoiceController } from "./invoice.controller";
import { InvoiceCustomerService } from "./invoice.service";
import { CustomerModule } from "../customers/customer.module";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { UsersEntity } from "@/entities/user.entity";
import { SESService } from "@/modules/aws/ses.service";
import { InvoiceService } from "@/shared/services/invoice.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceEntity,
      UsersEntity,
      CustomerEntity,
      UserAddressEntity,
    ]),
    CustomerModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceCustomerService, SESService, InvoiceService],
  exports: [InvoiceCustomerService],
})
export class InvoiceModule {}
