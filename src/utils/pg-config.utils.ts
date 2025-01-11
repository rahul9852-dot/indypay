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
