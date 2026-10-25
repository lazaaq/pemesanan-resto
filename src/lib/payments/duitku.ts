import { createHmac, timingSafeEqual } from "node:crypto";

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseBoolean(value: string | undefined) {
  return value === "true";
}

function parseExpiryPeriod(value: string | undefined) {
  const parsed = Number(value ?? "60");

  return [5, 10, 60].includes(parsed) ? parsed : 60;
}

export function getDuitkuServerConfig() {
  return {
    merchantCode: requireEnv(
      "DUITKU_MERCHANT_CODE",
      process.env.DUITKU_MERCHANT_CODE,
    ),
    apiKey: requireEnv("DUITKU_API_KEY", process.env.DUITKU_API_KEY),
    isProduction: parseBoolean(process.env.DUITKU_IS_PRODUCTION),
    expiryPeriod: parseExpiryPeriod(process.env.DUITKU_EXPIRY_PERIOD),
  };
}

export function getDuitkuCreateInvoiceUrl(isProduction: boolean) {
  return isProduction
    ? "https://api-prod.duitku.com/api/merchant/createInvoice"
    : "https://api-sandbox.duitku.com/api/merchant/createInvoice";
}

export function createDuitkuInvoiceSignature(
  merchantCode: string,
  timestamp: string,
  apiKey: string,
) {
  return createHmac("sha256", apiKey)
    .update(`${merchantCode}${timestamp}`)
    .digest("hex");
}

export function createDuitkuCallbackSignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  apiKey: string,
) {
  return createHmac("sha256", apiKey)
    .update(`${merchantCode}${amount}${merchantOrderId}`)
    .digest("hex");
}

export function hasMatchingDuitkuSignature(
  receivedSignature: string,
  expectedSignature: string,
) {
  const received = Buffer.from(receivedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function isDuitkuPaymentUrl(value: string, isProduction: boolean) {
  const expectedOrigin = isProduction
    ? "https://app-prod.duitku.com"
    : "https://app-sandbox.duitku.com";

  try {
    return new URL(value).origin === expectedOrigin;
  } catch {
    return false;
  }
}
