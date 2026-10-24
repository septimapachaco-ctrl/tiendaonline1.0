import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";

type SP = Promise<Record<string, string | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = sp.categoria ? await db.category.findUnique({ where: { slug: sp.categoria } }) : null;
  return {
    title: cat ? cat.name : sp.q ? `Resultados para "${sp.q}"` : "Tienda",
    alternates: { canonical: cat ? `/productos?categoria=${cat.slug}` : "/productos" },
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { q, categoria, talle, color, min, max, orden } = sp;

  const variantFilter: Prisma.VariantWhereInput = {
    ...(talle ? { size: talle } : {}),
    ...(color ? { color } : {}),
  };
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            // el slug no tiene tildes: "arcoiris" encuentra "Arcoíris"
            ...(slugify(q) ? [{ slug: { contains: slugify(q) } }] : []),
          ],
        }
      : {}),
    ...(categoria ? { category: { slug: categoria } } : {}),
    ...(talle || color ? { variants: { some: variantFilter } } : {}),
    ...(min || max ? { price: { ...(min ? { gte: Number(min) } : {}), ...(max ? { lte: Number(max) } : {}) } } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    orden === "precio-asc" ? { price: "asc" } : orden === "precio-desc" ? { price: "desc" } : { createdAt: "desc" };

  const [products, categories, variantValues] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: { select: { stock: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.variant.findMany({ where: { product: { active: true } }, select: { size: true, color: true } }),
  ]);
  const sizes = [...new Set(variantValues.map((v) => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(variantValues.map((v) => v.color).filter(Boolean))] as string[];
  const current = categories.find((c) => c.slug === categoria);

  return (
    <div className="container-page py-10">
      <h1 className="text-[40px]">{current?.name ?? (q ? `Resultados para “${q}”` : "Todos los productos")}</h1>
      <p className="mt-1 text-sm text-muted">{products.length} productos</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <form className="space-y-5 text-sm">
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            <div>
              <label className="label" htmlFor="q">Buscar</label>
              <input id="q" name="q" defaultValue={q} className="input" placeholder="Nombre del producto" />
            </div>
            <div>
              <p className="label">Categorías</p>
              <ul className="space-y-1">
                <li><Link href="/productos" className={!categoria ? "font-semibold text-brand" : "text-muted hover:text-ink"}>Todas</Link></li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/productos?categoria=${c.slug}`} className={categoria === c.slug ? "font-semibold text-brand" : "text-muted hover:text-ink"}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {sizes.length > 0 && (
              <div>
                <label className="label" htmlFor="talle">Talle</label>
                <select id="talle" name="talle" defaultValue={talle ?? ""} className="input">
                  <option value="">Todos</option>
                  {sizes.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            {colors.length > 0 && (
              <div>
                <label className="label" htmlFor="color">Color</label>
                <select id="color" name="color" defaultValue={color ?? ""} className="input">
                  <option value="">Todos</option>
                  {colors.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <p className="label">Precio</p>
              <div className="flex gap-2">
                <input name="min" type="number" min={0} defaultValue={min} placeholder="Mín" className="input" />
                <input name="max" type="number" min={0} defaultValue={max} placeholder="Máx" className="input" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="orden">Ordenar</label>
              <select id="orden" name="orden" defaultValue={orden ?? ""} className="input">
                <option value="">Más nuevos</option>
                <option value="precio-asc">Menor precio</option>
                <option value="precio-desc">Mayor precio</option>
              </select>
            </div>
            <button className="btn w-full">Filtrar</button>
          </form>
        </aside>

        <div>
          {products.length === 0 ? (
            <p className="card text-muted">No encontramos productos con esos filtros.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
