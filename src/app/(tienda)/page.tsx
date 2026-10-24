import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { select: { stock: true } },
};

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    db.product.findMany({ where: { active: true, featured: true }, include: productInclude, take: 8 }),
    db.product.findMany({ where: { active: true }, include: productInclude, orderBy: { createdAt: "desc" }, take: 8 }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <section className="bg-soft">
        <div className="container-page grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold tracking-widest text-accent uppercase">Nueva temporada</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Diseño y calidad para todos los días
            </h1>
            <p className="mt-4 max-w-md text-muted">
              Comprá online con envío a todo el país o retirá en nuestro local. Pagá en cuotas con Mercado Pago.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/productos" className="btn">Ver productos</Link>
              <Link href="/envios" className="btn-outline">Envíos</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/productos?categoria=${c.slug}`}
                className="flex aspect-square items-end rounded-lg bg-brand p-4 text-lg font-semibold text-white transition hover:bg-brand-dark"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-4 py-10 text-sm sm:grid-cols-3">
        {[
          ["Cuotas con Mercado Pago", "Tarjetas, débito y dinero en cuenta"],
          ["Envíos a todo el país", "O retirá gratis en el local"],
          ["Compra protegida", "Tus datos viajan cifrados"],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <p className="font-semibold">{t}</p>
            <p className="text-muted">{d}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && <Grid title="Destacados" products={featured} />}
      <Grid title="Novedades" products={latest} />
    </>
  );
}

function Grid({ title, products }: { title: string; products: Parameters<typeof ProductCard>[0]["product"][] }) {
  return (
    <section className="container-page py-10">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href="/productos" className="text-sm text-brand hover:underline">Ver todo →</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}
