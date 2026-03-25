const MIDTRANS_SANDBOX_URL = "https://app.sandbox.midtrans.com"
const MIDTRANS_PRODUCTION_URL = "https://app.midtrans.com"

export type MidtransConfig = {
  merchantId: string
  clientKey: string
  serverKey: string
  isProduction: boolean
  baseUrl: string
  snapJsUrl: string
}

export type MidtransConfigResult =
  | { ok: true; config: MidtransConfig }
  | { ok: false; message: string }

const getConfiguredProductionFlag = () => {
  return process.env.MIDTRANS_IS_PRODUCTION?.trim() === "true"
}

const keyLooksSandbox = (value: string) => value.startsWith("SB-")

export const getMidtransConfig = (): MidtransConfigResult => {
  const merchantId = process.env.MIDTRANS_MERCHANT_ID?.trim() ?? ""
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? ""
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim() ?? ""

  if (!merchantId || !clientKey || !serverKey) {
    return {
      ok: false,
      message: "Midtrans credentials are incomplete in environment variables.",
    }
  }

  const isProduction = getConfiguredProductionFlag()
  const sandboxKeyDetected = keyLooksSandbox(clientKey) || keyLooksSandbox(serverKey)

  if (!isProduction && !sandboxKeyDetected) {
    return {
      ok: false,
      message:
        "Midtrans is configured for Sandbox, but the current Client/Server Key looks like Production. Use Sandbox keys or set MIDTRANS_IS_PRODUCTION=true.",
    }
  }

  if (isProduction && sandboxKeyDetected) {
    return {
      ok: false,
      message:
        "Midtrans is configured for Production, but the current Client/Server Key looks like Sandbox. Use Production keys or set MIDTRANS_IS_PRODUCTION=false.",
    }
  }

  const baseUrl = isProduction ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL

  return {
    ok: true,
    config: {
      merchantId,
      clientKey,
      serverKey,
      isProduction,
      baseUrl,
      snapJsUrl: `${baseUrl}/snap/snap.js`,
    },
  }
}

export const getMidtransBasicAuthHeader = (serverKey: string) => {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`
}
