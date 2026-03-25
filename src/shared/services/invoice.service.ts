import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import * as handlebars from "handlebars";
import * as fs from "fs/promises";
import * as path from "path";
import { CustomLogger } from "@/logger";
import { InvoiceItemEntity } from "@/entities/invoice-item.entity";
import { formatDateTime } from "@/utils/helperFunctions.utils";

@Injectable()
export class InvoiceService {
  private readonly logger = new CustomLogger(InvoiceService.name);
  private readonly TIMEOUT = 30000; // 30 seconds

  private numberToWords(num: number): string {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const numToWords = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " " + numToWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          numToWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 ? " " + numToWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          numToWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 ? " " + numToWords(n % 100000) : "")
        );

      return (
        numToWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 ? " " + numToWords(n % 10000000) : "")
      );
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = "";
    if (rupees > 0) {
      result = numToWords(rupees) + " Rupees";
    }
    if (paise > 0) {
      result += (result ? " and " : "") + numToWords(paise) + " Paise";
    }

    return result ? result + " Only" : "Zero Rupees Only";
  }

  private readonly invoiceTemplate = `
<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
    body {
        font-family: 'Arial', 'Helvetica', 'DejaVu Sans', sans-serif;
        margin: 0;
        padding: 0;
        background-color: white;
        color: #333;
        font-size: 12px;
        line-height: 1.4;
    }
    .invoice-container {
        width: 210mm;
        min-height: 297mm;
        padding: 2mm;
        margin: 0 auto;
        background: white;
        box-sizing: border-box;
    }
    .header {
        text-align: center;
        padding: 5mm 0;
        background-color: #6020a0;
        color: #fff;
        margin-bottom: 5mm;
    }
    .header .company-name {
        font-size: 24px;
        font-weight: bold;
    }
    .header h2 {
        margin: 5px 0;
        font-weight: normal;
        font-size: 18px;
    }
    .content {
        background: #fff;
    }
    .address-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5mm;
        gap: 5mm;
    }
    .address-box {
        width: 48%;
        padding: 5mm;
        background: #f9f9f9;
        border: 1px solid #ddd;
    }
    .address-box h3 {
        margin-top: 0;
        color: #6020a0;
        font-size: 14px;
    }
    .details-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        margin-bottom: 5mm;
        border: 1px solid #ddd;
    }
    .detail-item {
        padding: 4mm;
        background: #f9f9f9;
    }
    .detail-label {
        font-weight: bold;
        color: #6020a0;
        margin-bottom: 2mm;
    }
    .detail-value {
        color: #333;
    }
    .bank-details {
        padding: 5mm;
        border: 1px solid #ddd;
        background-color: #fefefe;
        margin-bottom: 10mm;
    }
    .bank-details h3 {
        margin-top: 0;
        color: #6020a0;
        font-size: 14px;
    }
    .footer {
        text-align: center;
        border-top: 1px solid #ddd;
        padding-top: 5mm;
        color: #666;
        font-size: 10px;
        line-height: 1.6;
    }
    .footer img {
        width: 30px;
        height: auto;
        margin-bottom: 1mm;
    }
    @media print {
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .invoice-container {
            box-shadow: none;
        }
    }
        </style>
    </head>
    <body>
        <div class="invoice-container">
        <div class="header">
            <div class="company-name">Rupeeflow Finance Private Limited</div>
            <h2>Settlement {{status}} Invoice</h2>
        </div>
        <div class="content">
            <div class="address-section">
                <div class="address-box">
                    <h3>Billing Address</h3>
                    <p style="font-size: 12px;">{{address.billing.name}}</p>
                    <p style="font-size: 12px;">{{address.billing.street}}</p>
                    <p style="font-size: 12px;">{{address.billing.city}}, {{address.billing.state}} {{address.billing.zip}}</p>
                    <p style="font-size: 12px;">{{address.billing.country}}</p>
                </div>
                <div class="address-box">
                    <h3>Shipping Address</h3>
                    <p style="font-size: 12px;">{{address.shipping.name}}</p>
                    <p style="font-size: 12px;">{{address.shipping.street}}</p>
                    <p style="font-size: 12px;">{{address.shipping.city}}, {{address.shipping.state}} {{address.shipping.zip}}</p>
                    <p style="font-size: 12px;">{{address.shipping.country}}</p>
                </div>
            </div>
            <div class="details-grid">
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">{{{rupeeEntity amount}}}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Transfer Mode</div>
                    <div class="detail-value">{{transferMode}}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Merchant Name</div>
                    <div class="detail-value">{{userName}}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Settled By</div>
                    <div class="detail-value">{{settledBy}}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date & Time</div>
                    <div class="detail-value">{{dateTime}}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Remarks</div>
                    <div class="detail-value">{{remarks}}</div>
                </div>
            </div>
            <div class="bank-details">
                <h3>Bank Details</h3>
                <p><strong>Account Number:</strong> {{bankDetails.accountNumber}}</p>
                <p><strong>IFSC Code:</strong> {{bankDetails.ifscCode}}</p>
                <p><strong>Bank Name:</strong> {{bankDetails.bankName}}</p>
                <p><strong>Account Holder:</strong> {{bankDetails.accountHolderName}}</p>
            </div>
        </div>
        <div class="footer">
            <img src="data:image/png;base64,{{ logo }}" alt="PayBolt Logo" />
            <p>
                {{address.shipping.name}}<br>
                {{address.shipping.street}}, {{address.shipping.city}}, {{address.shipping.state}} {{address.shipping.zip}}<br>
                {{address.shipping.country}}
            </p>
        </div>
        </div>
    </body>
  </html>
  `;

  private readonly customerInvoiceTemplate = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Invoice {{invoiceNumber}}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', 'Arial', 'Helvetica', sans-serif;
        color: #333;
        background: #fff;
        font-size: 12px;
        line-height: 1.4;
      }

      .invoice-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px 30px;
      }

      /* Header */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 15px;
        border-bottom: 3px solid #10B981;
        margin-bottom: 15px;
      }

      .company-info {
        flex: 1;
      }

      .company-logo {
        margin-bottom: 8px;
      }

      .company-logo img {
        height: 40px;
        width: auto;
      }

      .company-details {
        font-size: 10px;
        color: #666;
        line-height: 1.5;
      }

      .company-details p {
        margin: 1px 0;
      }

      .invoice-title-section {
        text-align: right;
      }

      .invoice-title {
        font-size: 32px;
        font-weight: 700;
        color: #1F2937;
        letter-spacing: 2px;
      }

      .invoice-number {
        font-size: 13px;
        color: #10B981;
        font-weight: 600;
        margin-top: 3px;
      }

      /* Invoice Meta - Bill To Only */
      .invoice-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        gap: 20px;
      }

      .meta-box {
        flex: 1;
        background: #F9FAFB;
        padding: 12px 15px;
        border-radius: 6px;
      }

      .meta-box h3 {
        font-size: 11px;
        text-transform: uppercase;
        color: #10B981;
        font-weight: 600;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }

      .meta-box p {
        margin: 2px 0;
        color: #374151;
        font-size: 11px;
      }

      .meta-box .name {
        font-weight: 600;
        font-size: 13px;
        color: #1F2937;
      }

      /* Invoice Details Row */
      .invoice-details-row {
        display: flex;
        justify-content: space-between;
        background: #F9FAFB;
        padding: 10px 15px;
        border-radius: 6px;
        margin-bottom: 15px;
      }

      .detail-item {
        text-align: center;
      }

      .detail-label {
        font-size: 10px;
        text-transform: uppercase;
        color: #6B7280;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .detail-value {
        font-size: 12px;
        font-weight: 600;
        color: #1F2937;
        margin-top: 2px;
      }

      /* Items Table */
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }

      .table th {
        background: #10B981;
        color: #fff;
        padding: 10px 12px;
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .table th:first-child {
        border-radius: 6px 0 0 0;
      }

      .table th:last-child {
        border-radius: 0 6px 0 0;
        text-align: right;
      }

      .table td {
        padding: 10px 12px;
        border-bottom: 1px solid #E5E7EB;
        color: #374151;
        font-size: 11px;
      }

      .table td:last-child {
        text-align: right;
        font-weight: 500;
      }

      /* Tax Summary */
      .tax-summary {
        margin-bottom: 12px;
      }

      .tax-summary h4 {
        font-size: 12px;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 8px;
      }

      .tax-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #E5E7EB;
        font-size: 11px;
      }

      .tax-row:last-child {
        border-bottom: none;
        font-weight: 600;
      }

      .tax-label {
        color: #374151;
      }

      .tax-value {
        color: #1F2937;
      }

      /* Totals Box */
      .totals-box {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 10px;
      }

      .totals-table {
        width: 280px;
        border: 1px solid #E5E7EB;
        border-radius: 6px;
        overflow: hidden;
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid #E5E7EB;
        font-size: 11px;
      }

      .totals-row:last-child {
        border-bottom: none;
        background: #EBF5FF;
        font-weight: 700;
        font-size: 13px;
      }

      .totals-row .label {
        color: #374151;
      }

      .totals-row .value {
        color: #1F2937;
      }

      .totals-row:last-child .label {
        color: #1E40AF;
      }

      .totals-row:last-child .value {
        color: #1E40AF;
      }

      /* Amount in Words */
      .amount-words {
        text-align: center;
        font-size: 11px;
        color: #1E40AF;
        font-style: italic;
        margin-bottom: 12px;
        padding: 8px;
        background: #F0F9FF;
        border-radius: 6px;
      }

      /* Notes Section */
      .notes-section {
        display: flex;
        gap: 15px;
        margin-bottom: 12px;
      }

      .notes-box {
        flex: 1;
        padding: 10px 12px;
        background: #F9FAFB;
        border-radius: 6px;
      }

      .notes-box h4 {
        font-size: 10px;
        text-transform: uppercase;
        color: #10B981;
        font-weight: 600;
        margin-bottom: 5px;
        letter-spacing: 0.5px;
      }

      .notes-box p {
        color: #4B5563;
        font-size: 10px;
        line-height: 1.5;
      }

      /* Footer */
      .footer {
        text-align: center;
        padding-top: 12px;
        border-top: 2px solid #E5E7EB;
      }

      .footer-thanks {
        font-size: 14px;
        font-weight: 600;
        color: #10B981;
        margin-bottom: 5px;
      }

      .footer-contact {
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 15px;
      }

      .footer-company {
        font-size: 11px;
        color: #9CA3AF;
        line-height: 1.6;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <!-- Header -->
      <div class="header">
        <div class="company-info">
          <div class="company-logo">
            <img src="data:image/svg+xml;base64,{{logo}}" alt="Rupeeflow" style="height: 40px; width: auto;" />
          </div>
          <div class="company-details">
            <p><strong>RUPEEFLOW FINANCE PRIVATE LIMITED</strong></p>
            <p>CIN: U64990KA2025PTC209485</p>
            <p>GSTIN: 29AAPCR1174A1ZD</p>
            <p>NO. 112 AKR TECH PARK, KRISHNA REDDY IND. AREA</p>
            <p>Bommanahalli, Bangalore, Karnataka 560068, India</p>
          </div>
        </div>
        <div class="invoice-title-section">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">#{{invoiceNumber}}</div>
        </div>
      </div>

      <!-- Invoice Meta - Bill To Only -->
      <div class="invoice-meta">
        <div class="meta-box" style="max-width: 350px;">
          <h3>Bill To</h3>
          <p class="name">{{address.shipping.name}}</p>
          <p>{{address.shipping.shippingAddress}}</p>
          {{#if customer.gstin}}
          <p><strong>GSTIN:</strong> {{customer.gstin}}</p>
          {{/if}}
        </div>
        <div class="meta-box" style="max-width: 200px;">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> {{dateTime}}</p>
          <p><strong>Invoice #:</strong> {{invoiceNumber}}</p>
        </div>
      </div>

      <!-- Items Table -->
      <table class="table">
        <thead>
          <tr>
            <th style="width: 35px;">SL.</th>
            <th>Item Name</th>
            <th style="width: 90px;">HSN Code</th>
            <th style="width: 80px;">Price</th>
            <th style="width: 50px;">Qty.</th>
            <th style="width: 90px;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>{{add @index 1}}</td>
            <td>{{item.name}}</td>
            <td>{{item.hsnCode}}</td>
            <td>{{formatNumber item.price}}</td>
            <td>{{quantity}}</td>
            <td>{{formatNumber total}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>

      <!-- Tax Summary -->
      <div class="tax-summary">
        <h4>Tax Summary {{#if isInterState}}(Inter-State){{else}}(Intra-State){{/if}}</h4>
        {{#if isInterState}}
        <!-- Inter-State: IGST -->
        <div class="tax-row">
          <span class="tax-label">IGST @ {{gst}}%</span>
          <span class="tax-value">&#8377; {{formatNumber igstAmount}}</span>
        </div>
        {{else}}
        <!-- Intra-State: CGST + SGST -->
        <div class="tax-row">
          <span class="tax-label">CGST @ {{halfGst}}%</span>
          <span class="tax-value">&#8377; {{formatNumber cgstAmount}}</span>
        </div>
        <div class="tax-row">
          <span class="tax-label">SGST @ {{halfGst}}%</span>
          <span class="tax-value">&#8377; {{formatNumber sgstAmount}}</span>
        </div>
        {{/if}}
        <div class="tax-row">
          <span class="tax-label">Total GST ({{gst}}%)</span>
          <span class="tax-value">&#8377; {{formatNumber gstAmount}}</span>
        </div>
      </div>

      <!-- Totals Box -->
      <div class="totals-box">
        <div class="totals-table">
          <div class="totals-row">
            <span class="label">Sub Total:</span>
            <span class="value">&#8377; {{formatNumber subTotal}}</span>
          </div>
          {{#if isInterState}}
          <div class="totals-row">
            <span class="label">IGST ({{gst}}%):</span>
            <span class="value">&#8377; {{formatNumber igstAmount}}</span>
          </div>
          {{else}}
          <div class="totals-row">
            <span class="label">CGST ({{halfGst}}%):</span>
            <span class="value">&#8377; {{formatNumber cgstAmount}}</span>
          </div>
          <div class="totals-row">
            <span class="label">SGST ({{halfGst}}%):</span>
            <span class="value">&#8377; {{formatNumber sgstAmount}}</span>
          </div>
          {{/if}}
          <div class="totals-row">
            <span class="label">Grand Total:</span>
            <span class="value">&#8377; {{formatNumber amount}}</span>
          </div>
        </div>
      </div>

      <!-- Amount in Words -->
      <div class="amount-words">
        (Amount in Words: {{amountInWords}})
      </div>

      <!-- Notes Section -->
      <div class="notes-section">
        {{#if customerNotes}}
        <div class="notes-box">
          <h4>Notes</h4>
          <p>{{customerNotes}}</p>
        </div>
        {{/if}}
        <div class="notes-box">
          <h4>Terms & Conditions</h4>
          <p style="font-size: 9px; line-height: 1.4;">
            1. Payment is due within the specified due date. Late payments may incur additional charges.<br>
            2. All disputes are subject to Bangalore jurisdiction.<br>
            3. This is a computer-generated invoice and does not require a signature.<br>
            4. For complete terms, visit: <span style="color: #10B981;">https://rupeeflow.co/legal/terms/</span>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-thanks">Thank you for your business!</div>
        <div class="footer-contact">For any queries, please contact us at support@rupeeflow.co</div>
        <div class="footer-company">
          RUPEEFLOW FINANCE PRIVATE LIMITED | CIN: U64990KA2025PTC209485 | GSTIN: 29AAPCR1174A1ZD
        </div>
      </div>
    </div>
  </body>
</html>
`;

  async generateInvoicePDF(data: {
    amount: number;
    transferMode: string;
    userName: string;
    settledBy: string;
    remarks: string;
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      accountHolderName: string;
    };
    status: string;
    dateTime: string;
    address: {
      billing: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
      shipping: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
    };
  }): Promise<Buffer> {
    try {
      // Use process.cwd() to get the project root directory
      const logoPath = path.join(
        process.cwd(),
        "src/assets/images/paybolt-icon.png",
      );

      let logoBase64 = "";
      try {
        const logo = await fs.readFile(logoPath);
        logoBase64 = logo.toString("base64");
      } catch (err) {
        this.logger.warn("Could not load logo image, proceeding without it");
      }

      const template = handlebars.compile(this.invoiceTemplate);
      const html = template({
        ...data,
        logo: logoBase64,
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--font-render-hinting=none",
        ],
      });

      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(this.TIMEOUT);
      await page.setDefaultTimeout(this.TIMEOUT);

      await page.setContent(html, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: this.TIMEOUT,
      });

      // Wait a bit more for fonts to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error("Error generating invoice PDF", error);
      throw error;
    }
  }

  async generateInvoiceToCustomer(data: {
    amount: number;
    subTotal: number;
    /** Pre-computed CGST total for the invoice (intra-state). */
    cgstAmount: number;
    /** Pre-computed SGST total for the invoice (intra-state). */
    sgstAmount: number;
    /** Pre-computed IGST total for the invoice (inter-state). */
    igstAmount: number;
    isInterState: boolean;
    /** Merchant's GSTIN to print on the PDF. */
    merchantGstin?: string | null;
    invoiceNumber: string;
    userName: string;
    status: string;
    dateTime: Date;
    customerNotes: string;
    termsAndServices: string;
    address: {
      billing: {
        name: string;
        billingAddress: string;
      };
      shipping: {
        name: string;
        shippingAddress: string;
      };
    };
    customer: {
      name: string;
      email: string;
      gstin: string;
      state?: string;
    };
    items: InvoiceItemEntity[];
  }): Promise<Buffer> {
    try {
      // Use process.cwd() to get the project root directory
      const logoPath = path.join(process.cwd(), "public/Rupeeflow.svg");

      let logoBase64 = "";
      try {
        const logo = await fs.readFile(logoPath);
        logoBase64 = logo.toString("base64");
      } catch (err) {
        this.logger.warn("Could not load logo image, proceeding without it");
      }

      // Use stored rate snapshot + per-item tax breakdown
      const items = data.items.map((item) => ({
        ...item,
        // rate is the price-at-invoice-time stored on the line item
        total: item.totalAmount ?? item.rate * item.quantity,
      }));

      const totalTaxAmount = data.isInterState
        ? data.igstAmount
        : data.cgstAmount + data.sgstAmount;
      const amountInWords = this.numberToWords(data.amount);

      const modifiedData = {
        ...data,
        items,
        gstAmount: totalTaxAmount,
        cgstAmount: data.cgstAmount,
        sgstAmount: data.sgstAmount,
        igstAmount: data.igstAmount,
        amountInWords,
        isInterState: data.isInterState,
        merchantGstin: data.merchantGstin ?? null,
        dateTime: formatDateTime(data.dateTime),
      };

      // Use a different template for the customer-specific invoice
      const template = handlebars.compile(this.customerInvoiceTemplate);
      const html = template({
        ...modifiedData,
        logo: logoBase64,
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--font-render-hinting=none",
        ],
      });

      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(this.TIMEOUT);
      await page.setDefaultTimeout(this.TIMEOUT);

      await page.setContent(html, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: this.TIMEOUT,
      });

      // Wait a bit more for fonts to load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error("Error generating invoice to customer PDF", error);
      throw error;
    }
  }
}

handlebars.registerHelper("add", function (value1, value2) {
  return value1 + value2;
});

handlebars.registerHelper("formatNumber", function (value) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return "0.00";
  }

  return num.toFixed(2);
});

handlebars.registerHelper("rupee", function (value) {
  // Try multiple representations of the rupee symbol
  return `₹${value}`;
});

handlebars.registerHelper("rupeeEntity", function (value) {
  return `&#8377;${value}`;
});
