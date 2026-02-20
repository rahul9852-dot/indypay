import { ACCOUNT_STATUS } from "@/enums";

export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: "Internal server error!",
  UNAUTHORIZE: "Access Denied: Unauthorized",
  BAD_REQUEST: "Bad request. Please try again.",
  PAYMENT_LINK_EXPIRED: "Payment link has expired",
  accountStatusMsg: (status: ACCOUNT_STATUS) => {
    let msgStr: string;

    switch (status) {
      case ACCOUNT_STATUS.BLOCKED:
        msgStr = "Your account is blocked";
        break;
      case ACCOUNT_STATUS.DELETED:
        msgStr = "Your account is deleted";
        break;
      case ACCOUNT_STATUS.INACTIVE:
        msgStr = "Your account is inactive";
        break;
      case ACCOUNT_STATUS.SUSPENDED:
        msgStr = "Your account is suspended";
        break;
      case ACCOUNT_STATUS.TEST_DELETED:
        msgStr = "Your testing account is deleted";
        break;
    }

    return msgStr;
  },
};

export const SUCCESS_MESSAGES = {
  HEALTHY: "Healthy!",
  DATA_RECEIVED: "Data Received",
};
