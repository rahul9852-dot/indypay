import { ulid } from "ulid";
import * as dayjs from "dayjs";
import { PAYMENT_STATUS } from "@/enums/payment.enum";
import { INVOICE_STATUS, ONBOARDING_STATUS } from "@/enums";
import { appConfig } from "@/config/app.config";

export const getUlidId = (prefix = "pb") => `${prefix}_${ulid()}`;

export const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString().padStart(length, "0");
};

export const convertExternalPaymentStatusToInternal = (status: string) => {
  switch (status) {
    case "PENDING":
      return PAYMENT_STATUS.PENDING;
    case "CREATED":
      return PAYMENT_STATUS.PENDING;
    case "IN_PROGRESS":
      return PAYMENT_STATUS.PENDING;
    case "SUCCESS":
      return PAYMENT_STATUS.SUCCESS;
    case "SUCCESSFUL":
      return PAYMENT_STATUS.SUCCESS;
    case "PROCESSED":
      return PAYMENT_STATUS.SUCCESS;
    case "REJECTED":
      return PAYMENT_STATUS.FAILED;
    case "200":
      return PAYMENT_STATUS.SUCCESS;
    case "PAID":
      return PAYMENT_STATUS.SUCCESS;
    case "REJECTED":
      return PAYMENT_STATUS.REJECTED;
    case "400":
      return PAYMENT_STATUS.FAILED;
    case "FAILED":
      return PAYMENT_STATUS.FAILED;
    case "FAIL":
      return PAYMENT_STATUS.FAILED;
    case "ERROR":
      return PAYMENT_STATUS.FAILED;
    case "TAMPERED":
      return PAYMENT_STATUS.TAMPERED;
    case "DUPLICATE":
      return PAYMENT_STATUS.DUPLICATE;
    case "DENIED":
      return PAYMENT_STATUS.DENIED;
    case "REFUNDED":
      return PAYMENT_STATUS.REFUNDED;
    case "TAMPERED":
      return PAYMENT_STATUS.TAMPERED;
    default:
      return PAYMENT_STATUS.PENDING;
  }
};

export const generateLockAccountKey = (identifier: string) => {
  return `lock_${identifier}`;
};

export const generateAttemptsKey = (identifier: string) => {
  return `attempts_${identifier}`;
};

export const formatTime = (date: Date) => {
  const formattedDate = dayjs(date).format("hh:mm A");

  return formattedDate;
};

export const formatDateTime = (date: Date) => {
  const formattedDate = dayjs(date).format("DD MMM YYYY hh:mm A");

  return formattedDate;
};

export const getCheckoutUrl = (payinId: string) =>
  `${appConfig().beBaseUrl}/api/v1/payments/redirect/payment-link/${payinId}`;

export const getOnboardingStatus = (status: ONBOARDING_STATUS) => {
  switch (status) {
    case ONBOARDING_STATUS.KYC_PENDING:
      return "pending";
    case ONBOARDING_STATUS.KYC_VERIFIED:
      return "completed";
    case ONBOARDING_STATUS.KYC_REJECTED:
      return "rejected";
    case ONBOARDING_STATUS.KYC_ON_HOLD:
      return "onHold";
    default:
      return "signUp";
  }
};

export const getInvoiceStatus = (status: INVOICE_STATUS) => {
  switch (status) {
    case INVOICE_STATUS.DRAFT:
      return "draft";
    case INVOICE_STATUS.FAILED:
      return "failed";
    case INVOICE_STATUS.SENT:
      return "sent";
    case INVOICE_STATUS.VIEWED:
      return "viewed";
    case INVOICE_STATUS.PAID:
      return "paid";
    case INVOICE_STATUS.OVERDUE:
      return "overdue";
    case INVOICE_STATUS.CANCELLED:
      return "cancelled";
    default:
      return "draft";
  }
};

export const getInvoiceStatusForQuery = (status: string) => {
  switch (status) {
    case "draft":
      return INVOICE_STATUS.DRAFT;
    case "failed":
      return INVOICE_STATUS.FAILED;
    case "sent":
    case "success":
      return INVOICE_STATUS.SENT;
    case "viewed":
      return INVOICE_STATUS.VIEWED;
    case "paid":
      return INVOICE_STATUS.PAID;
    case "overdue":
      return INVOICE_STATUS.OVERDUE;
    case "cancelled":
      return INVOICE_STATUS.CANCELLED;
    default:
      return INVOICE_STATUS.DRAFT;
  }
};

/**
 * Decodes the Indian state from the first two digits of a GSTIN.
 * Falls back to "Karnataka" (Rupeeflow's registered state) when GSTIN is absent.
 */
export const getStateFromGstin = (gstin?: string | null): string => {
  if (!gstin || gstin.length < 2) return "Karnataka";

  const stateCodeMap: Record<string, string> = {
    "01": "Jammu & Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman & Diu",
    "26": "Dadra & Nagar Haveli",
    "27": "Maharashtra",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman & Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
  };

  const code = gstin.substring(0, 2);

  return stateCodeMap[code] ?? "Karnataka";
};
