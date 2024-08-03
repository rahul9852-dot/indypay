import { ulid } from "ulid";

export const getUlidId = (prefix = "pb") => `${prefix}_${ulid()}`;
