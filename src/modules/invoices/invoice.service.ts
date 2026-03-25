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
import { UserBusinessDetailsEntity } from "@/entities/user-business.entity";
import {
  getInvoiceStatusForQuery,
  getInvoiceStatus,
  getStateFromGstin,
} from "@/utils/helperFunctions.utils";

// ─── GST calculation helpers ──────────────────────────────────────────────────

interface LineGst {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

function computeLineGst(
  rate: number,
  quantity: number,
  gstRate: number,
  isInterState: boolean,
): LineGst {
  const taxableAmount = round2(rate * quantity);
  const totalTax = round2((taxableAmount * gstRate) / 100);

  if (isInterState) {
    return {
      taxableAmount,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: totalTax,
      totalAmount: round2(taxableAmount + totalTax),
    };
  }

  const halfTax = round2(totalTax / 2);

  return {
    taxableAmount,
    cgstAmount: halfTax,
    sgstAmount: halfTax,
    igstAmount: 0,
    totalAmount: round2(taxableAmount + totalTax),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Days after which a sent (unpaid) invoice is eligible for invoice financing. */
const FINANCING_ELIGIBLE_DAYS = 30;

@Injectable()
export class InvoiceCustomerService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepo: Repository<UsersEntity>,
    @InjectRepository(UserBusinessDetailsEntity)
    private readonly businessRepo: Repository<UserBusinessDetailsEntity>,
    private readonly customerService: CustomerService,
    private readonly sesService: SESService,
    private readonly invoiceService: InvoiceService,
    @InjectRepository(ItemEntity)
    private readonly itemRepo: Repository<ItemEntity>,
    @InjectRepository(InvoiceItemEntity)
    private readonly invoiceItemRepo: Repository<InvoiceItemEntity>,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async getMerchantSellerState(merchantId: string): Promise<string> {
    const biz = await this.businessRepo.findOne({
      where: { user: { id: merchantId } },
    });

    return getStateFromGstin(biz?.gstin);
  }

  private async getMerchantGstin(merchantId: string): Promise<string | null> {
    const biz = await this.businessRepo.findOne({
      where: { user: { id: merchantId } },
    });

    return biz?.gstin ?? null;
  }

  // ─── Save draft ─────────────────────────────────────────────────────────────

  async saveToDraftInvoice(
    createInvoiceDto: CreateInvoiceDto,
    merchant: UsersEntity,
  ) {
    const {
      description,
      termsAndServices,
      customerNotes,
      billingAddress,
      issueDate,
      expiryDate,
      customerId,
      invoiceNumber,
      id,
      items,
      isRecurring,
      recurringConfig,
    } = createInvoiceDto;

    const customer = await this.customerService.findOne(customerId);
    if (!customer) throw new NotFoundException("Customer not found");

    const existingInvoice = await this.invoiceRepo.findOne({
      where: { invoiceNumber, id },
    });

    if (existingInvoice && existingInvoice.status === INVOICE_STATUS.SENT) {
      throw new BadRequestException("Invoice already sent");
    }

    // ── Determine GST type ──────────────────────────────────────────────────
    const sellerState = await this.getMerchantSellerState(merchant.id);
    const customerState = customer.state?.trim().toLowerCase() ?? "";
    const isInterState =
      customerState !== "" &&
      customerState !== sellerState.trim().toLowerCase();

    // ── Build invoice items with tax breakdown ──────────────────────────────
    let invoiceItems: InvoiceItemEntity[] | undefined;
    let subtotalAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    if (items && items.length > 0) {
      invoiceItems = await Promise.all(
        items.map(async (singleItem) => {
          const item = await this.itemRepo.findOne({
            where: { id: singleItem.id },
          });
          if (!item) {
            throw new NotFoundException(
              `Item with ID ${singleItem.id} not found`,
            );
          }

          const gst = computeLineGst(
            +item.price,
            singleItem.quantity,
            item.gstRate,
            isInterState,
          );

          subtotalAmount += gst.taxableAmount;
          totalCgst += gst.cgstAmount;
          totalSgst += gst.sgstAmount;
          totalIgst += gst.igstAmount;

          return this.invoiceItemRepo.create({
            item,
            quantity: singleItem.quantity,
            rate: +item.price,
            gstRate: item.gstRate,
            taxableAmount: gst.taxableAmount,
            cgstAmount: gst.cgstAmount,
            sgstAmount: gst.sgstAmount,
            igstAmount: gst.igstAmount,
            totalAmount: gst.totalAmount,
          });
        }),
      );
    }

    subtotalAmount = round2(subtotalAmount);
    totalCgst = round2(totalCgst);
    totalSgst = round2(totalSgst);
    totalIgst = round2(totalIgst);
    const totalTaxAmount = round2(totalCgst + totalSgst + totalIgst);
    const grandTotal = round2(subtotalAmount + totalTaxAmount);

    const user = await this.userRepo.findOne({
      where: { id: merchant.id },
      relations: { address: true },
    });

    const shippingAddress = `${customer.addressLine1},${customer.addressLine2 ? customer.addressLine2 + " ," : ""} ${customer.city}, ${customer.state}, ${customer.pincode}, ${customer.country}`;

    const invoice = this.invoiceRepo.create({
      id,
      invoiceNumber,
      description,
      termsAndServices,
      customerNotes,
      subtotalAmount,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      totalTaxAmount,
      totalAmount: grandTotal,
      billingAddress: billingAddress
        ? billingAddress
        : (user.address?.[0] as any),
      issueDate,
      expiryDate,
      customer,
      shippingAddress,
      user: merchant,
      isRecurring: isRecurring ?? false,
      recurringConfig: isRecurring && recurringConfig ? recurringConfig : null,
      ...(invoiceItems && invoiceItems.length > 0 && { items: invoiceItems }),
    });

    await this.invoiceRepo.save(invoice);

    return {
      message: "Invoice created successfully",
      invoiceId: invoice.id,
    };
  }

  // ─── Get single invoice ──────────────────────────────────────────────────

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
        subtotalAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
        totalTaxAmount: true,
        totalAmount: true,
        customerNotes: true,
        termsAndServices: true,
        shippingAddress: true,
        billingAddress: true,
        status: true,
        issueDate: true,
        expiryDate: true,
        viewedAt: true,
        paidAt: true,
        reminderSentAt: true,
        isRecurring: true,
        recurringConfig: true as never, // JSONB column — TypeORM requires cast to avoid FindOptionsSelect<RecurringConfig> mismatch
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
          description: true,
          quantity: true,
          rate: true,
          gstRate: true,
          taxableAmount: true,
          cgstAmount: true,
          sgstAmount: true,
          igstAmount: true,
          totalAmount: true,
          item: {
            id: true,
            price: true,
            name: true,
            hsnCode: true,
            gstRate: true,
          },
        },
      },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");

    // Financing eligibility: unpaid for 30+ days
    const now = new Date();
    const sentAt = invoice.createdAt;
    const daysSinceSent = sentAt
      ? Math.floor(
          (now.getTime() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;
    const isFinancingEligible =
      ![INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED].includes(
        invoice.status,
      ) && daysSinceSent >= FINANCING_ELIGIBLE_DAYS;

    return { ...invoice, isFinancingEligible };
  }

  // ─── Mark viewed ─────────────────────────────────────────────────────────

  async markViewed(invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    if (!invoice.viewedAt) {
      invoice.viewedAt = new Date();
      if (invoice.status === INVOICE_STATUS.SENT) {
        invoice.status = INVOICE_STATUS.VIEWED;
      }
      await this.invoiceRepo.save(invoice);
    }

    return { message: "Invoice marked as viewed" };
  }

  // ─── Mark paid ───────────────────────────────────────────────────────────

  async markPaid(invoiceId: string, merchantId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, user: { id: merchantId } },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    if (invoice.status === INVOICE_STATUS.PAID) {
      return { message: "Invoice is already marked as paid" };
    }

    invoice.status = INVOICE_STATUS.PAID;
    invoice.paidAt = new Date();
    await this.invoiceRepo.save(invoice);

    return { message: "Invoice marked as paid" };
  }

  // ─── Send reminder ───────────────────────────────────────────────────────

  async sendReminder(invoiceId: string, merchant: UsersEntity) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, user: { id: merchant.id } },
      relations: { customer: true, user: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    if (invoice.status === INVOICE_STATUS.PAID) {
      throw new BadRequestException("Invoice is already paid");
    }
    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      throw new BadRequestException("Invoice is cancelled");
    }
    if (invoice.status === INVOICE_STATUS.DRAFT) {
      throw new BadRequestException("Cannot send reminder for a draft invoice");
    }

    const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber}`;
    const dueDate = invoice.expiryDate
      ? new Date(invoice.expiryDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "as soon as possible";

    const body = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f4;padding:30px 0;">
      <tr><td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);padding:30px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;">Payment Reminder</h1>
            <p style="margin:5px 0 0;color:rgba(255,255,255,.9);font-size:14px;">Invoice ${invoice.invoiceNumber}</p>
          </td></tr>
          <tr><td style="padding:40px;">
            <p style="color:#1F2937;font-size:16px;">Dear <strong>${invoice.customer.name}</strong>,</p>
            <p style="color:#4B5563;font-size:15px;line-height:1.7;">
              This is a friendly reminder that <strong>Invoice ${invoice.invoiceNumber}</strong> for
              <strong style="color:#D97706;">₹${(+invoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              is due by <strong>${dueDate}</strong>.
            </p>
            <p style="color:#4B5563;font-size:15px;">Please arrange payment at your earliest convenience.</p>
            <p style="margin-top:30px;color:#1F2937;font-size:15px;">
              Best regards,<br>
              <strong>${merchant.fullName}</strong>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

    await this.sesService.sendEmail(subject, body, invoice.customer.email);

    invoice.reminderSentAt = new Date();
    await this.invoiceRepo.save(invoice);

    return { message: "Reminder sent successfully" };
  }

  // ─── Get invoices of customer ─────────────────────────────────────────────

  async getInvoicesOfCustomer(customerId: string, user: UsersEntity) {
    const where: FindOptionsWhere<InvoiceEntity> = [
      USERS_ROLE.ADMIN,
      USERS_ROLE.OWNER,
    ].includes(user.role)
      ? { customer: { id: customerId } }
      : { customer: { id: customerId }, user: { id: user.id } };

    return this.invoiceRepo.find({
      where,
      relations: { customer: true, user: true },
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
        user: { id: true, fullName: true },
        customer: { id: true, name: true },
      },
    });
  }

  // ─── Get paginated invoices ───────────────────────────────────────────────

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
    const isAdmin = [USERS_ROLE.ADMIN, USERS_ROLE.OWNER].includes(user.role);

    const dateFilter: FindOptionsWhere<InvoiceEntity> = {};
    if (startDate && endDate) {
      dateFilter.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      dateFilter.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const internalStatus = status
      ? getInvoiceStatusForQuery(status)
      : undefined;

    const merchantFilter: FindOptionsWhere<InvoiceEntity> = isAdmin
      ? {}
      : { user: { id: userId } };

    const baseWhere: FindOptionsWhere<InvoiceEntity> = {
      ...dateFilter,
      ...merchantFilter,
      ...(internalStatus !== undefined && { status: internalStatus }),
    };

    let query: FindOptionsWhere<InvoiceEntity>[];

    if (search) {
      const searchBase = {
        ...merchantFilter,
        ...(internalStatus !== undefined && { status: internalStatus }),
      };
      query = [
        { ...searchBase, invoiceNumber: ILike(`%${search}%`) },
        { ...searchBase, customer: { name: ILike(`%${search}%`) } },
        { ...searchBase, customer: { contactNumber: ILike(`%${search}%`) } },
        { ...searchBase, customer: { email: ILike(`%${search}%`) } },
        { ...searchBase, id: ILike(`%${search}%`) },
      ];
    } else {
      query = [baseWhere];
    }

    const [invoices, totalItems] = await this.invoiceRepo.findAndCount({
      where: query,
      skip: (page - 1) * limit,
      take: limit,
      order: { [sort]: order },
      relations: { user: true, customer: true },
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        subtotalAmount: true,
        totalTaxAmount: true,
        totalAmount: true,
        status: true,
        issueDate: true,
        expiryDate: true,
        paidAt: true,
        reminderSentAt: true,
        isRecurring: true,
        createdAt: true,
        updatedAt: true,
        user: { id: true, fullName: true },
        customer: {
          id: true,
          name: true,
          contactNumber: true,
          email: true,
        },
      },
    });

    const pagination = getPagination({ page, limit, totalItems });

    return { data: invoices, pagination };
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  async checkInvoiceValidation(createInvoiceDto: CreateInvoiceDto) {
    const { customerId, items, invoiceNumber } = createInvoiceDto;

    if (!customerId) throw new BadRequestException("Customer is required");

    const customer = await this.customerService.findOne(customerId);
    if (!customer) throw new NotFoundException("Customer not found");

    if (!invoiceNumber)
      throw new BadRequestException("Invoice number is required");

    if (items.length === 0)
      throw new BadRequestException("Items cannot be empty");

    if (items.some((item) => item.quantity <= 0))
      throw new BadRequestException("Quantity must be greater than 0");

    return true;
  }

  // ─── Process (draft → send) ───────────────────────────────────────────────

  async processInvoice(
    createInvoiceDto: CreateInvoiceDto,
    merchant: UsersEntity,
  ) {
    const draftInvoice = await this.saveToDraftInvoice(
      createInvoiceDto,
      merchant,
    );

    const isValid = await this.checkInvoiceValidation(createInvoiceDto);
    if (!isValid) throw new BadRequestException("Invalid invoice");

    return this.finalizeAndSendInvoiceForMerchant(
      merchant,
      draftInvoice.invoiceId,
    );
  }

  // ─── Finalize & send ──────────────────────────────────────────────────────

  async finalizeAndSendInvoiceForMerchant(user: UsersEntity, id: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        user: true,
        items: { item: true },
      },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");
    if (!invoice.billingAddress) {
      throw new NotFoundException("Billing address not found");
    }

    // Determine GST type from merchant's registered state vs customer state
    const sellerState = await this.getMerchantSellerState(user.id);
    const merchantGstin = await this.getMerchantGstin(user.id);
    const customerState = invoice.customer.state?.trim().toLowerCase() ?? "";
    const isInterState =
      customerState !== "" &&
      customerState !== sellerState.trim().toLowerCase();

    const invoicePdfBuffer =
      await this.invoiceService.generateInvoiceToCustomer({
        amount: +invoice.totalAmount,
        subTotal: +invoice.subtotalAmount,
        cgstAmount: +invoice.cgstAmount,
        sgstAmount: +invoice.sgstAmount,
        igstAmount: +invoice.igstAmount,
        isInterState,
        merchantGstin,
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

    const invoiceSubject = `Invoice ${invoice.invoiceNumber} from ${user.fullName}`;
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
            <tr>
              <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">RUPEEFLOW</h1>
                <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Invoice Notification</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 20px; color: #1F2937; font-size: 16px;">Dear <strong>${invoice.customer.name}</strong>,</p>
                <p style="margin: 0 0 20px; color: #4B5563; font-size: 15px; line-height: 1.7;">
                  Please find attached <strong style="color: #10B981;">Invoice ${invoice.invoiceNumber}</strong> dated
                  <strong>${new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border-radius: 10px; margin: 25px 0;">
                  <tr><td style="padding: 25px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 13px;">Invoice Number</td>
                        <td style="text-align: right; color: #1F2937; font-weight: 600;">${invoice.invoiceNumber}</td>
                      </tr>
                      <tr><td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #D1FAE5;"></td></tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 13px;">Invoice Date</td>
                        <td style="text-align: right; color: #1F2937; font-weight: 600;">${new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      </tr>
                      <tr><td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid #D1FAE5;"></td></tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 13px;">Due Date</td>
                        <td style="text-align: right; color: #1F2937; font-weight: 600;">${new Date(invoice.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      </tr>
                      <tr><td colspan="2" style="padding: 12px 0;"><hr style="border: none; border-top: 2px solid #10B981;"></td></tr>
                      <tr>
                        <td style="color: #1F2937; font-size: 16px; font-weight: 700;">Total Amount</td>
                        <td style="text-align: right; color: #10B981; font-weight: 700; font-size: 24px;">₹${(+invoice.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td></tr>
                </table>
                <p style="margin: 0 0 5px; color: #4B5563; font-size: 15px;">Thank you for your business.</p>
                <p style="margin: 25px 0 0; color: #1F2937; font-size: 15px;">
                  Best regards,<br>
                  <strong>${user.fullName}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #F9FAFB; padding: 25px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="margin: 0 0 5px; color: #6B7280; font-size: 12px;"><strong>RUPEEFLOW FINANCE PRIVATE LIMITED</strong></p>
                <p style="margin: 0 0 5px; color: #9CA3AF; font-size: 11px;">CIN: U64990KA2025PTC209485 | GSTIN: 29AAPCR1174A1ZD</p>
                <p style="margin: 0; color: #9CA3AF; font-size: 11px;">Email: support@rupeeflow.co</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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

  // ─── Admin send ───────────────────────────────────────────────────────────

  async finalizeAndSendInvoiceForAdmin(
    id: string,
  ): Promise<MessageResponseDto> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException("Invoice not found");

    await this.invoiceRepo.save(invoice);

    return new MessageResponseDto("Invoice sent successfully");
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async deleteInvoice(invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    await this.invoiceRepo.delete(invoiceId);

    return new MessageResponseDto("Invoice deleted successfully");
  }

  // ─── Overdue flip (called by cron) ───────────────────────────────────────

  async markOverdueInvoices(): Promise<void> {
    const now = new Date();

    // Only flip SENT or VIEWED invoices past their due date
    await this.invoiceRepo
      .createQueryBuilder()
      .update(InvoiceEntity)
      .set({ status: INVOICE_STATUS.OVERDUE })
      .where("status IN (:...statuses)", {
        statuses: [INVOICE_STATUS.SENT, INVOICE_STATUS.VIEWED],
      })
      .andWhere("expiryDate < :now", { now })
      .execute();
  }

  // ─── List all invoices (admin) ────────────────────────────────────────────

  async getAllInvoices(
    { name, page, limit }: { name?: string; page: number; limit: number },
    merchantId: string | null,
  ): Promise<InvoiceEntity[]> {
    const qb = this.invoiceRepo.createQueryBuilder("invoice");

    if (name) {
      qb.andWhere("invoice.customer.name LIKE :name", {
        name: `%${name}%`,
      });
    }

    if (merchantId) {
      qb.andWhere("invoice.userId = :merchantId", { merchantId });
    }

    qb.skip((page - 1) * limit).take(limit);

    return qb.getMany();
  }
}
