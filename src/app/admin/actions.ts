"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/(tienda)/auth-actions";
import { hashPassword, requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { ORDER_STATUS, slugify } from "@/lib/format";
import { orderEmailHtml } from "@/lib/orders";

const int = (v: FormDataEntryValue | null) => {
  const n = Math.round(Number(String(v ?? "").replace(",", ".")));
  return Number.isFinite(n) ? n : 0;
};
const optInt = (v: FormDataEntryValue | null) => (String(v ?? "").trim() === "" ? null : int(v));
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

// ---------- Productos ----------

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().nullable(),
  color: z.string().trim().nullable(),
  sku: z.string().trim().nullable(),
  stock: z.number().int().min(0),
  price: z.number().int().min(0).nullable(),
});

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = base || "producto";
  for (let i = 2; ; i++) {
    const found = await db.product.findUnique({ where: { slug } });
    if (!found || found.id === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function saveProduct(_: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const id = str(formData.get("id")) || undefined;
  const name = str(formData.get("name"));
  const price = int(formData.get("price"));
  if (name.length < 2) return { error: "El nombre es obligatorio." };
  if (price <= 0) return { error: "El precio debe ser mayor a 0." };

  let variants: z.infer<typeof variantSchema>[];
  let images: string[];
  try {
    variants = z.array(variantSchema).min(1).parse(JSON.parse(str(formData.get("variants"))));
    images = z.array(z.string().min(1)).parse(JSON.parse(str(formData.get("images")) || "[]"));
  } catch {
    return { error: "Revisá las variantes: cada una necesita stock (0 o más). Debe haber al menos una." };
  }
  variants = variants.map((v) => ({ ...v, size: v.size || null, color: v.color || null, sku: v.sku || null }));

  const slug = await uniqueSlug(slugify(str(formData.get("slug")) || name), id);
  const data = {
    name,
    slug,
    description: str(formData.get("description")),
    price,
    comparePrice: optInt(formData.get("comparePrice")),
    categoryId: str(formData.get("categoryId")) || null,
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
  };

  const productId = await db.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id }, data })
      : await tx.product.create({ data });

    const keepIds = variants.flatMap((v) => (v.id ? [v.id] : []));
    await tx.variant.deleteMany({ where: { productId: product.id, id: { notIn: keepIds } } });
    for (const { id: vid, ...v } of variants) {
      if (vid) await tx.variant.update({ where: { id: vid, productId: product.id }, data: v });
      else await tx.variant.create({ data: { ...v, productId: product.id } });
    }

    await tx.productImage.deleteMany({ where: { productId: product.id } });
    await tx.productImage.createMany({
      data: images.map((url, i) => ({ url, sortOrder: i, productId: product.id })),
    });
    return product.id;
  });

  revalidatePath("/", "layout");
  redirect(`/admin/productos/${productId}?ok=1`);
}

export async function deleteProduct(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  const sold = await db.orderItem.count({ where: { variant: { productId: id } } });
  if (sold > 0) {
    // con ventas registradas solo se desactiva, para conservar el historial
    await db.product.update({ where: { id }, data: { active: false } });
  } else {
    await db.product.delete({ where: { id } });
  }
  revalidatePath("/", "layout");
  redirect("/admin/productos");
}

export async function updateStock(formData: FormData) {
  await requireStaff();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("stock_")) continue;
    await db.variant.update({ where: { id: key.slice(6) }, data: { stock: Math.max(0, int(value)) } });
  }
  revalidatePath("/", "layout");
}

// ---------- Categorías ----------

export async function saveCategory(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!name) return;
  const data = { name, slug: slugify(name), sortOrder: int(formData.get("sortOrder")) };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  revalidatePath("/", "layout");
}

export async function deleteCategory(formData: FormData) {
  await requireStaff();
  await db.category.delete({ where: { id: str(formData.get("id")) } });
  revalidatePath("/", "layout");
}

// ---------- Pedidos ----------

export async function updateOrder(_: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  if (!ORDER_STATUS[status]) return { error: "Estado inválido." };
  const before = await db.order.findUnique({ where: { id } });
  if (!before) return { error: "Pedido no encontrado." };

  const order = await db.order.update({
    where: { id },
    data: {
      status,
      trackingCode: str(formData.get("trackingCode")) || null,
      adminNotes: str(formData.get("adminNotes")) || null,
    },
    include: { items: true },
  });

  // al cancelar un pedido ya pagado se devuelve el stock
  if (status === "CANCELLED" && before.status !== "CANCELLED" && before.stockApplied) {
    for (const item of order.items) {
      if (item.variantId) await db.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    }
    await db.order.update({ where: { id }, data: { stockApplied: false } });
  }

  if (formData.get("notify") === "on" && status !== before.status) {
    await sendMail(
      order.email,
      `Tu pedido #${order.number}: ${ORDER_STATUS[status]}`,
      orderEmailHtml(order, `Actualizamos el estado de tu pedido <b>#${order.number}</b>.`),
    );
  }
  revalidatePath("/admin/pedidos");
  return { ok: "Pedido actualizado." };
}

// ---------- Cupones (solo administradores) ----------

export async function saveCoupon(formData: FormData) {
  await requireStaff("ADMIN");
  const id = str(formData.get("id"));
  const expires = str(formData.get("expiresAt"));
  const data = {
    code: str(formData.get("code")).toUpperCase().replace(/\s+/g, ""),
    type: formData.get("type") === "FIXED" ? "FIXED" : "PERCENT",
    value: Math.max(0, int(formData.get("value"))),
    minTotal: Math.max(0, int(formData.get("minTotal"))),
    maxUses: optInt(formData.get("maxUses")),
    expiresAt: expires ? new Date(`${expires}T23:59:59-03:00`) : null,
    active: formData.get("active") === "on",
  };
  if (!data.code || data.value <= 0) return;
  if (data.type === "PERCENT") data.value = Math.min(data.value, 100);
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.upsert({ where: { code: data.code }, create: data, update: data });
  revalidatePath("/admin/cupones");
}

export async function deleteCoupon(formData: FormData) {
  await requireStaff("ADMIN");
  await db.coupon.delete({ where: { id: str(formData.get("id")) } });
  revalidatePath("/admin/cupones");
}

// ---------- Envíos (solo administradores) ----------

export async function saveZone(formData: FormData) {
  await requireStaff("ADMIN");
  const id = str(formData.get("id"));
  const data = {
    name: str(formData.get("name")),
    price: Math.max(0, int(formData.get("price"))),
    isPickup: formData.get("isPickup") === "on",
    active: formData.get("active") === "on",
    sortOrder: int(formData.get("sortOrder")),
  };
  if (!data.name) return;
  if (id) await db.shippingZone.update({ where: { id }, data });
  else await db.shippingZone.create({ data });
  revalidatePath("/", "layout");
}

export async function deleteZone(formData: FormData) {
  await requireStaff("ADMIN");
  await db.shippingZone.delete({ where: { id: str(formData.get("id")) } });
  revalidatePath("/", "layout");
}

// ---------- Usuarios del panel (solo administradores) ----------

export async function saveStaffUser(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireStaff("ADMIN");
  const email = str(formData.get("email")).toLowerCase();
  const name = str(formData.get("name"));
  const role = str(formData.get("role"));
  const password = str(formData.get("password"));
  if (!["STAFF", "ADMIN", "CUSTOMER"].includes(role)) return { error: "Rol inválido." };
  if (!email.includes("@")) return { error: "Email inválido." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.id === me.id && role !== "ADMIN") return { error: "No podés quitarte el rol de administrador." };
    if (password && password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
    await db.user.update({
      where: { id: existing.id },
      data: { role, ...(name ? { name } : {}), ...(password ? { passwordHash: await hashPassword(password) } : {}) },
    });
  } else {
    if (!name) return { error: "Ingresá el nombre." };
    if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
    await db.user.create({ data: { email, name, role, passwordHash: await hashPassword(password) } });
  }
  revalidatePath("/admin/usuarios");
  return { ok: "Usuario guardado." };
}

// ---------- Mensajes ----------

export async function toggleMessage(formData: FormData) {
  await requireStaff();
  const id = str(formData.get("id"));
  const msg = await db.contactMessage.findUnique({ where: { id } });
  if (msg) await db.contactMessage.update({ where: { id }, data: { read: !msg.read } });
  revalidatePath("/admin/mensajes");
}
