import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TermsOfUse() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-[#6B46C1] mb-8">Terms of Use</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. DEFINITIONS</h2>
            <p>For the purposes of these Terms of Use, the following terms shall have the meanings ascribed to them below:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"Company"</strong> shall mean IndyPay Technologies Pvt. Ltd., a company incorporated under 
              the provisions of the Companies Act, 2013, and having its registered office in India.</li>
              <li><strong>"Platform"</strong> shall mean the technology infrastructure owned, developed, or made available by 
              the Company, including but not limited to its website, applications, dashboards, application 
              programming interfaces (APIs), software development kits (SDKs), and any associated 
              integrations or systems.</li>
              <li><strong>"User"</strong> shall mean any natural person, legal entity, or organisation that accesses, registers on, 
              or uses the Platform in any manner.</li>
              <li><strong>"Merchant"</strong> shall mean a User who utilises the Platform for the purpose of onboarding with 
              Partner Banks and/or Payment Aggregators to enable acceptance of digital payments.</li>
              <li><strong>"Partner Bank" / "Payment Aggregator (PA)"</strong> shall mean banks or entities duly authorised by 
              the Reserve Bank of India to provide payment aggregation and related regulated financial 
              services.</li>
              <li><strong>"Applicable Law"</strong> shall mean all applicable statutes, laws, regulations, rules, guidelines, 
              circulars, and directions in force in India, including but not limited to those issued by the 
              Reserve Bank of India, the Digital Personal Data Protection Act, 2023, the Information 
              Technology Act, 2000, and the Prevention of Money Laundering Act, 2002, as amended from 
              time to time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. ACCEPTANCE OF TERMS</h2>
            <p>By accessing, browsing, registering on, or otherwise using the Platform, the User hereby:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>expressly agrees to be legally bound by these Terms of Use, as may be amended from time to time;</li>
              <li>represents and warrants that it has read, understood, and accepted these Terms in their entirety; and</li>
              <li>undertakes to comply with all Applicable Laws, regulations, and guidelines in connection with its use of the Platform.</li>
            </ul>
            <p>If the User does not agree to these Terms, the User must immediately discontinue access to and use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. REGULATORY STATUS AND ROLE OF THE COMPANY</h2>
            <p>
              The Company operates strictly in the capacity of a Technology Service Provider ("TSP"), providing 
              technology enablement services to facilitate interaction between Users and Partner Banks and/or 
              Payment Aggregators.
            </p>
            <p>The Company expressly represents and warrants that it:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>does not hold a Payment Aggregator authorisation or licence issued by the Reserve Bank of India;</li>
              <li>does not operate or manage a payment system within the meaning of applicable laws;</li>
              <li>does not, at any time, collect, receive, hold, pool, process, or settle funds belonging to Users or end customers;</li>
              <li>does not operate, maintain, or have access to any escrow or nodal accounts; and</li>
              <li>does not undertake underwriting, credit assessment, approval, or assumption of financial or transactional risk.</li>
            </ul>
            <p>
              All regulated financial and payment-related activities shall be undertaken exclusively by duly 
              authorised Partner Banks and/or Payment Aggregators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. USER OBLIGATIONS</h2>
            <p>The User shall, at all times, comply with the following obligations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>provide true, accurate, complete, and up-to-date information and promptly update the same in the event of any change;</li>
              <li>maintain the confidentiality and security of all login credentials, API keys, and access tokens;</li>
              <li>use the Platform strictly for lawful purposes and in accordance with these Terms;</li>
              <li>ensure that its use of the Platform does not adversely affect the integrity, security, performance, or functionality of the Platform;</li>
              <li>immediately notify the Company of any unauthorised access, security breach, or misuse of its account or credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. LIMITATION OF LIABILITY</h2>
            <p>
              To the maximum extent permitted under Applicable Law, the Company, its directors, officers, 
              employees, affiliates, and agents shall not be liable for any indirect, incidental, special, exemplary, or consequential damages.
            </p>
            <p>
              The Company shall not be liable for any losses, damages, or claims arising out of or in connection with 
              third-party services, payment failures, or regulatory actions beyond its control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. GRIEVANCE REDRESSAL</h2>
            <p>In accordance with Applicable Law, the Company has appointed a Grievance Officer:</p>
            <p className="font-semibold">Grievance Officer</p>
            <p>IndyPay Technologies Pvt. Ltd.</p>
            <p>Email: <a href="mailto:support@indypay.in" className="text-[#6B46C1] hover:underline">support@indypay.in</a></p>
            <p>
              The Company shall acknowledge receipt of any grievance within forty-eight (48) hours of receipt and 
              use commercially reasonable efforts to resolve such grievance within fifteen (15) working days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. GOVERNING LAW AND JURISDICTION</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without 
              regard to its conflict of law principles.
            </p>
            <p>
              Subject to Applicable Law, the courts at Bangalore, Karnataka shall have exclusive jurisdiction 
              over any disputes, claims, or proceedings arising out of or in connection with these Terms or the use 
              of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. AMENDMENTS</h2>
            <p>
              The Company reserves the right, at its sole discretion, to modify, amend, or update these Terms 
              at any time to reflect changes in business practices, technology, or Applicable Law.
            </p>
            <p>
              Any such amendments shall become effective upon publication on the Platform or upon such 
              date as may be specified by the Company.
            </p>
            <p>
              The User's continued access to or use of the Platform after the publication of amended Terms 
              shall constitute the User's deemed acceptance of such amendments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. CONTACT INFORMATION</h2>
            <p>For queries relating to the Platform, Customers and Merchants may contact:</p>
            <p className="font-semibold">IndyPay Technologies Pvt. Ltd.</p>
            <p>Email: <a href="mailto:support@indypay.in" className="text-[#6B46C1] hover:underline">support@indypay.in</a></p>
            <p>Business Hours: Monday to Friday, 10:00 AM to 6:00 PM IST</p>
          </section>

          <p className="text-sm text-gray-500 mt-12">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
