// ─── PAN ─────────────────────────────────────────────────────────────────────

export interface PanVerifyInput {
  pan: string;
  /** Regulatory consent flag — must always be "Y". */
  consent: "Y";
}

export interface PanVerifyAddress {
  buildingName?: string;
  locality?: string;
  street?: string;
  pinCode?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface PanVerifyResult {
  verified: boolean;
  providerRequestId: string | null;
  providerStatusCode: number;
  rawResponse: Record<string, any>;

  // Filled only when verified === true
  pan?: string;
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  mobile?: string;
  email?: string;
  aadhaarLinked?: boolean;
  aadhaarMatch?: boolean | null;
  panStatus?: string;
  panIssueDate?: string;
  fatherName?: string;
  isSoleProprietor?: boolean | null;
  isDirector?: boolean | null;
  isSalaried?: boolean | null;
  address?: PanVerifyAddress;
}

// ─── AADHAAR ─────────────────────────────────────────────────────────────────

export interface AadhaarGenerateOtpInput {
  aadhaarNumber: string;
  consent: "Y";
}

export interface AadhaarGenerateOtpResult {
  success: boolean;
  /** Karza requestId — client must echo this back in the verify-otp call. */
  requestId: string | null;
  providerStatusCode: number;
  rawResponse: Record<string, any>;
}

export interface AadhaarVerifyOtpInput {
  otp: string;
  requestId: string;
}

export interface AadhaarAddress {
  careOf?: string;
  house?: string;
  landmark?: string;
  locality?: string;
  street?: string;
  pinCode?: string;
  district?: string;
  state?: string;
  country?: string;
}

export interface AadhaarVerifyOtpResult {
  verified: boolean;
  providerRequestId: string | null;
  providerStatusCode: number;
  rawResponse: Record<string, any>;

  // Filled only when verified === true
  name?: string;
  dob?: string;
  gender?: string;
  mobileLinked?: boolean;
  address?: AadhaarAddress;
}

// ─── GST ─────────────────────────────────────────────────────────────────────

export interface GstVerifyInput {
  gstin: string;
  consent: "Y";
}

export interface GstVerifyResult {
  verified: boolean;
  providerRequestId: string | null;
  providerStatusCode: number;
  rawResponse: Record<string, any>;

  // Filled only when verified === true
  gstin?: string;
  tradeName?: string;
  legalName?: string;
  gstinStatus?: string;
  registrationDate?: string;
  businessType?: string;
  principalPlaceOfBusiness?: string;
}

// ─── BANK (penny-drop) ────────────────────────────────────────────────────────

export interface BankVerifyInput {
  accountNumber: string;
  ifsc: string;
  consent: "Y";
}

export interface BankVerifyResult {
  verified: boolean;
  /** true if beneficiary name matches the KYC name on record. */
  match: boolean;
  providerRequestId: string | null;
  providerStatusCode: number;
  rawResponse: Record<string, any>;

  // Filled only when verified === true
  beneficiaryName?: string;
  bankTransactionStatus?: string;
}

// ─── Provider contract ────────────────────────────────────────────────────────

/**
 * Contract every KYC verification provider must satisfy.
 * Swap Karza for any other bureau (e.g. Signzy, IDfy) by providing a new
 * class that implements this interface — zero changes to service/controller.
 */
export interface IKycVerificationProvider {
  verifyPan(input: PanVerifyInput): Promise<PanVerifyResult>;
  generateAadhaarOtp(
    input: AadhaarGenerateOtpInput,
  ): Promise<AadhaarGenerateOtpResult>;
  verifyAadhaarOtp(
    input: AadhaarVerifyOtpInput,
  ): Promise<AadhaarVerifyOtpResult>;
  verifyGst(input: GstVerifyInput): Promise<GstVerifyResult>;
  verifyBank(input: BankVerifyInput): Promise<BankVerifyResult>;
}

export const KYC_PROVIDER_TOKEN = "KYC_VERIFICATION_PROVIDER";
