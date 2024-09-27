export interface IExternalPaymentResponse {
  timestamp: string;
  statusCode: number;
  status: string;
  message: string;
  success: boolean;
  data: {
    orderId: string;
    txnRefId: string;
    paymentUrl: string;
  };
}
