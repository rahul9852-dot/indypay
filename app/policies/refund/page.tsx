import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RefundPolicy() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#6B46C1] mb-8">Refund, Cancellation and Chargeback Policy</h1>
        <p className="text-gray-600 mb-8">(Applicable to Transactions Facilitated via IndyPay Platform)</p>
        
        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. INTRODUCTION</h2>
            <p>
              This Refund and Cancellation Policy ("Policy") sets out the terms and conditions governing 
              cancellations, refunds, reversals, and related processes in respect of Transactions facilitated through 
              the technology platform ("Platform") provided by IndyPay Technologies Pvt. Ltd. ("Company").
            </p>
            <p>
              The Company operates solely as a Technology Service Provider (TSP) and provides technology 
              infrastructure to enable Merchants to access payment processing services offered by a Partner Bank 
              or an RBI-authorised Payment Aggregator ("PA"). The Company does not, at any stage, collect, receive, 
              hold, pool, or process Customer funds.
            </p>
            <p>
              All payment processing, settlement, refund execution, and related financial operations are 
              undertaken exclusively by the Partner Bank and/or Payment Aggregator in accordance with applicable 
              laws and regulatory guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. ROLE AND RESPONSIBILITY CLARIFICATION</h2>
            <p>The Parties acknowledge and agree that the roles and responsibilities in relation to refunds and cancellations are allocated as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Company acts solely as a technology intermediary and does not participate in payment processing or fund settlement. The Company does not initiate, approve, process, or execute refunds and shall not be responsible for any financial liability arising therefrom.</li>
              <li>The Merchant is solely responsible for the provision of goods and/or services to Customers and shall have the exclusive authority and responsibility to determine refund eligibility, approve refund requests, and initiate refund instructions.</li>
              <li>The Partner Bank and/or Payment Aggregator is solely responsible for processing refund instructions received from the Merchant and for crediting the applicable amount to the Customer's original payment instrument.</li>
            </ul>
            <p>Accordingly, all refund-related liabilities shall rest exclusively with the Merchant, and the Company shall have no liability in respect of refund processing, delays, failures, or disputes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. CANCELLATION OF TRANSACTIONS</h2>
            <p>
              A Customer may request cancellation of an order or service directly with the Merchant, subject to the 
              Merchant's applicable cancellation terms and conditions.
            </p>
            <p>
              The acceptance or rejection of any cancellation request shall be at the sole discretion of the Merchant, 
              taking into account the nature of the goods or services, stage of fulfilment, and applicable policies.
            </p>
            <p>
              It is clarified that once a Transaction has been successfully authorised and processed through the 
              Partner Bank or Payment Aggregator, such Transaction cannot be reversed automatically and any 
              monetary reversal shall be effected only through a refund process initiated by the Merchant.
            </p>
            <p>The Company shall have no authority to cancel any Transaction or to reverse any payment.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. REFUND ELIGIBILITY</h2>
            <p>
              Refunds may be initiated by the Merchant in circumstances including, but not limited to, cancellation 
              of orders, non-delivery of goods or services, defective or unsatisfactory products, duplicate 
              transactions, or erroneous charges.
            </p>
            <p>
              The determination of refund eligibility shall be made solely by the Merchant in accordance with its 
              internal policies and applicable laws. The Company does not evaluate or determine refund eligibility.
            </p>
            <p>
              The Merchant shall ensure that its refund terms are clearly communicated to Customers prior to 
              completion of any Transaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. REFUND TIMELINES</h2>
            <p>
              Refunds shall be processed by the Partner Bank or Payment Aggregator in accordance with applicable 
              regulatory requirements, card network rules, and internal processing timelines.
            </p>
            <p>Indicative timelines for refund processing are as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Unified Payments Interface (UPI): typically within two (2) to five (5) Business Days</li>
              <li>Credit and Debit Cards: typically within five (5) to seven (7) Business Days</li>
              <li>Net Banking: typically within three (3) to seven (7) Business Days</li>
            </ul>
            <p>
              The actual credit of funds to the Customer's account is subject to the processing timelines of the 
              issuing bank or financial institution and may vary accordingly.
            </p>
            <p>
              The Merchant shall appropriately inform Customers that refund timelines are indicative in nature and 
              subject to banking system dependencies. The Company does not guarantee any specific refund timeline.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. MODE OF REFUND</h2>
            <p>
              Refunds shall ordinarily be processed to the original payment method used by the Customer at the 
              time of the Transaction.
            </p>
            <p>
              Any deviation from the original payment method shall be subject to applicable regulatory guidelines 
              and the policies of the Partner Bank or Payment Aggregator.
            </p>
            <p>The Company shall not process or facilitate any cash refunds.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. CHARGEBACKS AND DISPUTES</h2>
            <p>
              Customers may raise disputes or initiate chargebacks through their issuing bank. Such chargebacks 
              shall be governed by the rules and regulations of the relevant card network or payment system.
            </p>
            <p>
              The Merchant shall be solely responsible for handling chargebacks, including submission of supporting 
              documentation and bearing any financial liability arising therefrom.
            </p>
            <p>
              The Partner Bank or Payment Aggregator may debit the Merchant's account in respect of chargeback 
              amounts in accordance with their agreement.
            </p>
            <p>
              The Company's role shall be limited to facilitating communication and shall not be liable for any 
              chargeback-related losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. CUSTOMER GRIEVANCE REDRESSAL</h2>
            <p>Customers shall address all refund and cancellation requests directly to the Merchant.</p>
            <p>
              The Merchant shall establish and maintain an appropriate grievance redressal mechanism and resolve 
              complaints within reasonable timelines.
            </p>
            <p>
              For issues relating to payment processing, Customers may approach the grievance redressal 
              mechanism of the Partner Bank or Payment Aggregator.
            </p>
            <p>
              The Company may assist in directing queries to the appropriate party but shall not be responsible for 
              resolution of such grievances.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. CONTACT INFORMATION</h2>
            <p>For queries relating to the Platform, Customers and Merchants may contact:</p>
            <p className="font-semibold">IndyPay Technologies Pvt. Ltd.</p>
            <p>Email: <a href="mailto:support@indypay.in" className="text-[#6B46C1] hover:underline">support@indypay.in</a></p>
            <p>Business Hours: Monday to Friday, 10:00 AM to 6:00 PM IST</p>
            <p className="mt-4">
              For refund status or payment-related concerns, Customers are advised to contact the Merchant or 
              the Partner Bank/Payment Aggregator directly.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-12">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
