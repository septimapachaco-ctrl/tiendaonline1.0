import "server-only";
import { z } from "zod";
import { contactProblem } from "./contact-filter";
import { db } from "./db";
import { slugify } from "./format";
import { CONDITIONS } from "./settings";

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().nullable(),
  color: z.string().trim().nullable(),
  sku: z.string().trim().nullable(),
  stock: z.number().int().min(0),
  price: z.number().int().min(0).nullable(),
});

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const int = (v: FormDataEntryValue | null) => {
  const n = Math.round(Number(String(v ?? "").replace(",", ".")));
  return Number.isFinite(n) ? n : 0;
};
const optInt = (v: FormDataEntryValue | null) => (String(v ?? "").trim() === "" ? null : int(v));

export async function uniqueSlug(base: string, exceptId?: string) {
  let slug = base || "producto";
  for (let i = 2; ; i++) {
    const found = await db.product.findUnique({ where: { slug } });
    if (!found || found.id === exceptId) return slug;
    slug = `${base}-${i}`;
  }
}

/**
 * Guarda un producto desde el formulario (panel de la tienda o panel del vendedor).
 * Con `sellerId` solo puede editar productos propios y se filtran datos de contacto.
 */
export async function saveProductFromForm(
  formData: FormData,
  opts: { sellerId?: string; admin?: boolean } = {},
): Promise<{ error: string } | { productId: string }> {
  const id = str(formData.get("id")) || undefined;
  const name = str(formData.get("name"));
  const description = str(formData.get("description"));
  const price = int(formData.get("price"));
  if (name.length < 2) return { error: "El nombre es obligatorio." };
  if (price <= 0) return { error: "El precio debe ser mayor a 0." };

  if (id) {
    const existing = await db.product.findUnique({ where: { id }, select: { sellerId: true } });
    if (!existing) return { error: "El producto no existe." };
    // el panel de la tienda puede moderar cualquier publicación; un vendedor, solo las suyas
    if (!opts.admin && (existing.sellerId ?? undefined) !== opts.sellerId) {
      return { error: "No podés editar este producto." };
    }
  }

  let variants: z.infer<typeof variantSchema>[];
  let images: string[];
  try {
    variants = z.array(variantSchema).min(1).parse(JSON.parse(str(formData.get("variants"))));
    images = z.array(z.string().min(1)).parse(JSON.parse(str(formData.get("images")) || "[]"));
  } catch {
    return { error: "Revisá las variantes: cada una necesita stock (0 o más). Debe haber al menos una." };
  }
  variants = variants.map((v) => ({ ...v, size: v.size || null, color: v.color || null, sku: v.sku || null }));

  if (opts.sellerId) {
    const problem = contactProblem(name, description, ...variants.flatMap((v) => [v.size, v.color]));
    if (problem) return { error: problem };
    if (images.length === 0) return { error: "Subí al menos una foto del producto." };
  }

  const condition = str(formData.get("condition"));
  const data = {
    name,
    description,
    price,
    comparePrice: optInt(formData.get("comparePrice")),
    categoryId: str(formData.get("categoryId")) || null,
    active: formData.get("active") === "on",
    condition: condition in CONDITIONS ? condition : "NUEVO",
    // solo la tienda elige destacados y URL
    ...(opts.sellerId
      ? { sellerId: opts.sellerId }
      : { featured: formData.get("featured") === "on" }),
  };
  const slug = await uniqueSlug(slugify((opts.sellerId ? "" : str(formData.get("slug"))) || name), id);

  const productId = await db.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id }, data: { ...data, slug } })
      : await tx.product.create({ data: { ...data, slug } });

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

  return { productId };
}
