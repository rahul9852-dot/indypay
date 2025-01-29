import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import * as handlebars from "handlebars";
import * as fs from "fs/promises";
import * as path from "path";
import { CustomLogger } from "@/logger";
import { INVOICE_STATUS } from "@/enums";

@Injectable()
export class InvoiceService {
  private readonly logger = new CustomLogger(InvoiceService.name);
  private readonly TIMEOUT = 30000; // 30 seconds

  private readonly invoiceTemplate = `
<!DOCTYPE html>
    <html>
    <head>
        <style>
    body {
        font-family: 'Arial', sans-serif;
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
            <div class="company-name">PayBolt Technologies</div>
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
                    <div class="detail-value">₹{{amount}}</div>
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
        <title>Invoice for {{customer.name}}</title>
        <style>
          /* Add styles for your PDF here */
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <img src="data:image/png;base64,{{logo}}" alt="Logo" />
        </div>
        <h1>Invoice</h1>
        <p>Invoice Number: {{transferMode}}</p>
        <p>Amount: ₹{{amount}}</p>
        <p>Remarks: {{remarks}}</p>
        <p>Status: {{status}}</p>
        <p>Customer: {{customer.name}}</p>
        <p>Date: {{dateTime}}</p>
        <h2>Billing Address</h2>
        <p>{{address.billing.name}}</p>
        <p>{{address.billing.billingAddress}}</p>
        <h2>Shipping Address</h2>
        <p>{{address.shipping.name}}</p>
        <p>{{address.shipping.shippingAddress}}</p>
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
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(this.TIMEOUT);
      await page.setDefaultTimeout(this.TIMEOUT);

      await page.setContent(html, {
        waitUntil: ["domcontentloaded"],
        timeout: this.TIMEOUT,
      });

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
    userName: string;
    remarks: string;
    status: INVOICE_STATUS;
    dateTime: Date;
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

      // Use a different template for the customer-specific invoice
      const template = handlebars.compile(this.customerInvoiceTemplate);
      const html = template({
        ...data,
        logo: logoBase64,
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(this.TIMEOUT);
      await page.setDefaultTimeout(this.TIMEOUT);

      await page.setContent(html, {
        waitUntil: ["domcontentloaded"],
        timeout: this.TIMEOUT,
      });

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
