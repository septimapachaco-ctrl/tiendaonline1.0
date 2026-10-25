"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { contactProblem } from "@/lib/contact-filter";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { ORDER_STATUS, slugify } from "@/lib/format";
import { orderEmailHtml } from "@/lib/orders";
import { saveProductFromForm } from "@/lib/products";
import { requireSeller } from "@/lib/sellers";
import { SELLER_KINDS } from "@/lib/settings";
import type { FormState } from "../auth-actions";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

const profileSchema = z.object({
  kind: z.string().refine((k) => k in SELLER_KINDS, "Elegí qué tipo de vendedor sos"),
  displayName: z.string().trim().min(3, "El nombre debe tener al menos 3 letras").max(40),
  bio: z.string().trim().max(600).default(""),
  city: z.string().trim().min(2, "Ingresá tu ciudad"),
  province: z.string().trim().min(2, "Ingresá tu provincia"),
});

async function uniqueSellerSlug(base: string, exceptId?: string) {
  let slug = base || "vendedor";
  for (let i = 2; ; i++) {
    const found = await db.seller.findUnique({ where: { slug } });
    if (!found || found.id === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

// ---------- Perfil ----------

export async function createSeller(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vender/alta");
  if (await db.seller.findUnique({ where: { userId: user.id } })) redirect("/vender/panel");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (formData.get("terms") !== "on") return { error: "Tenés que aceptar las reglas para vender." };
  const problem = contactProblem(parsed.data.displayName, parsed.data.bio);
  if (problem) return { error: problem };

  await db.seller.create({
    data: {
      ...parsed.data,
      userId: user.id,
      slug: await uniqueSellerSlug(slugify(parsed.data.displayName)),
      handDelivery: formData.get("handDelivery") === "on",
      acceptedTermsAt: new Date(),
    },
  });
  redirect("/vender/panel?bienvenida=1");
}

export async function updateSeller(_: FormState, formData: FormData): Promise<FormState> {
  const { seller } = await requireSeller();
  const parsed = profileSchema.omit({ kind: true }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const problem = contactProblem(parsed.data.displayName, parsed.data.bio);
  if (problem) return { error: problem };
  await db.seller.update({
    where: { id: seller.id },
    data: {
      ...parsed.data,
      slug: await uniqueSellerSlug(slugify(parsed.data.displayName), seller.id),
      handDelivery: formData.get("handDelivery") === "on",
    },
  });
  revalidatePath("/", "layout");
  return { ok: "Perfil actualizado." };
}

export async function disconnectMercadoPago() {
  const { seller } = await requireSeller();
  await db.seller.update({
    where: { id: seller.id },
    data: { mpUserId: null, mpAccessToken: null, mpRefreshToken: null, mpTokenExpires: null },
  });
  revalidatePath("/", "layout");
}

// ---------- Publicaciones ----------

export async function saveSellerProduct(_: FormState, formData: FormData): Promise<FormState> {
  const { seller } = await requireSeller();
  if (seller.status !== "ACTIVE") return { error: "Tu cuenta de vendedor está suspendida. Escribinos desde contacto." };
  const result = await saveProductFromForm(formData, { sellerId: seller.id });
  if ("error" in result) return result;
  revalidatePath("/", "layout");
  redirect(`/vender/panel/publicaciones?ok=1`);
}

export async function deleteSellerProduct(formData: FormData) {
  const { seller } = await requireSeller();
  const id = str(formData.get("id"));
  const product = await db.product.findFirst({ where: { id, sellerId: seller.id } });
  if (!product) return;
  const sold = await db.orderItem.count({ where: { variant: { productId: id } } });
  // con ventas registradas solo se pausa, para conservar el historial
  if (sold > 0) await db.product.update({ where: { id }, data: { active: false } });
  else await db.product.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/vender/panel/publicaciones");
}

// ---------- Preguntas ----------

export async function answerQuestion(_: FormState, formData: FormData): Promise<FormState> {
  const { seller } = await requireSeller();
  const id = str(formData.get("id"));
  const answer = str(formData.get("answer"));
  if (answer.length < 2) return { error: "Escribí una respuesta." };
  const problem = contactProblem(answer);
  if (problem) return { error: problem };
  const question = await db.question.findFirst({ where: { id, product: { sellerId: seller.id } }, include: { user: true, product: true } });
  if (!question) return { error: "La pregunta no existe." };
  await db.question.update({ where: { id }, data: { answer: answer.slice(0, 1000), answeredAt: new Date() } });
  await sendMail(
    question.user.email,
    `Te respondieron sobre "${question.product.name}"`,
    `<p>Hola ${question.user.name}, ${seller.displayName} respondió tu pregunta:</p><blockquote>${escapeHtml(answer)}</blockquote>`,
  );
  revalidatePath("/", "layout");
  return { ok: "Respuesta publicada." };
}

// ---------- Ventas ----------

const SELLER_STATUSES = ["PREPARING", "SHIPPED"];

export async function sellerUpdateOrder(_: FormState, formData: FormData): Promise<FormState> {
  const { seller } = await requireSeller();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  const trackingCode = str(formData.get("trackingCode")) || null;
  if (!SELLER_STATUSES.includes(status)) return { error: "Estado inválido." };
  const order = await db.order.findFirst({ where: { id, sellerId: seller.id }, include: { items: true } });
  if (!order) return { error: "Pedido no encontrado." };
  if (["PENDING", "CANCELLED", "DELIVERED"].includes(order.status)) return { error: "Este pedido no se puede modificar." };
  if (status === "SHIPPED" && order.deliveryMethod === "SHIPPING" && !trackingCode) {
    return { error: "Cargá el código de seguimiento del correo." };
  }
  const updated = await db.order.update({ where: { id }, data: { status, trackingCode }, include: { items: true } });
  if (status !== order.status) {
    await sendMail(
      updated.email,
      `Tu pedido #${updated.number}: ${ORDER_STATUS[status]}`,
      orderEmailHtml(updated, `Actualizamos el estado de tu pedido <b>#${updated.number}</b>.`),
    );
  }
  revalidatePath("/vender/panel/ventas");
  return { ok: "Pedido actualizado." };
}

/** Entrega en mano: el comprador le dicta el código al vendedor cuando recibe el producto. */
export async function confirmHandDelivery(_: FormState, formData: FormData): Promise<FormState> {
  const { seller } = await requireSeller();
  const id = str(formData.get("id"));
  const code = str(formData.get("code"));
  const order = await db.order.findFirst({ where: { id, sellerId: seller.id }, include: { items: true } });
  if (!order || order.deliveryMethod !== "HAND") return { error: "Pedido no encontrado." };
  if (["PENDING", "CANCELLED"].includes(order.status)) return { error: "Este pedido todavía no está pagado." };
  if (order.status === "DELIVERED") return { ok: "Este pedido ya figura como entregado." };
  if (!order.deliveryCode || code !== order.deliveryCode) return { error: "El código no coincide. Pedíselo al comprador cuando le entregues el producto." };
  const updated = await db.order.update({
    where: { id },
    data: { status: "DELIVERED", deliveredAt: new Date() },
    include: { items: true },
  });
  await sendMail(
    updated.email,
    `Tu pedido #${updated.number} fue entregado`,
    orderEmailHtml(updated, `Registramos la entrega de tu pedido <b>#${updated.number}</b>. ¡Esperamos que lo disfruten! Podés calificar a ${seller.displayName} desde el enlace de tu pedido.`),
  );
  revalidatePath("/vender/panel/ventas");
  return { ok: "¡Entrega confirmada!" };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
