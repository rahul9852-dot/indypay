import { ulid } from "ulid";

export const getUlidId = (prefix = "pb") => `${prefix}_${ulid()}`;

export const generateOtp = (length = 6) =>
  Math.random()
    .toString(36)
    .substring(2, length + 2)
    .toUpperCase();
