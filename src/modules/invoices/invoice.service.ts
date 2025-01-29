import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { CustomerService } from "@/modules/customers/customer.service";
import { UsersEntity } from "@/entities/user.entity";
import { INVOICE_STATUS, USERS_ROLE } from "@/enums";
import { InvoiceEntity } from "@/entities/invoice.entity";
import { MessageResponseDto, PaginationWithDateDto } from "@/dtos/common.dto";
import { SESService } from "@/modules/aws/ses.service";
import { InvoiceService } from "@/shared/services/invoice.service";
import { todayEndDate, todayStartDate } from "@/utils/date.utils";
import { getPagination } from "@/utils/pagination.utils";

@Injectable()
export class InvoiceCustomerService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    private readonly customerService: CustomerService,
    private readonly sesService: SESService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async saveToDraftInvoice(
    createInvoiceDto: CreateInvoiceDto,
    merchant: UsersEntity,
  ) {
    const {
      description,
      termsAndServices,
      customerNotes,
      totalAmount,
      billingAddress,
      issueDate,
      expiryDate,
      customerId,
      invoiceNumber,
      id,
    } = createInvoiceDto;

    const customer = await this.customerService.findOne(customerId);

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    const existingInvoice = await this.invoiceRepo.findOne({
      where: {
        invoiceNumber,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException("Invoice number already exists");
    }

    const user = await this.userRepo.findOne({
      where: {
        id: merchant.id,
      },
      relations: {
        address: true,
      },
    });

    const shippingAddress = `${customer.addressLine1},${customer.addressLine2 ? customer.addressLine2 + " ," : ""} ${customer.city}, ${customer.state}, ${customer.pincode}, ${customer.country}`;

    const invoice = this.invoiceRepo.create({
      id,
      invoiceNumber,
      description,
      termsAndServices,
      customerNotes,
      totalAmount,
      billingAddress: billingAddress ? billingAddress : user.address[0],
      issueDate,
      expiryDate,
      customer,
      shippingAddress,
      user: merchant,
    });

    await this.invoiceRepo.save(invoice);

    return {
      message: "Invoice created successfully",
      invoiceId: invoice.id,
    };
  }

  async getInvoiceById(id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        user: true,
      },
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        totalAmount: true,
        customerNotes: true,
        termsAndServices: true,
        shippingAddress: true,
        status: true,
        issueDate: true,
        expiryDate: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          fullName: true,
        },
        customer: {
          id: true,
          name: true,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    return invoice;
  }

  async getInvoicesOfCustomer(customerId: string, user: UsersEntity) {
    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      const invoices = await this.invoiceRepo.find({
        where: { customer: { id: customerId } },
        relations: {
          customer: true,
          user: true,
        },
        select: {
          id: true,
          invoiceNumber: true,
          description: true,
          totalAmount: true,
          customerNotes: true,
          termsAndServices: true,
          shippingAddress: true,
          status: true,
          issueDate: true,
          expiryDate: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            fullName: true,
          },
          customer: {
            id: true,
            name: true,
          },
        },
      });

      return invoices;
    } else {
      const invoices = await this.invoiceRepo.find({
        where: { customer: { id: customerId }, user: { id: user.id } },
        relations: {
          customer: true,
          user: true,
        },
        select: {
          id: true,
          invoiceNumber: true,
          description: true,
          totalAmount: true,
          customerNotes: true,
          termsAndServices: true,
          shippingAddress: true,
          status: true,
          issueDate: true,
          expiryDate: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            fullName: true,
          },
          customer: {
            id: true,
            name: true,
          },
        },
      });

      return invoices;
    }
  }

  async getInvoicesOfMerchant(
    userId: string,
    {
      page = 1,
      limit = 10,
      search = "",
      sort = "id",
      order = "DESC",
      startDate = todayStartDate(),
      endDate = todayEndDate(),
    }: PaginationWithDateDto,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if ([USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role)) {
      const whereQuery:
        | FindOptionsWhere<InvoiceEntity>
        | FindOptionsWhere<InvoiceEntity>[] = {};

      // Date Filter
      if (startDate && endDate) {
        whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
      }

      const query = [whereQuery];

      if (search) {
        query.push({
          invoiceNumber: ILike(`%${search}%`),
        });
        query.push({
          customer: {
            name: ILike(`%${search}%`),
          },
        });
        query.push({
          user: {
            fullName: ILike(`%${search}%`),
          },
        });
        query.push({
          user: {
            email: ILike(`%${search}%`),
          },
        });
        query.push({
          customer: {
            contactNumber: ILike(`%${search}%`),
          },
        });
        query.push({
          user: {
            mobile: ILike(`%${search}%`),
          },
        });
      }

      const [invoices, totalItems] = await this.invoiceRepo.findAndCount({
        where: query,
        skip: (page - 1) * limit,
        take: limit,
        order: {
          [sort]: order,
        },
        relations: {
          user: true,
          customer: true,
        },
        select: {
          id: true,
          invoiceNumber: true,
          description: true,
          totalAmount: true,
          customerNotes: true,
          termsAndServices: true,
          shippingAddress: true,
          status: true,
          issueDate: true,
          expiryDate: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            fullName: true,
          },
          customer: {
            id: true,
            name: true,
          },
        },
      });

      const pagination = getPagination({ page, limit, totalItems });

      return {
        data: invoices,
        pagination,
      };
    } else {
      const whereQuery:
        | FindOptionsWhere<InvoiceEntity>
        | FindOptionsWhere<InvoiceEntity>[] = {};

      // Date Filter
      if (startDate && endDate) {
        whereQuery.createdAt = Between(new Date(startDate), new Date(endDate));
      } else if (startDate) {
        whereQuery.createdAt = MoreThanOrEqual(new Date(startDate));
      } else if (endDate) {
        whereQuery.createdAt = LessThanOrEqual(new Date(endDate));
      }

      const query = [{ ...whereQuery, user: { id: user.id } }];

      if (search) {
        query.push({
          invoiceNumber: ILike(`%${search}%`),
          user: {
            id: user.id,
          },
        });
        query.push({
          customer: {
            name: ILike(`%${search}%`),
          },
          user: {
            id: user.id,
          },
        });
      }
      const [invoices, totalItems] = await this.invoiceRepo.findAndCount({
        where: query,
        relations: {
          customer: true,
          user: true,
        },
        select: {
          id: true,
          invoiceNumber: true,
          description: true,
          totalAmount: true,
          customerNotes: true,
          termsAndServices: true,
          shippingAddress: true,
          status: true,
          issueDate: true,
          expiryDate: true,
          createdAt: true,
          updatedAt: true,
          user: {
            id: true,
            fullName: true,
          },
          customer: {
            id: true,
            name: true,
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        [sort]: order,
      });

      const pagination = getPagination({ page, limit, totalItems });

      return {
        data: invoices,
        pagination,
      };
    }
  }

  async processInvoice(
    createInvoiceDto: CreateInvoiceDto,
    merchant: UsersEntity,
  ) {
    const draftInvoice = await this.saveToDraftInvoice(
      createInvoiceDto,
      merchant,
    );

    return this.finalizeAndSendInvoiceForMerchant(
      merchant,
      draftInvoice.invoiceId,
    );
  }

  async finalizeAndSendInvoiceForMerchant(user: UsersEntity, id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    if (!invoice.billingAddress) {
      throw new NotFoundException("Billing address not found");
    }

    const invoicePdfBuffer =
      await this.invoiceService.generateInvoiceToCustomer({
        amount: invoice.totalAmount,
        userName: user.fullName,
        remarks: invoice.customerNotes,
        status: invoice.status,
        dateTime: invoice.issueDate,
        address: {
          billing: {
            name: user.fullName,
            billingAddress: invoice.billingAddress,
          },

          shipping: {
            name: invoice.customer.name,
            shippingAddress: invoice.shippingAddress,
          },
        },
        customer: {
          name: invoice.customer.name,
          email: invoice.customer.email,
        },
      });

    const invoiceSubject = `Your Invoice from ${user.fullName}`;
    const invoiceBody = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #4CAF50;">Invoice #${invoice.id}</h2>
              <p>Dear ${invoice.customer.name},</p>
              <p>You have received an invoice from <strong>${user.fullName}</strong> for a total amount of <strong>$${(+invoice.totalAmount).toFixed(
                2,
              )}</strong>.</p>
              <p>Please find your invoice attached.</p>
              <p style="margin-top: 30px;">Best regards,<br>${user.fullName} Team</p>
            </div>
          </body>
        </html>
      `;

    const emailResult = await this.sesService.sendEmail(
      invoiceSubject,
      invoiceBody,
      invoice.customer.email,
      {
        filename: `Invoice_${invoice.id}.pdf`,
        data: invoicePdfBuffer,
        contentType: "application/pdf",
      },
    );

    if (emailResult.success) {
      invoice.status = INVOICE_STATUS.SENT;
      await this.invoiceRepo.save(invoice);

      return new MessageResponseDto("Invoice sent to customer successfully.");
    } else {
      throw new Error("Failed to send invoice email to customer");
    }
  }

  async finalizeAndSendInvoiceForAdmin(
    id: string,
  ): Promise<MessageResponseDto> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ["user", "customer", "billingAddress"],
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    await this.invoiceRepo.save(invoice);

    return new MessageResponseDto("Invoice sent successfully");
  }

  async deleteInvoice(userRole: USERS_ROLE, invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    if (![USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(userRole)) {
      throw new ForbiddenException("Only Admin or Owner can delete invoices");
    }

    await this.invoiceRepo.delete(invoiceId);

    return new MessageResponseDto("Invoice deleted successfully");
  }

  async getAllInvoices(
    { name, page, limit }: { name?: string; page: number; limit: number },
    merchantId: string | null,
  ): Promise<InvoiceEntity[]> {
    const queryBuilder = this.invoiceRepo.createQueryBuilder("invoice");

    if (name) {
      queryBuilder.andWhere("invoice.customer.name LIKE :name", {
        name: `%${name}%`,
      });
    }

    if (merchantId) {
      queryBuilder.andWhere("invoice.userId = :merchantId", {
        merchantId,
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const invoices = await queryBuilder.getMany();

    return invoices;
  }
}
