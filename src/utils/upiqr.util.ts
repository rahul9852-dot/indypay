// import QRCode from "qrcode";

type ImageType = "png" | "jpeg";
export type Base64<imageType extends ImageType> =
  `data:image/${imageType};base64${string}`;

export interface IUPIIntentParams {
  payeeVPA: string;
  payeeName: string;
  payeeMerchantCode?: string;
  transactionId?: string;
  transactionRef?: string;
  transactionNote?: string;
  amount?: string;
  minimumAmount?: string;
  currency?: string;
  transactionRefUrl?: string; // Not in use, as of now
  QRCode: any;
}

export interface IQRResult {
  qr: string;
  intent: string;
}

export interface IValidateParams {
  pa: string | undefined;
  pn: string | undefined;
}

const validateParams = ({ pa, pn }: IValidateParams): string => {
  const error = "";

  if (!pa || !pn) return "Virtual Payee's Address/Payee's Name is compulsory";
  if (pa?.length < 5 || pn?.length < 4)
    return "Virtual Payee's Address/Payee's Name is too short.";

  return error;
};

const buildUrl = (url: string, params: Record<string, any>) => {
  let qs = "";

  for (const [key, value] of Object.entries(params)) {
    qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
  }
  if (qs.length > 0) {
    url = url + qs;
  }

  return url;
};

export const upiqr = async ({
  payeeVPA: pa,
  payeeName: pn,
  payeeMerchantCode: mc,
  transactionId: tid,
  transactionRef: tr,
  transactionNote: tn,
  amount: am,
  minimumAmount: mam,
  currency: cu,
}: IUPIIntentParams): Promise<IQRResult> => {
  const QRCode = await require("qrcode");

  return new Promise((resolve, reject) => {
    const error = validateParams({ pa, pn });
    if (error) reject(new Error(error));

    let intent = "upi://pay?";
    if (pa) intent = buildUrl(intent, { pa, pn });
    if (am) intent = buildUrl(intent, { am });
    if (mam) intent = buildUrl(intent, { mam });
    if (cu) intent = buildUrl(intent, { cu });
    if (mc) intent = buildUrl(intent, { mc });
    if (tid) intent = buildUrl(intent, { tid });
    if (tr) intent = buildUrl(intent, { tr }); // tr: transactionRef upto 35 digits
    if (tn) intent = buildUrl(intent, { tn });
    intent = intent.substring(0, intent.length - 1);

    QRCode.toDataURL(intent)
      .then((base64Data: string) =>
        resolve({ qr: base64Data, intent } as IQRResult),
      )
      .catch((err: any) =>
        reject(new Error("Unable to generate UPI QR Code.\n" + err)),
      );
  });
};

export const generateQrCode = async (
  upiIntentUrl: string,
): Promise<Base64<"png">> => {
  const QRCode = await require("qrcode");

  return new Promise((resolve, reject) => {
    QRCode.toDataURL(upiIntentUrl)
      .then((base64Data: Base64<"png">) => resolve(base64Data))
      .catch((err: any) =>
        reject(new Error("Unable to generate QR Code.\n" + err)),
      );
  });
};
