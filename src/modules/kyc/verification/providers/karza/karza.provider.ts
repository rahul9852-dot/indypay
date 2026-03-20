import { Injectable } from "@nestjs/common";
import {
  IKycVerificationProvider,
  PanVerifyInput,
  PanVerifyResult,
  PanVerifyAddress,
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
      // Re-throw so the service layer can handle it and write a failed
      // audit record before surfacing the error to the controller.
      throw err;
    }

    const verified = raw.statusCode === KARZA_STATUS.SUCCESS;

    this.logger.debug(
      `[KARZA] PAN verify response — statusCode: ${raw.statusCode}, verified: ${verified}`,
    );

    const r = raw.result ?? {};

    // Build address only if at least one field is present.
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

      // All result fields — populated on success, undefined otherwise.
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
}
