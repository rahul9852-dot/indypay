import {
  BadRequestException,
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
import { MessageResponseDto, PaginationInvoiceDto } from "@/dtos/common.dto";
import { SESService } from "@/modules/aws/ses.service";
import { InvoiceService } from "@/shared/services/invoice.service";
import { getPagination } from "@/utils/pagination.utils";
import { ItemEntity } from "@/entities/item.entity";
import { InvoiceItemEntity } from "@/entities/invoice-item.entity";
import {
  getInvoiceStatusForQuery,
  getInvoiceStatus,
} from "@/utils/helperFunctions.utils";

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
    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
    @InjectRepository(InvoiceItemEntity)
    private readonly invoiceItemRepo: Repository<InvoiceItemEntity>,
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
      items,
    } = createInvoiceDto;

    const customer = await this.customerService.findOne(customerId);

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    const existingInvoice = await this.invoiceRepo.findOne({
      where: {
        invoiceNumber,
        id,
      },
    });

    if (existingInvoice && existingInvoice.status === INVOICE_STATUS.SENT) {
      throw new BadRequestException("Invoice already sent");
    }

    const invoiceItems = items
      ? await Promise.all(
          items.map(async (singleItem) => {
            const item = await this.itemRepo.findOne({
              where: { id: singleItem.id },
            });
            if (!item) {
              throw new NotFoundException(
                `Item with ID ${singleItem.id} not found`,
              );
            }

            const invoiceItem = this.invoiceItemRepo.create({
              item: singleItem,
              quantity: singleItem.quantity,
            });

            return invoiceItem;
          }),
        )
      : undefined;

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
      ...(items && items.length > 0 && { items: invoiceItems }),
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
        items: {
          item: true,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        totalAmount: true,
        customerNotes: true,
        termsAndServices: true,
        shippingAddress: true,
        billingAddress: true,
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
          gstin: true,
        },
        items: {
          id: true,
          item: {
            id: true,
            price: true,
            name: true,
            hsnCode: true,
          },
          quantity: true,
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
      startDate,
      endDate,
      status,
    }: PaginationInvoiceDto,
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
            contactNumber: true,
            email: true,
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

      const query = [whereQuery];

      const internalStatus = status
        ? getInvoiceStatusForQuery(status)
        : undefined;

      if (search) {
        query.push({
          invoiceNumber: ILike(`%${search}%`),
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        });
        query.push({
          customer: {
            name: ILike(`%${search}%`),
          },
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        });
        query.push({
          customer: {
            contactNumber: ILike(`%${search}%`),
          },
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        });
        query.push({
          customer: {
            email: ILike(`%${search}%`),
          },
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        });
        query.push({
          id: ILike(`%${search}%`),
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
        });
      } else {
        query.push({
          user: {
            id: user.id,
          },
          ...(internalStatus && { status: internalStatus }),
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
            contactNumber: true,
            email: true,
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

  async checkInvoiceValidation(createInvoiceDto: CreateInvoiceDto) {
    const { customerId, items, invoiceNumber } = createInvoiceDto;

    if (!customerId) {
      throw new BadRequestException("Customer is required");
    }

    const customer = await this.customerService.findOne(customerId);

    if (!customer) {
      throw new NotFoundException("Customer not found");
    }

    if (!invoiceNumber) {
      throw new BadRequestException("Invoice number is required");
    }

    if (items.length === 0) {
      throw new BadRequestException("Items cannot be empty");
    }

    if (items.some((item) => item.quantity <= 0)) {
      throw new BadRequestException("Quantity must be greater than 0");
    }

    return true;
  }

  async processInvoice(
    createInvoiceDto: CreateInvoiceDto,
    merchant: UsersEntity,
  ) {
    const draftInvoice = await this.saveToDraftInvoice(
      createInvoiceDto,
      merchant,
    );

    const isValid = await this.checkInvoiceValidation(createInvoiceDto);

    if (!isValid) {
      throw new BadRequestException("Invalid invoice");
    }

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
        user: true,
        items: {
          item: true,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found");
    }

    if (!invoice.billingAddress) {
      throw new NotFoundException("Billing address not found");
    }

    // Determine if inter-state or intra-state GST applies
    // Rupeeflow is based in Karnataka - if customer is in different state, apply IGST
    const sellerState = "Karnataka";
    const customerState = invoice.customer.state?.trim().toLowerCase();
    const isInterState = customerState !== sellerState.toLowerCase();

    const invoicePdfBuffer =
      await this.invoiceService.generateInvoiceToCustomer({
        amount: invoice.totalAmount,
        subTotal: invoice.items.reduce(
          (acc, item) => acc + item.item.price * item.quantity,
          0,
        ),
        gst: 18,
        isInterState,
        invoiceNumber: invoice.invoiceNumber,
        userName: user.fullName,
        customerNotes: invoice.customerNotes,
        termsAndServices: invoice.termsAndServices,
        status: getInvoiceStatus(invoice.status),
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
          gstin: invoice.customer.gstin,
          state: invoice.customer.state,
        },
        items: invoice.items,
      });

    const invoiceSubject = `Invoice ${invoice.invoiceNumber} from Rupeeflow`;
    const invoiceBody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">RUPEEFLOW</h1>
                <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Invoice Notification</p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 20px; color: #1F2937; font-size: 16px;">Dear <strong>${invoice.customer.name}</strong>,</p>

                <p style="margin: 0 0 20px; color: #4B5563; font-size: 15px; line-height: 1.7;">
                  I hope this message finds you well. Please find attached <strong style="color: #10B981;">Invoice ${invoice.invoiceNumber}</strong> dated <strong>${new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                </p>

                <!-- Invoice Summary Box -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border-radius: 10px; margin: 25px 0;">
                  <tr>
                    <td style="padding: 25px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="color: #6B7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</td>
                          <td style="text-align: right; color: #1F2937; font-weight: 600; font-size: 15px;">${invoice.invoiceNumber}</td>
                        </tr>
                        <tr><td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #D1FAE5; margin: 0;"></td></tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Date</td>
                          <td style="text-align: right; color: #1F2937; font-weight: 600; font-size: 15px;">${new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                        <tr><td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #D1FAE5; margin: 0;"></td></tr>
                        <tr>
                          <td style="color: #6B7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</td>
                          <td style="text-align: right; color: #1F2937; font-weight: 600; font-size: 15px;">${new Date(invoice.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                        <tr><td colspan="2" style="padding: 12px 0;"><hr style="border: none; border-top: 2px solid #10B981; margin: 0;"></td></tr>
                        <tr>
                          <td style="color: #1F2937; font-size: 16px; font-weight: 700;">Total Amount</td>
                          <td style="text-align: right; color: #10B981; font-weight: 700; font-size: 24px;">₹${(+invoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 20px; color: #4B5563; font-size: 15px; line-height: 1.7;">
                  We would greatly appreciate it if the payment could be processed by <strong>${new Date(invoice.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>. Prompt processing helps us continue providing you with seamless service.
                </p>

                <p style="margin: 0 0 25px; color: #4B5563; font-size: 15px; line-height: 1.7;">
                  Should you have any questions or require further details regarding this invoice, please don't hesitate to reach out.
                </p>

                <p style="margin: 0 0 5px; color: #4B5563; font-size: 15px;">Thank you for your business.</p>

                <p style="margin: 25px 0 0; color: #1F2937; font-size: 15px;">
                  Best regards,<br>
                  <strong>${user.fullName}</strong><br>
                  <span style="color: #10B981; font-weight: 600;">Rupeeflow Finance Private Limited</span>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #F9FAFB; padding: 25px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="margin: 0 0 5px; color: #6B7280; font-size: 12px;">
                  <strong>RUPEEFLOW FINANCE PRIVATE LIMITED</strong>
                </p>
                <p style="margin: 0 0 5px; color: #9CA3AF; font-size: 11px;">
                  CIN: U64990KA2025PTC209485 | GSTIN: 29AAPCR1174A1ZD
                </p>
                <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 11px;">
                  NO. 112 AKR TECH PARK, KRISHNA REDDY IND. AREA, Bommanahalli, Bangalore 560068
                </p>
                <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
                  Email: support@rupeeflow.co
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    // return res
    //   .setHeader("Content-Type", "application/pdf")
    //   .setHeader("Content-Disposition", "attachment; filename=invoice.pdf")
    //   .send(invoicePdfBuffer);

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

  async deleteInvoice(invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

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
