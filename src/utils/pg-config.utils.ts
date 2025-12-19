import * as crypto from "crypto";
import { NXT } from "@/constants/external-api.constant";

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
      "Content-Type": "application/x-www-form-urlencoded",
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

export const getKDSConfig = ({ clientId, clientSecret }) => {
  return {
    headers: {
      "Content-Type": "application/json",
      "Client-ID": clientId,
      "Client-Secret": clientSecret,
    },
  };
};

function generateRequestId() {
  const nonce =
    "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);

  return nonce;
}

function generateSignature(method, path, timestamp, body, secret) {
  const payload = `${method}|${path}|${timestamp}|${body}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature;
}

export const getConfigNxt = ({ payload, secret }) => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const currentTimestampStr = currentTimestamp.toString();

  const requestId = generateRequestId();

  const method = "POST";
  const path = NXT.PAYIN.LIVE;

  const bodyString = JSON.stringify(payload);
  const signature = generateSignature(
    method,
    path,
    currentTimestampStr,
    bodyString,
    secret,
  );

  return {
    requestId,
    signature,
    timestamp: currentTimestamp,
  };
};
