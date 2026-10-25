"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPreference, mpEnabled } from "@/lib/mercadopago";
import {
  applyPayment,
  couponDiscount,
  couponProblem,
  findCoupon,
  nextOrderNumber,
  priceCart,
  type CartLine,
} from "@/lib/orders";
import { demoPayments, sellerAccessToken, sellerCanSell } from "@/lib/sellers";
import { commissionFor } from "@/lib/settings";
import { HAND_DELIVERY } from "@/lib/format";
import { site } from "@/lib/site";

const STORE_KEY = "tienda";

const lineSchema = z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1);

export async function checkCoupon(code: string, lines: CartLine[]) {
  const { subtotal } = await priceCart(lineSchema.parse(lines));
  const coupon = await findCoupon(code);
  const problem = couponProblem(coupon, subtotal);
  if (problem || !coupon) return { ok: false as const, error: problem ?? "Cupón inválido" };
  return { ok: true as const, code: coupon.code, discount: couponDiscount(coupon, subtotal) };
}

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre"),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().min(6, "Ingresá un teléfono"),
  zoneId: z.string().min(1, "Elegí una forma de entrega"),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  province: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  notes: z.string().trim().max(500).optional(),
  coupon: z.string().trim().optional(),
});

export type CheckoutResult = { ok: true; redirectUrl: string } | { ok: false; error: string };

export async function placeOrder(
  input: z.input<typeof checkoutSchema>,
  lines: CartLine[],
  sellerKey: string = STORE_KEY,
): Promise<CheckoutResult> {
  // Sin credenciales de Mercado Pago solo se permite el modo demo (desarrollo o PAYMENTS_DEMO=true)
  const demo = demoPayments();
  if (!mpEnabled() && !demo) {
    return { ok: false, error: "Los pagos no están configurados. Contactanos por WhatsApp." };
  }
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;
  const cartLines = lineSchema.safeParse(lines);
  if (!cartLines.success) return { ok: false, error: "El carrito está vacío." };

  const { items, subtotal } = await priceCart(cartLines.data);
  if (items.length === 0) return { ok: false, error: "Los productos del carrito ya no están disponibles." };
  // cada vendedor cobra en su propia cuenta de Mercado Pago, así que se paga un vendedor por vez
  const sellerId = sellerKey === STORE_KEY ? null : sellerKey;
  if (items.some((i) => i.sellerId !== sellerId)) {
    return { ok: false, error: "Los productos son de distintos vendedores. Pagá a cada vendedor por separado desde tu canasta." };
  }
  const seller = sellerId ? await db.seller.findUnique({ where: { id: sellerId } }) : null;
  if (sellerId && (!seller || !sellerCanSell(seller))) {
    return { ok: false, error: "Este vendedor no puede recibir pagos en este momento." };
  }
  const short = items.find((i) => i.quantity > i.stock);
  if (short) {
    return { ok: false, error: `No hay stock suficiente de ${short.productName} (${short.variantName}). Disponible: ${short.stock}.` };
  }

  // se valida contra la base: una sesión vieja puede apuntar a un usuario que ya no existe
  const user = await getCurrentUser();
  if (seller && user && seller.userId === user.id) return { ok: false, error: "No podés comprar tus propias publicaciones." };

  let delivery: { method: string; name: string; cost: number; zoneId: string | null; needsAddress: boolean };
  if (data.zoneId === HAND_DELIVERY) {
    if (!seller?.handDelivery) return { ok: false, error: "Este vendedor no ofrece entrega en mano." };
    delivery = { method: "HAND", name: `Entrega en mano en ${seller.city}`, cost: 0, zoneId: null, needsAddress: false };
  } else {
    const zone = await db.shippingZone.findFirst({ where: { id: data.zoneId, active: true } });
    // el retiro en el local es solo para productos de la tienda
    if (!zone || (zone.isPickup && seller)) return { ok: false, error: "Elegí una forma de entrega válida." };
    delivery = {
      method: zone.isPickup ? "PICKUP" : "SHIPPING",
      name: zone.isPickup ? `Retiro: ${zone.name}` : `Envío: ${zone.name}`,
      cost: zone.price,
      zoneId: zone.id,
      needsAddress: !zone.isPickup,
    };
  }
  if (delivery.needsAddress && (!data.street || !data.city || !data.province || !data.zip)) {
    return { ok: false, error: "Completá la dirección de envío." };
  }

  let discount = 0;
  let couponId: string | null = null;
  // los cupones son de la tienda: no se aplican a productos de otros vendedores
  if (data.coupon && seller) return { ok: false, error: "Los cupones solo valen para productos de la tienda." };
  if (data.coupon) {
    const coupon = await findCoupon(data.coupon);
    const problem = couponProblem(coupon, subtotal);
    if (problem || !coupon) return { ok: false, error: problem ?? "Cupón inválido" };
    discount = couponDiscount(coupon, subtotal);
    couponId = coupon.id;
  }

  const total = subtotal - discount + delivery.cost;
  // la comisión se calcula sobre los productos; el envío va completo al vendedor
  const commissionPct = seller ? await commissionFor(seller) : 0;
  const commission = Math.round((subtotal * commissionPct) / 100);

  const order = await db.order.create({
    data: {
      number: await nextOrderNumber(),
      userId: user?.id ?? null,
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      street: delivery.needsAddress ? data.street : null,
      city: delivery.needsAddress ? data.city : null,
      province: delivery.needsAddress ? data.province : null,
      zip: delivery.needsAddress ? data.zip : null,
      notes: data.notes || null,
      shippingZoneId: delivery.zoneId,
      shippingName: delivery.name,
      shippingCost: delivery.cost,
      sellerId,
      commissionPct,
      commission,
      deliveryMethod: delivery.method,
      deliveryCode: delivery.method === "HAND" ? String(randomInt(1000, 10000)) : null,
      couponId,
      discount,
      subtotal,
      total,
      items: {
        create: items.map((i) => ({
          variantId: i.variantId,
          productName: i.productName,
          variantName: i.variantName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      },
    },
  });

  if (user && delivery.needsAddress) {
    const existing = await db.address.findFirst({ where: { userId: user.id } });
    const address = { street: data.street!, city: data.city!, province: data.province!, zip: data.zip! };
    if (existing) await db.address.update({ where: { id: existing.id }, data: address });
    else await db.address.create({ data: { ...address, userId: user.id } });
  }

  if (demo) {
    await applyPayment(order.id, { status: "approved", paymentId: "demo", paymentMethod: "demo", installments: 1 });
    return { ok: true, redirectUrl: `/checkout/resultado?order=${order.id}&demo=1` };
  }

  // Mercado Pago no admite ítems con precio negativo (descuentos), así que se cobra
  // un único ítem con el total del pedido; el detalle queda guardado en la orden.
  try {
    const sellerToken = seller ? await sellerAccessToken(seller) : undefined;
    if (seller && !sellerToken) throw new Error("El vendedor no tiene Mercado Pago conectado");
    const preference = await createPreference({
      orderId: order.id,
      orderNumber: order.number,
      items: [
        {
          id: order.id,
          title: `${site.name} - Pedido #${order.number}`,
          quantity: 1,
          unit_price: total,
        },
      ],
      payer: { name: data.name, email: data.email },
      siteUrl: site.url,
      sellerToken: sellerToken ?? undefined,
      marketplaceFee: commission,
    });
    return { ok: true, redirectUrl: preference.init_point };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos." };
  }
}
