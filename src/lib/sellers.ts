import "server-only";
import type { Prisma, Seller } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { decrypt, encrypt } from "./crypto";
import { db } from "./db";
import { mpEnabled, oauthToken } from "./mercadopago";

/** Modo demo: sin credenciales de Mercado Pago los vendedores pueden vender sin conectar su cuenta. */
export function demoPayments() {
  return !mpEnabled() && (process.env.NODE_ENV !== "production" || process.env.PAYMENTS_DEMO === "true");
}

export function sellerCanSell(seller: Pick<Seller, "status" | "mpAccessToken">) {
  return seller.status === "ACTIVE" && (Boolean(seller.mpAccessToken) || demoPayments());
}

/**
 * Filtro de productos visibles en la tienda: los de la tienda y los de vendedores activos
 * que ya pueden cobrar.
 */
export function visibleProductWhere(): Prisma.ProductWhereInput {
  return {
    active: true,
    OR: [
      { sellerId: null },
      { seller: { status: "ACTIVE", ...(demoPayments() ? {} : { mpAccessToken: { not: null } }) } },
    ],
  };
}

/** Exige un usuario con perfil de vendedor; si no lo tiene, lo manda a crearlo. */
export async function requireSeller() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vender/panel");
  const seller = await db.seller.findUnique({ where: { userId: user.id } });
  if (!seller) redirect("/vender/alta");
  return { user, seller };
}

export async function saveSellerTokens(sellerId: string, t: { access_token: string; refresh_token: string; user_id: number; expires_in: number }) {
  await db.seller.update({
    where: { id: sellerId },
    data: {
      mpUserId: String(t.user_id),
      mpAccessToken: encrypt(t.access_token),
      mpRefreshToken: encrypt(t.refresh_token),
      mpTokenExpires: new Date(Date.now() + t.expires_in * 1000),
    },
  });
}

/** Devuelve el access token del vendedor, renovándolo si vence en menos de 7 días. */
export async function sellerAccessToken(seller: Seller) {
  if (!seller.mpAccessToken) return null;
  const soon = Date.now() + 7 * 86400000;
  if (seller.mpRefreshToken && seller.mpTokenExpires && seller.mpTokenExpires.getTime() < soon) {
    try {
      const fresh = await oauthToken({ refreshToken: decrypt(seller.mpRefreshToken) });
      await saveSellerTokens(seller.id, fresh);
      return fresh.access_token;
    } catch (err) {
      console.error("[mp] no se pudo renovar el token del vendedor", seller.id, err);
    }
  }
  return decrypt(seller.mpAccessToken);
}

export async function sellerRating(sellerId: string) {
  const agg = await db.review.aggregate({ where: { sellerId }, _avg: { rating: true }, _count: true });
  const sales = await db.order.count({ where: { sellerId, status: "DELIVERED" } });
  return { average: agg._avg.rating, count: agg._count, sales };
}
