import "server-only";
import crypto from "node:crypto";

// Cliente mínimo de la API REST de Mercado Pago (Checkout Pro + split de pagos 1:1 para el marketplace).
const API = "https://api.mercadopago.com";

export function mpEnabled() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/** El marketplace necesita además las credenciales de la aplicación para conectar vendedores (OAuth). */
export function mpMarketplaceEnabled() {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET);
}

async function mpFetch<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${init?.token ?? process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type PreferenceInput = {
  orderId: string;
  orderNumber: number;
  items: { id: string; title: string; quantity: number; unit_price: number }[];
  payer: { name: string; email: string };
  siteUrl: string;
  /** token del vendedor: el cobro entra a su cuenta y la página retiene marketplaceFee */
  sellerToken?: string;
  marketplaceFee?: number;
};

export async function createPreference(input: PreferenceInput) {
  const back = `${input.siteUrl}/checkout/resultado?order=${input.orderId}`;
  const isPublic = input.siteUrl.startsWith("https://");
  const body = {
    items: input.items.map((i) => ({ ...i, currency_id: "ARS" })),
    payer: { name: input.payer.name, email: input.payer.email },
    external_reference: input.orderId,
    statement_descriptor: `PEDIDO ${input.orderNumber}`.slice(0, 22),
    back_urls: { success: back, pending: back, failure: back },
    // MP no acepta auto_return ni notification_url apuntando a localhost.
    // El id del pedido viaja en la URL para saber con qué cuenta consultar el pago.
    ...(isPublic
      ? {
          auto_return: "approved",
          notification_url: `${input.siteUrl}/api/webhooks/mercadopago?order=${input.orderId}`,
        }
      : {}),
    ...(input.sellerToken && input.marketplaceFee ? { marketplace_fee: input.marketplaceFee } : {}),
    payment_methods: { installments: Number(process.env.MP_MAX_INSTALLMENTS || 12) },
  };
  return mpFetch<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "X-Idempotency-Key": input.orderId },
    token: input.sellerToken,
  });
}

export type MpPayment = {
  id: number;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded | charged_back
  external_reference: string | null;
  payment_type_id: string;
  payment_method_id: string;
  installments: number;
  transaction_amount: number;
};

export async function getPayment(id: string, token?: string) {
  return mpFetch<MpPayment>(`/v1/payments/${encodeURIComponent(id)}`, { token });
}

// ---------- OAuth: los vendedores conectan su cuenta de Mercado Pago ----------

export function oauthRedirectUri(siteUrl: string) {
  return `${siteUrl}/api/mercadopago/oauth`;
}

export function oauthAuthorizeUrl(siteUrl: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.MP_CLIENT_ID ?? "",
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: oauthRedirectUri(siteUrl),
  });
  return `https://auth.mercadopago.com.ar/authorization?${params}`;
}

type OAuthToken = { access_token: string; refresh_token: string; user_id: number; expires_in: number };

export async function oauthToken(params: { code: string; siteUrl: string } | { refreshToken: string }) {
  const body =
    "code" in params
      ? { grant_type: "authorization_code", code: params.code, redirect_uri: oauthRedirectUri(params.siteUrl) }
      : { grant_type: "refresh_token", refresh_token: params.refreshToken };
  return mpFetch<OAuthToken>("/oauth/token", {
    method: "POST",
    body: JSON.stringify({ client_id: process.env.MP_CLIENT_ID, client_secret: process.env.MP_CLIENT_SECRET, ...body }),
  });
}

/** Valida el header x-signature de los webhooks. Sin secreto configurado no se valida. */
export function validWebhookSignature(headers: Headers, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const signature = headers.get("x-signature") || "";
  const requestId = headers.get("x-request-id") || "";
  const parts = Object.fromEntries(signature.split(",").map((p) => p.trim().split("=")));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
