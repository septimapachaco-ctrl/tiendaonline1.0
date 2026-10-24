"use server";

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
import { site } from "@/lib/site";

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

export async function placeOrder(input: z.input<typeof checkoutSchema>, lines: CartLine[]): Promise<CheckoutResult> {
  // Sin credenciales de Mercado Pago solo se permite el modo demo (desarrollo o PAYMENTS_DEMO=true)
  const demoPayments = !mpEnabled() && (process.env.NODE_ENV !== "production" || process.env.PAYMENTS_DEMO === "true");
  if (!mpEnabled() && !demoPayments) {
    return { ok: false, error: "Los pagos no están configurados. Contactanos por WhatsApp." };
  }
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;
  const cartLines = lineSchema.safeParse(lines);
  if (!cartLines.success) return { ok: false, error: "El carrito está vacío." };

  const { items, subtotal } = await priceCart(cartLines.data);
  if (items.length === 0) return { ok: false, error: "Los productos del carrito ya no están disponibles." };
  const short = items.find((i) => i.quantity > i.stock);
  if (short) {
    return { ok: false, error: `No hay stock suficiente de ${short.productName} (${short.variantName}). Disponible: ${short.stock}.` };
  }

  const zone = await db.shippingZone.findFirst({ where: { id: data.zoneId, active: true } });
  if (!zone) return { ok: false, error: "Elegí una forma de entrega válida." };
  if (!zone.isPickup && (!data.street || !data.city || !data.province || !data.zip)) {
    return { ok: false, error: "Completá la dirección de envío." };
  }

  let discount = 0;
  let couponId: string | null = null;
  if (data.coupon) {
    const coupon = await findCoupon(data.coupon);
    const problem = couponProblem(coupon, subtotal);
    if (problem || !coupon) return { ok: false, error: problem ?? "Cupón inválido" };
    discount = couponDiscount(coupon, subtotal);
    couponId = coupon.id;
  }

  // se valida contra la base: una sesión vieja puede apuntar a un usuario que ya no existe
  const user = await getCurrentUser();
  const total = subtotal - discount + zone.price;

  const order = await db.order.create({
    data: {
      number: await nextOrderNumber(),
      userId: user?.id ?? null,
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      street: zone.isPickup ? null : data.street,
      city: zone.isPickup ? null : data.city,
      province: zone.isPickup ? null : data.province,
      zip: zone.isPickup ? null : data.zip,
      notes: data.notes || null,
      shippingZoneId: zone.id,
      shippingName: zone.isPickup ? `Retiro: ${zone.name}` : `Envío: ${zone.name}`,
      shippingCost: zone.price,
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

  if (user && !zone.isPickup) {
    const existing = await db.address.findFirst({ where: { userId: user.id } });
    const address = { street: data.street!, city: data.city!, province: data.province!, zip: data.zip! };
    if (existing) await db.address.update({ where: { id: existing.id }, data: address });
    else await db.address.create({ data: { ...address, userId: user.id } });
  }

  if (demoPayments) {
    await applyPayment(order.id, { status: "approved", paymentId: "demo", paymentMethod: "demo", installments: 1 });
    return { ok: true, redirectUrl: `/checkout/resultado?order=${order.id}&demo=1` };
  }

  // Mercado Pago no admite ítems con precio negativo (descuentos), así que se cobra
  // un único ítem con el total del pedido; el detalle queda guardado en la orden.
  try {
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
    });
    return { ok: true, redirectUrl: preference.init_point };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "No pudimos conectar con Mercado Pago. Probá de nuevo en unos minutos." };
  }
}
