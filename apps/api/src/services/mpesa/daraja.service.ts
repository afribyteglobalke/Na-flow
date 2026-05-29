import { loadEnv } from "../../config/env.js";

interface StkPushInput {
  phone: string;
  amountKes: number;
  accountReference: string;
  transactionDescription: string;
}

interface StkPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export async function initiateStkPush(input: StkPushInput): Promise<StkPushResult> {
  const env = loadEnv();
  const missing = [
    ["MPESA_CONSUMER_KEY", env.MPESA_CONSUMER_KEY],
    ["MPESA_CONSUMER_SECRET", env.MPESA_CONSUMER_SECRET],
    ["MPESA_SHORTCODE", env.MPESA_SHORTCODE],
    ["MPESA_PASSKEY", env.MPESA_PASSKEY],
    ["MPESA_CALLBACK_URL", env.MPESA_CALLBACK_URL]
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`Missing Daraja configuration: ${missing.map(([key]) => key).join(", ")}`);
  }

  const baseUrl = env.MPESA_ENVIRONMENT === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
  const accessToken = await fetchAccessToken(baseUrl, env.MPESA_CONSUMER_KEY!, env.MPESA_CONSUMER_SECRET!);
  const timestamp = createDarajaTimestamp();
  const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`).toString("base64");

  const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(input.amountKes),
      PartyA: normalizeSafaricomPhone(input.phone),
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: normalizeSafaricomPhone(input.phone),
      CallBackURL: env.MPESA_CALLBACK_URL,
      AccountReference: input.accountReference,
      TransactionDesc: input.transactionDescription
    })
  });

  const payload = await response.json() as {
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    CustomerMessage?: string;
    errorMessage?: string;
  };

  if (!response.ok || payload.errorMessage) {
    throw new Error(payload.errorMessage ?? `Daraja STK push failed with ${response.status}`);
  }

  return {
    checkoutRequestId: payload.CheckoutRequestID ?? "unknown",
    merchantRequestId: payload.MerchantRequestID ?? "unknown",
    responseCode: payload.ResponseCode ?? "0",
    responseDescription: payload.ResponseDescription ?? "STK request accepted",
    customerMessage: payload.CustomerMessage ?? "STK push sent"
  };
}

async function fetchAccessToken(baseUrl: string, consumerKey: string, consumerSecret: string): Promise<string> {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  const payload = await response.json() as { access_token?: string; errorMessage?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.errorMessage ?? "Could not get Daraja access token");
  }

  return payload.access_token;
}

function normalizeSafaricomPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

function createDarajaTimestamp(): string {
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
