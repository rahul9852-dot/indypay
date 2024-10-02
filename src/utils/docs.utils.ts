import { upiqr } from "./upiqr.util";

export const generateDummyPaymentUrl = async ({
  amount,
}: {
  amount: string;
}) => {
  const QRCode = await require("qrcode");

  return await upiqr({
    payeeName: "Paybolt Test",
    payeeVPA: "pg-test@paybolt",
    amount,
    QRCode,
  });
};
