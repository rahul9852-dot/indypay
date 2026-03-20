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
  /** Provider's own request ID — echoed in the audit record. */
  providerRequestId: string | null;
  /** Raw numeric status returned by the provider. */
  providerStatusCode: number;
  /** Full response payload — stored as-is in the audit table. */
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

/**
 * Contract every KYC verification provider must satisfy.
 * Swap Karza for any other bureau (e.g. Signzy, IDfy) by providing a new
 * class that implements this interface — zero changes to service/controller.
 */
export interface IKycVerificationProvider {
  verifyPan(input: PanVerifyInput): Promise<PanVerifyResult>;
}

export const KYC_PROVIDER_TOKEN = "KYC_VERIFICATION_PROVIDER";
