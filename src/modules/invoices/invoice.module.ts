import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { InvoiceEntity } from "../../entities/invoice.entity";
import { CustomerEntity } from "../../entities/invoice-customer.entity";
import { InvoiceController } from "./invoice.controller";
import { InvoiceCustomerService } from "./invoice.service";
import { InvoiceOverdueScheduler } from "./invoice-overdue.scheduler";
import { CustomerModule } from "../customers/customer.module";
import { UserAddressEntity } from "@/entities/user-address.entity";
import { UsersEntity } from "@/entities/user.entity";
import { SESService } from "@/modules/aws/ses.service";
import { InvoiceService } from "@/shared/services/invoice.service";
import { ItemEntity } from "@/entities/item.entity";
import { InvoiceItemEntity } from "@/entities/invoice-item.entity";
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      InvoiceEntity,
      UsersEntity,
      CustomerEntity,
      UserAddressEntity,
      ItemEntity,
      InvoiceItemEntity,
      UserBusinessDetailsEntity,
    ]),
    CustomerModule,
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceCustomerService,
    InvoiceOverdueScheduler,
    SESService,
    InvoiceService,
  ],
  exports: [InvoiceCustomerService],
})
export class InvoiceModule {}
