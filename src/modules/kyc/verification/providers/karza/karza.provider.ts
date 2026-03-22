import { Injectable } from "@nestjs/common";
import {
  AadhaarAddress,
  AadhaarGenerateOtpInput,
  AadhaarGenerateOtpResult,
  AadhaarVerifyOtpInput,
  AadhaarVerifyOtpResult,
  BankVerifyInput,
  BankVerifyResult,
  GstVerifyInput,
  GstVerifyResult,
  IKycVerificationProvider,
  PanVerifyAddress,
  PanVerifyInput,
  PanVerifyResult,
} from "../kyc-provider.interface";
import { AxiosService } from "@/shared/axios/axios.service";
import { appConfig } from "@/config/app.config";
import { CustomLogger } from "@/logger";

// Karza status codes — documented in their API reference.
const KARZA_STATUS = {
  SUCCESS: 101,
  INVALID_INPUT: 102,
  CONSENT_MISSING: 105,
} as const;

// ─── Raw response shapes ──────────────────────────────────────────────────────

interface KarzaPanResponse {
  requestId: string;
  statusCode: number;
  statusMessage?: string;
  result: {
    pan?: string;
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    gender?: string;
    dob?: string;
    mobile?: string;
    email?: string;
    panStatus?: string;
    panIssueDate?: string;
    fatherName?: string;
    isSoleProprietor?: boolean | null;
    isDirector?: boolean | null;
    isSalaried?: boolean | null;
    aadhaarLinked?: boolean;
    aadhaarMatch?: boolean | null;
    address?: {
      buildingName?: string;
      locality?: string;
      street?: string;
      pinCode?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
}

interface KarzaAadhaarOtpResponse {
  requestId: string;
  statusCode: number;
  statusMessage?: string;
}

interface KarzaAadhaarVerifyResponse {
  requestId: string;
  statusCode: number;
  statusMessage?: string;
  result?: {
    name?: string;
    dob?: string;
    gender?: string;
    mobileLinked?: boolean;
    address?: {
      careOf?: string;
      house?: string;
      landmark?: string;
      locality?: string;
      street?: string;
      pinCode?: string;
      district?: string;
      state?: string;
      country?: string;
    };
  };
}

interface KarzaGstResponse {
  requestId: string;
  statusCode: number;
  statusMessage?: string;
  result?: {
    gstin?: string;
    tradeName?: string;
    legalName?: string;
    gstinStatus?: string;
    registrationDate?: string;
    businessType?: string;
    principalPlaceOfBusiness?: string;
  };
}

interface KarzaBankResponse {
  requestId: string;
  statusCode: number;
  statusMessage?: string;
  result?: {
    bankTransactionStatus?: string;
    beneficiaryName?: string;
    latestBankTransactionStatus?: string;
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

@Injectable()
export class KarzaProvider implements IKycVerificationProvider {
  private readonly logger = new CustomLogger(KarzaProvider.name);
  private readonly client: AxiosService;

  constructor() {
    const { karza } = appConfig();
    this.client = new AxiosService(karza.baseUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-karza-key": karza.apiKey,
      },
      // 10 s hard cap — Karza's sandbox is fast; in production the KYC
      // flow is user-facing so we must not hang the UI.
      timeout: 10_000,
    });
  }

  // ─── PAN ───────────────────────────────────────────────────────────────────

  async verifyPan(input: PanVerifyInput): Promise<PanVerifyResult> {
    this.logger.debug(`[KARZA] PAN verify request for PAN: ${input.pan}`);

    let raw: KarzaPanResponse;
    try {
      raw = await this.client.postRequest<KarzaPanResponse>("/v3/pan-profile", {
        pan: input.pan.toUpperCase(),
        consent: input.consent,
      });
    } catch (err: any) {
      this.logger.error(
        `[KARZA] Network/HTTP error during PAN verify`,
        err?.message,
      );
      throw err;
    }

    const verified = raw.statusCode === KARZA_STATUS.SUCCESS;

    this.logger.debug(
      `[KARZA] PAN verify response — statusCode: ${raw.statusCode}, verified: ${verified}`,
    );

    const r = raw.result ?? {};

    const address: PanVerifyAddress | undefined =
      r.address && Object.values(r.address).some(Boolean)
        ? {
            buildingName: r.address.buildingName,
            locality: r.address.locality,
            street: r.address.street,
            pinCode: r.address.pinCode,
            city: r.address.city,
            state: r.address.state,
            country: r.address.country,
          }
        : undefined;

    return {
      verified,
      providerRequestId: raw.requestId ?? null,
      providerStatusCode: raw.statusCode,
      rawResponse: raw as unknown as Record<string, any>,

      ...(verified && {
        pan: r.pan,
        name: r.name,
        firstName: r.firstName,
        middleName: r.middleName,
        lastName: r.lastName,
        gender: r.gender,
        dob: r.dob,
        mobile: r.mobile,
        email: r.email,
        panStatus: r.panStatus,
        panIssueDate: r.panIssueDate,
        fatherName: r.fatherName,
        isSoleProprietor: r.isSoleProprietor ?? null,
        isDirector: r.isDirector ?? null,
        isSalaried: r.isSalaried ?? null,
        aadhaarLinked: r.aadhaarLinked,
        aadhaarMatch: r.aadhaarMatch ?? null,
        address,
      }),
    };
  }

  // ─── AADHAAR ───────────────────────────────────────────────────────────────

  async generateAadhaarOtp(
    input: AadhaarGenerateOtpInput,
  ): Promise<AadhaarGenerateOtpResult> {
    const masked = `XXXX-XXXX-${input.aadhaarNumber.slice(-4)}`;
    this.logger.debug(`[KARZA] Aadhaar generate OTP for: ${masked}`);

    let raw: KarzaAadhaarOtpResponse;
    try {
      raw = await this.client.postRequest<KarzaAadhaarOtpResponse>(
        "/v3/aadhaar-generate-otp",
        {
          aadhaarNo: input.aadhaarNumber,
          consent: input.consent,
        },
      );
    } catch (err: any) {
      this.logger.error(
        `[KARZA] Network/HTTP error during Aadhaar OTP generate`,
        err?.message,
      );
      throw err;
    }

    const success = raw.statusCode === KARZA_STATUS.SUCCESS;

    this.logger.debug(
      `[KARZA] Aadhaar OTP generate — statusCode: ${raw.statusCode}, success: ${success}`,
    );

    return {
      success,
      requestId: raw.requestId ?? null,
      providerStatusCode: raw.statusCode,
      rawResponse: raw as unknown as Record<string, any>,
    };
  }

  async verifyAadhaarOtp(
    input: AadhaarVerifyOtpInput,
  ): Promise<AadhaarVerifyOtpResult> {
    this.logger.debug(
      `[KARZA] Aadhaar verify OTP for requestId: ${input.requestId}`,
    );

    let raw: KarzaAadhaarVerifyResponse;
    try {
      raw = await this.client.postRequest<KarzaAadhaarVerifyResponse>(
        "/v3/aadhaar-submit-otp",
        {
          otp: input.otp,
          requestId: input.requestId,
        },
      );
    } catch (err: any) {
      this.logger.error(
        `[KARZA] Network/HTTP error during Aadhaar OTP verify`,
        err?.message,
      );
      throw err;
    }

    const verified = raw.statusCode === KARZA_STATUS.SUCCESS;

    this.logger.debug(
      `[KARZA] Aadhaar OTP verify — statusCode: ${raw.statusCode}, verified: ${verified}`,
    );

    const r = raw.result ?? {};

    const address: AadhaarAddress | undefined =
      r.address && Object.values(r.address).some(Boolean)
        ? {
            careOf: r.address.careOf,
            house: r.address.house,
            landmark: r.address.landmark,
            locality: r.address.locality,
            street: r.address.street,
            pinCode: r.address.pinCode,
            district: r.address.district,
            state: r.address.state,
            country: r.address.country,
          }
        : undefined;

    return {
      verified,
      providerRequestId: raw.requestId ?? null,
      providerStatusCode: raw.statusCode,
      rawResponse: raw as unknown as Record<string, any>,

      ...(verified && {
        name: r.name,
        dob: r.dob,
        gender: r.gender,
        mobileLinked: r.mobileLinked,
        address,
      }),
    };
  }

  // ─── GST ───────────────────────────────────────────────────────────────────

  async verifyGst(input: GstVerifyInput): Promise<GstVerifyResult> {
    this.logger.debug(`[KARZA] GST verify for GSTIN: ${input.gstin}`);

    let raw: KarzaGstResponse;
    try {
      raw = await this.client.postRequest<KarzaGstResponse>("/v3/gstin", {
        gstin: input.gstin.toUpperCase(),
        consent: input.consent,
      });
    } catch (err: any) {
      this.logger.error(
        `[KARZA] Network/HTTP error during GST verify`,
        err?.message,
      );
      throw err;
    }

    const verified = raw.statusCode === KARZA_STATUS.SUCCESS;

    this.logger.debug(
      `[KARZA] GST verify — statusCode: ${raw.statusCode}, verified: ${verified}`,
    );

    const r = raw.result ?? {};

    return {
      verified,
      providerRequestId: raw.requestId ?? null,
      providerStatusCode: raw.statusCode,
      rawResponse: raw as unknown as Record<string, any>,

      ...(verified && {
        gstin: r.gstin,
        tradeName: r.tradeName,
        legalName: r.legalName,
        gstinStatus: r.gstinStatus,
        registrationDate: r.registrationDate,
        businessType: r.businessType,
        principalPlaceOfBusiness: r.principalPlaceOfBusiness,
      }),
    };
  }

  // ─── BANK (penny-drop) ────────────────────────────────────────────────────

  async verifyBank(input: BankVerifyInput): Promise<BankVerifyResult> {
    this.logger.debug(
      `[KARZA] Bank verify — account: XXXX${input.accountNumber.slice(-4)}, IFSC: ${input.ifsc}`,
    );

    let raw: KarzaBankResponse;
    try {
      raw = await this.client.postRequest<KarzaBankResponse>(
        "/v3/bank-account-verify",
        {
          accountNumber: input.accountNumber,
          ifsc: input.ifsc.toUpperCase(),
          consent: input.consent,
        },
      );
    } catch (err: any) {
      this.logger.error(
        `[KARZA] Network/HTTP error during Bank verify`,
        err?.message,
      );
      throw err;
    }

    const verified = raw.statusCode === KARZA_STATUS.SUCCESS;
    const r = raw.result ?? {};

    // Karza returns "SUCCESS" / "FAILED" in bankTransactionStatus.
    const match =
      verified && (r.bankTransactionStatus ?? "").toUpperCase() === "SUCCESS";

    this.logger.debug(
      `[KARZA] Bank verify — statusCode: ${raw.statusCode}, match: ${match}`,
    );

    return {
      verified,
      match,
      providerRequestId: raw.requestId ?? null,
      providerStatusCode: raw.statusCode,
      rawResponse: raw as unknown as Record<string, any>,

      ...(verified && {
        beneficiaryName: r.beneficiaryName,
        bankTransactionStatus: r.bankTransactionStatus,
      }),
    };
  }
}
