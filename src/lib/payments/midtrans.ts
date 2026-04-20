function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseBoolean(value: string | undefined) {
  return value === "true";
}

export function getMidtransServerConfig() {
  return {
    merchantId: requireEnv("MIDTRANS_MERCHANT_ID", process.env.MIDTRANS_MERCHANT_ID),
    serverKey: requireEnv("MIDTRANS_SERVER_KEY", process.env.MIDTRANS_SERVER_KEY),
    isProduction: parseBoolean(process.env.MIDTRANS_IS_PRODUCTION),
  };
}

export function getMidtransClientConfig() {
  return {
    clientKey: requireEnv(
      "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    ),
    isProduction: parseBoolean(process.env.MIDTRANS_IS_PRODUCTION),
  };
}

export function getMidtransSnapApiUrl(isProduction: boolean) {
  return isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

export function getMidtransSnapScriptUrl(isProduction: boolean) {
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function createMidtransBasicAuthHeader(serverKey: string) {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}
