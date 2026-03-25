import crypto from "crypto"

import { getMidtransBasicAuthHeader, type MidtransConfig } from "./config"

type MidtransItemDetail = {
  id: string
  price: number
  quantity: number
  name: string
}

type MidtransCustomerDetail = {
  first_name: string
  email?: string
  phone?: string
}

type CreateSnapTransactionInput = {
  config: MidtransConfig
  origin: string
  bookingId: string
  orderId: string
  grossAmount: number
  itemDetails: MidtransItemDetail[]
  customerDetails: MidtransCustomerDetail
}

export type MidtransNotificationPayload = {
  transaction_time?: string
  transaction_status?: string
  transaction_id?: string
  status_message?: string
  status_code?: string
  signature_key?: string
  payment_type?: string
  order_id?: string
  merchant_id?: string
  gross_amount?: string
  fraud_status?: string
  settlement_time?: string
  currency?: string
}

export const createSnapTransaction = async ({
  config,
  origin,
  bookingId,
  orderId,
  grossAmount,
  itemDetails,
  customerDetails,
}: CreateSnapTransactionInput) => {
  const response = await fetch(`${config.baseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: getMidtransBasicAuthHeader(config.serverKey),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: customerDetails,
      callbacks: {
        finish: `${origin}/booking/payment?status=finish&bookingId=${bookingId}`,
        error: `${origin}/booking/payment?status=error&bookingId=${bookingId}`,
        pending: `${origin}/booking/payment?status=pending&bookingId=${bookingId}`,
      },
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error_messages" in payload &&
      Array.isArray((payload as { error_messages?: unknown }).error_messages)
        ? ((payload as { error_messages: string[] }).error_messages[0] ?? "Failed to create payment")
        : "Failed to create payment"

    throw new Error(message)
  }

  return payload as { token: string; redirect_url: string }
}

export const getMidtransTransactionStatus = async (
  config: MidtransConfig,
  orderId: string
) => {
  const response = await fetch(`${config.baseUrl}/v2/${orderId}/status`, {
    headers: {
      Authorization: getMidtransBasicAuthHeader(config.serverKey),
      Accept: "application/json",
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error("Failed to retrieve payment status")
  }

  return payload as MidtransNotificationPayload
}

export const verifyMidtransSignature = (
  payload: MidtransNotificationPayload,
  serverKey: string
) => {
  const orderId = payload.order_id ?? ""
  const statusCode = payload.status_code ?? ""
  const grossAmount = payload.gross_amount ?? ""
  const signatureKey = payload.signature_key ?? ""

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return false
  }

  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex")

  return expected === signatureKey
}

export const mapMidtransPaymentStatus = (payload: MidtransNotificationPayload) => {
  const transactionStatus = payload.transaction_status ?? ""
  const fraudStatus = payload.fraud_status ?? ""

  if (transactionStatus === "capture") {
    return fraudStatus === "challenge" ? "pending" : "paid"
  }

  if (transactionStatus === "settlement") {
    return "paid"
  }

  if (transactionStatus === "pending") {
    return "pending"
  }

  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "failure"
  ) {
    return "failed"
  }

  if (transactionStatus === "expire") {
    return "expired"
  }

  if (transactionStatus === "refund" || transactionStatus === "partial_refund") {
    return "refunded"
  }

  return "pending"
}
