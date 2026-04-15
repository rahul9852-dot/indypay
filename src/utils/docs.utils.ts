import { upiqr } from "./upiqr.util";

export const generateDummyPaymentUrl = async ({
  amount,
}: {
  amount: string;
}) => {
  const QRCode = await require("qrcode");

  return await upiqr({
    payeeName: "Rupeeflow Test",
    payeeVPA: "pg-test@rupeeflow",
    amount,
    QRCode,
  });
};
