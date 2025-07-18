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
        <title>Invoice for {{customer.name}}</title>
        <style>

      body {
        font-family: 'Arial Unicode MS', 'Arial', 'Helvetica', 'DejaVu Sans', 'Noto Sans', sans-serif;
        color: #333;
      }

      .header {
        padding-bottom: 20px;
        border-bottom: 2px solid #ddd;
        display: flex;
        justify-content: space-between;
      }

      .header img {
        max-width: 150px;
        height: auto;
        margin-bottom: 10px;
      }

      .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .invoice-title {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        margin-top: 10px;
      }

      .invoice-address h2 {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-top: 10px;
      }

      .invoice-address p {
        font-size: 16px;
        color: #555;
        width: 30%;
      }

      .invoice-details {
        margin-top: 20px;
        font-size: 16px;
        color: #555;
      }
      .invoice-details-row {
        display: flex;
        gap: 40px;
        align-items: center;
      }

      .invoice-details p {
        margin: 5px 0;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }

      .table th {
        background: #2a63c3;
        color: #fff;
        padding: 10px;
        font-size: 14px;
        text-align: left;
      }

      .table td {
        border: 1px solid #ddd;
        padding: 10px;
      }

      .section-title {
        font-size: 16px;
        font-weight: bold;
        margin-top: 20px;
        color: #333;
        padding-bottom: 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .service {
        display: flex;
        justify-content: space-between;
        // gap: 10px;
      }

      .address {
        margin-top: 10px;
        font-size: 14px;
        color: #444;
      }

      .item {
        font-size: 14px;
        color: #444;
      }

      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 14px;
        color: #777;
      }

      .footer p {
        margin: 5px 0;
      }
      
      /* Ensure rupee symbol renders properly */
      .rupee-symbol {
        font-family: 'Arial Unicode MS', 'Arial', 'Helvetica', sans-serif;
        font-weight: normal;
      }
      
      /* Fallback for rupee symbol */
      .rupee-fallback::before {
        content: "₹";
        font-family: 'Arial Unicode MS', 'Arial', 'Helvetica', sans-serif;
      }
    </style>
      </head>
      <body>
    <div class="invoice-container">
      <div class="header">
        <img src="data:image/png;base64,{{logo}}" alt="Logo" />
        <div class="invoice-title">INVOICE</div>
      </div>

      <div class="invoice-header">
        <div class="invoice-header-left">
          <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
        </div>
        <div class="invoice-header-right">
          <p><strong>Date:</strong> {{dateTime}}</p>
        </div>
      </div>

      <div class="address">
        <div class="section-title">Invoice To:</div>
        <p>{{address.shipping.name}}</p>
        <p>{{address.shipping.shippingAddress}}</p>
      </div>

      <div class="invoice-details">
        <div class="invoice-details-row">
          <div class="section-title">Status</div>
          <p>SUCCESS</p>
        </div>

        <div class="invoice-details-row">
          <div class="section-title">GSTIN</div>
          <p>{{customer.gstin}}</p>
        </div>

      </div>

      <table class="table">
        <thead>
          <tr>
            <th>SL.</th>
            <th>Item Name</th>
            <th>Price</th>
            <th>Qty.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td class="item">{{add @index 1}}</td>
            <td class="item">{{item.name}}</td>
            <td class="item">{{item.price}}</td>
            <td class="item">{{quantity}}</td>
            <td class="item">{{formatNumber total}}</td>
          </tr>
          {{/each}}
        </tbody>

                  <tfoot>
            <tr>
              <td colspan="4" style="text-align: right;"><strong>Sub Total:</strong></td>
              <td>Rs. {{subTotal}}</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align: right;"><strong>GST:</strong></td>
              <td>{{gst}}%</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align: right;"><strong>Total:</strong></td>
              <td>Rs.{{amount}}</td>
            </tr>
          </tfoot>
      </table>


      <div class="section-title">Billing Address</div>
      <div class="address">
        <p>{{address.billing.name}}</p>
        <p>{{address.billing.billingAddress}}</p>
      </div>

      <div class="service">
      <div class="service-left">
        <div class="section-title">Customer Notes</div>
        <div class="customer-notes">
          <p>{{customerNotes}}</p>
        </div>
      </div>

      <div class="service-right">
        <div class="section-title">Terms and Conditions</div>
        <div class="terms-and-conditions">
          <p>{{termsAndServices}}</p>
        </div>
      </div>

      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>If you have any questions, please contact us.</p>
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
    gst: number;
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
    };
    items: InvoiceItemEntity[];
  }): Promise<Buffer> {
    try {
      // Use process.cwd() to get the project root directory
      const logoPath = path.join(
        process.cwd(),
        "src/assets/images/color-full.png",
      );

      let logoBase64 = "";
      try {
        const logo = await fs.readFile(logoPath);
        logoBase64 = logo.toString("base64");
      } catch (err) {
        this.logger.warn("Could not load logo image, proceeding without it");
      }

      const items = data.items.map((item) => {
        const total = item.item.price * item.quantity;

        return {
          ...item,
          total,
        };
      });

      const modifiedData = {
        ...data,
        items,
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
  return value.toFixed(2);
});

handlebars.registerHelper("rupee", function (value) {
  // Try multiple representations of the rupee symbol
  return `₹${value}`;
});

handlebars.registerHelper("rupeeEntity", function (value) {
  return `&#8377;${value}`;
});
