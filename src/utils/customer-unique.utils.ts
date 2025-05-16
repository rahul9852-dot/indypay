import { ID_TYPE } from "@/enums";

export default function customerUniqueGenerate(custUniqRef: string) {
  const settlementOrderId = custUniqRef.startsWith(ID_TYPE.SETTLEMENT_PAYOUT);
  const payoutOrderId = custUniqRef.startsWith(ID_TYPE.MERCHANT_PAYOUT);

  let order_id = custUniqRef;
  let isSettlement = false;
  let isPayout = false;
  if (settlementOrderId) {
    order_id = custUniqRef.slice(0, 4) + "_" + custUniqRef.slice(4);
    isSettlement = true;
  } else if (payoutOrderId) {
    order_id = custUniqRef.slice(0, 5) + "_" + custUniqRef.slice(5);
    isPayout = true;
  }

  return { order_id, isSettlement, isPayout };
}
