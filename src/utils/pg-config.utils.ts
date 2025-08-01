export const getIsmartPayPgConfig = ({ clientId, clientSecret }) => {
  return {
    headers: {
      "Content-Type": "application/json",
      mid: clientId,
      key: clientSecret,
    },
  };
};

export const getFlakPayPgConfig = ({ clientId, clientSecret }) => {
  return {
    headers: {
      "Content-Type": "application/json",
      "client-id": clientId,
      "secret-key": clientSecret,
    },
  };
};

export const getEritechPgConfig = ({ token, merchantId }) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      merchantid: merchantId,
    },
  };
};

export const getDiaspayConfig = ({ token }) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

export const getUtkarshPgConfig = ({ mid, terminalId }) => {
  return {
    headers: {
      "Content-Type": "application/json",
      mid,
      terminalId,
    },
  };
};
