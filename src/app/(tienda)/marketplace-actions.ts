"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { contactProblem } from "@/lib/contact-filter";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { site } from "@/lib/site";
import type { FormState } from "./auth-actions";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

/** Pregunta pública sobre una publicación. Requiere cuenta y no admite datos de contacto. */
export async function askQuestion(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Ingresá a tu cuenta para preguntar." };
  const productId = str(formData.get("productId"));
  const text = str(formData.get("text"));
  if (text.length < 5) return { error: "Escribí tu pregunta." };
  const problem = contactProblem(text);
  if (problem) return { error: problem };

  const product = await db.product.findUnique({ where: { id: productId }, include: { seller: { include: { user: true } } } });
  if (!product || !product.active) return { error: "La publicación ya no está disponible." };
  if (product.seller?.userId === user.id) return { error: "No podés preguntar en tu propia publicación." };

  // límite simple contra spam: hasta 10 preguntas por día
  const today = await db.question.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 86400000) } } });
  if (today >= 10) return { error: "Alcanzaste el límite de preguntas por hoy." };

  await db.question.create({ data: { productId, userId: user.id, text: text.slice(0, 500) } });
  const notify = product.seller?.user.email ?? process.env.ADMIN_NOTIFY_EMAIL;
  if (notify) {
    await sendMail(
      notify,
      `Nueva pregunta en "${product.name}"`,
      `<p>Te hicieron una pregunta. Respondela desde tu panel: <a href="${site.url}/vender/panel/preguntas">${site.url}/vender/panel/preguntas</a></p>`,
    );
  }
  revalidatePath(`/productos/${product.slug}`);
  return { ok: "¡Pregunta enviada! Te avisamos por email cuando te respondan." };
}

/** El comprador confirma desde el enlace privado de su pedido que recibió el envío. */
export async function confirmReceived(formData: FormData) {
  const id = str(formData.get("id"));
  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.status !== "SHIPPED") return;
  await db.order.update({ where: { id }, data: { status: "DELIVERED", deliveredAt: new Date() } });
  revalidatePath(`/pedido/${id}`);
}

/** Calificación al vendedor, una por pedido entregado. */
export async function reviewOrder(_: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData.get("id"));
  const rating = Number(formData.get("rating"));
  const comment = str(formData.get("comment")).slice(0, 500);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Elegí de 1 a 5 estrellas." };
  const problem = contactProblem(comment);
  if (problem) return { error: problem };
  const order = await db.order.findUnique({ where: { id }, include: { review: true } });
  if (!order || !order.sellerId || order.status !== "DELIVERED") return { error: "Este pedido todavía no se puede calificar." };
  if (order.review) return { ok: "Ya calificaste este pedido. ¡Gracias!" };
  const user = await getCurrentUser();
  await db.review.create({
    data: { orderId: id, sellerId: order.sellerId, userId: user?.id ?? null, rating, comment },
  });
  revalidatePath(`/pedido/${id}`);
  return { ok: "¡Gracias por tu calificación!" };
}
