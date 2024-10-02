import { ulid } from "ulid";
import { PAYMENT_STATUS } from "@/enums/payment.enum";

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
    case "IN_PROGRESS":
      return PAYMENT_STATUS.PENDING;
    case "SUCCESS":
      return PAYMENT_STATUS.SUCCESS;
    case "FAILED":
      return PAYMENT_STATUS.FAILED;
    case "TAMPERED":
      return PAYMENT_STATUS.TAMPERED;
    case "DUPLICATE":
      return PAYMENT_STATUS.DUPLICATE;
  }
};
