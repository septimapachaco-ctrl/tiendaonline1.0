import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
  ]);
  const pages = ["", "/productos", "/nosotros", "/contacto", "/envios", "/terminos"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const })),
    ...categories.map((c) => ({ url: `${site.url}/productos?categoria=${c.slug}` })),
    ...products.map((p) => ({ url: `${site.url}/productos/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
