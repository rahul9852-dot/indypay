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

export const generateLockAccountKey = (mobile: string) => {
  return `lock_${mobile}`;
};

export const generateAttemptsKey = (mobile: string) => {
  return `attempts_${mobile}`;
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
    case "success":
      return INVOICE_STATUS.SENT;
    default:
      return INVOICE_STATUS.DRAFT;
  }
};
