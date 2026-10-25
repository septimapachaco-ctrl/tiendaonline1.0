import "server-only";
import type { Coupon } from "@prisma/client";
import { db } from "./db";
import { sendMail } from "./email";
import { money, ORDER_STATUS, variantLabel } from "./format";
import { visibleProductWhere } from "./sellers";
import { site } from "./site";

export type CartLine = { variantId: string; quantity: number };

/** Recalcula el carrito con precios y stock reales de la base. */
export async function priceCart(lines: CartLine[]) {
  const ids = lines.map((l) => l.variantId);
  const variants = await db.variant.findMany({
    // solo productos visibles: la tienda o vendedores habilitados para cobrar
    where: { id: { in: ids }, product: visibleProductWhere() },
    include: {
      product: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, seller: { select: { id: true, displayName: true } } },
      },
    },
  });
  const items = lines.flatMap((line) => {
    const v = variants.find((x) => x.id === line.variantId);
    if (!v || line.quantity < 1) return [];
    return [
      {
        variantId: v.id,
        productId: v.productId,
        productName: v.product.name,
        slug: v.product.slug,
        image: v.product.images[0]?.url ?? null,
        variantName: variantLabel(v),
        unitPrice: v.price ?? v.product.price,
        quantity: Math.min(line.quantity, 99),
        stock: v.stock,
        sellerId: v.product.sellerId,
      },
    ];
  });
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return { items, subtotal };
}

export function couponProblem(coupon: Coupon | null, subtotal: number) {
  if (!coupon || !coupon.active) return "El cupón no existe o no está activo.";
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return "El cupón está vencido.";
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return "El cupón ya alcanzó su límite de usos.";
  if (subtotal < coupon.minTotal) return `El cupón requiere una compra mínima de ${money(coupon.minTotal)}.`;
  return null;
}

export function couponDiscount(coupon: Coupon, subtotal: number) {
  const d = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(d, subtotal);
}

export async function findCoupon(code: string | null | undefined) {
  const clean = code?.trim().toUpperCase();
  if (!clean) return null;
  return db.coupon.findUnique({ where: { code: clean } });
}

export async function nextOrderNumber() {
  const last = await db.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
  return (last?.number ?? 1000) + 1;
}

type PaymentInfo = {
  status: string;
  paymentId?: string;
  paymentMethod?: string;
  installments?: number;
};

/**
 * Aplica el resultado de un pago a un pedido. Es idempotente: el stock y los usos del cupón
 * se descuentan una sola vez, aunque Mercado Pago notifique varias veces.
 */
export async function applyPayment(orderId: string, info: PaymentInfo) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;

  const approved = info.status === "approved";
  const failed = ["rejected", "cancelled", "refunded", "charged_back"].includes(info.status);
  const wasPaid = order.paidAt != null;

  await db.$transaction(async (tx) => {
    let status = order.status;
    if (approved && order.status === "PENDING") status = "PAID";
    if (failed && order.status === "PENDING") status = "CANCELLED";
    if (["refunded", "charged_back"].includes(info.status)) status = "CANCELLED";

    await tx.order.update({
      where: { id: order.id },
      data: {
        status,
        paymentStatus: info.status,
        paymentId: info.paymentId ?? order.paymentId,
        paymentMethod: info.paymentMethod ?? order.paymentMethod,
        installments: info.installments ?? order.installments,
        paidAt: approved && !wasPaid ? new Date() : order.paidAt,
        stockApplied: approved ? true : order.stockApplied,
      },
    });

    if (approved && !order.stockApplied) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.variant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
      }
      // nunca dejar stock negativo si se vendió de más
      await tx.variant.updateMany({ where: { stock: { lt: 0 } }, data: { stock: 0 } });
      if (order.couponId) {
        await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      }
    }
  });

  if (approved && !wasPaid) {
    const refreshed = await db.order.findUnique({
      where: { id: order.id },
      include: { items: true, seller: { include: { user: true } } },
    });
    if (refreshed) {
      await sendMail(refreshed.email, `Tu pedido #${refreshed.number} ya está nadando hacia vos`, orderEmailHtml(refreshed));
      if (refreshed.seller) {
        await sendMail(refreshed.seller.user.email, `¡Vendiste! Pedido #${refreshed.number}`, saleEmailHtml(refreshed));
      }
      if (process.env.ADMIN_NOTIFY_EMAIL) {
        await sendMail(
          process.env.ADMIN_NOTIFY_EMAIL,
          `Nueva venta #${refreshed.number} — ${money(refreshed.total)}`,
          orderEmailHtml(refreshed),
        );
      }
    }
  }
  return order;
}

type OrderForEmail = {
  id: string;
  number: number;
  name: string;
  status: string;
  shippingName: string;
  shippingCost: number;
  discount: number;
  subtotal: number;
  total: number;
  trackingCode?: string | null;
  deliveryMethod?: string;
  deliveryCode?: string | null;
  items: { productName: string; variantName: string; unitPrice: number; quantity: number }[];
};

export function orderEmailHtml(order: OrderForEmail, intro?: string) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td>${i.productName} (${i.variantName}) x${i.quantity}</td><td align="right">${money(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join("");
  return `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:560px;background:#FDFCFB;color:#2B3A55;padding:24px;border-radius:20px">
    <h2 style="color:#2B3A55">🐬 ${site.name}</h2>
    <p>Hola ${order.name},</p>
    <p>${intro ?? `Gracias por elegirnos. Tu pedido <b>#${order.number}</b> está confirmado y ya lo estamos preparando con calma y mucho cuidado.`}</p>
    <p>Estado: <b>${ORDER_STATUS[order.status] ?? order.status}</b></p>
    ${order.trackingCode ? `<p>Código de seguimiento: <b>${order.trackingCode}</b></p>` : ""}
    ${
      order.deliveryMethod === "HAND" && order.deliveryCode && order.status !== "DELIVERED"
        ? `<div style="background:#A8DADC;border-radius:16px;padding:16px;margin:16px 0">
            <p style="margin:0">Elegiste <b>entrega en mano</b>. Tu código de entrega es:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:8px 0">${order.deliveryCode}</p>
            <p style="margin:0;font-size:13px">Dáselo a quien te vende <b>solo cuando tengas el producto en tus manos</b> y lo hayas revisado.</p>
          </div>`
        : ""
    }
    <table width="100%" cellpadding="6" style="border-collapse:collapse">
      ${rows}
      <tr><td>Subtotal</td><td align="right">${money(order.subtotal)}</td></tr>
      ${order.discount ? `<tr><td>Descuento</td><td align="right">-${money(order.discount)}</td></tr>` : ""}
      <tr><td>${order.shippingName}</td><td align="right">${money(order.shippingCost)}</td></tr>
      <tr><td><b>Total</b></td><td align="right"><b>${money(order.total)}</b></td></tr>
    </table>
    <p style="margin:24px 0">
      <a href="${site.url}/pedido/${order.id}" style="background:#8ECAE6;color:#2B3A55;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold;display:inline-block">Ver el estado de mi pedido</a>
    </p>
    <p style="font-size:13px">Podés seguir tu pedido con este enlace, sin necesidad de crear una cuenta. Guardá este email.</p>
    <p style="font-family:Caveat,cursive;font-size:20px">Hecho con calma de mar</p>
  </div>`;
}

type SaleForEmail = OrderForEmail & { commission: number; commissionPct: number; seller: { displayName: string } | null };

/** Aviso al vendedor: no incluye el enlace privado del comprador ni el código de entrega. */
export function saleEmailHtml(order: SaleForEmail) {
  const rows = order.items.map((i) => `<li>${i.productName} (${i.variantName}) x${i.quantity}</li>`).join("");
  const net = order.subtotal - order.commission + order.shippingCost;
  const delivery =
    order.deliveryMethod === "HAND"
      ? "Entrega en mano: coordiná con el comprador y, al entregar, pedile el código de 4 dígitos para cargarlo en tu panel."
      : "Envío por correo: despachalo dentro de las 48 h hábiles y cargá el código de seguimiento en tu panel.";
  return `
  <div style="font-family:Nunito,Arial,sans-serif;max-width:560px;background:#FDFCFB;color:#2B3A55;padding:24px;border-radius:20px">
    <h2>🐬 ¡Vendiste, ${order.seller?.displayName ?? ""}!</h2>
    <p>Pedido <b>#${order.number}</b> pagado:</p>
    <ul>${rows}</ul>
    <p>Productos: ${money(order.subtotal)} · Comisión (${order.commissionPct} %): -${money(order.commission)}${order.shippingCost ? ` · Envío: ${money(order.shippingCost)}` : ""}</p>
    <p><b>Te queda: ${money(net)}</b> (antes de la tarifa de Mercado Pago).</p>
    <p>${delivery}</p>
    <p style="margin:24px 0">
      <a href="${site.url}/vender/panel/ventas" style="background:#8ECAE6;color:#2B3A55;padding:12px 22px;border-radius:24px;text-decoration:none;font-weight:bold;display:inline-block">Ver la venta en mi panel</a>
    </p>
  </div>`;
}
