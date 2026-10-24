import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { select: { stock: true } },
};

const CATEGORY_COLORS = ["bg-rosa", "bg-menta", "bg-cielo", "bg-hada"];

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    db.product.findMany({ where: { active: true, featured: true }, include: productInclude, take: 8 }),
    db.product.findMany({ where: { active: true }, include: productInclude, orderBy: { createdAt: "desc" }, take: 8 }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <section className="bg-firma relative overflow-hidden">
        <Stars />
        <div className="container-page relative grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="font-hand text-2xl text-brand-dark">Para los primeros pasos y los primeros sueños</p>
            <h1 className="mt-2 text-[32px] md:text-[40px]">Bienvenida al país donde los unicornios cuidan a los más pequeños</h1>
            <p className="mt-4 max-w-md text-lg">
              Ropa, juguetes y rincones llenos de ternura, elegidos para que cada día tenga un poco de magia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/productos" className="btn">Descubrir la tienda</Link>
              <Link href="/nosotros" className="btn-outline">Nuestra historia</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.slice(0, 4).map((c, i) => (
              <Link
                key={c.id}
                href={`/productos?categoria=${c.slug}`}
                className={`${CATEGORY_COLORS[i % 4]} flex aspect-square items-end rounded-[48px] p-5 font-display text-2xl font-bold text-ink shadow-[0_8px_30px_rgba(124,91,201,0.12)] transition hover:-translate-y-1`}
              >
                <span>✦ {c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-4 py-10 sm:grid-cols-3">
        {[
          ["Pagás como te quede cómodo", "Tarjetas, débito, dinero en cuenta y cuotas con Mercado Pago"],
          ["Magia que viaja", "Envíos a todo el país o retiro en nuestro local"],
          ["Elegido con cuidado", "Materiales suaves y seguros para los más pequeños"],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <p className="font-display text-lg font-semibold">✦ {t}</p>
            <p className="text-muted">{d}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && <Grid title="Tesoros destacados" products={featured} />}
      <Grid title="Recién llegados al bosque" products={latest} />
    </>
  );
}

function Stars() {
  const stars = [
    ["8%", "18%", 18], ["22%", "70%", 12], ["48%", "10%", 14], ["62%", "82%", 20], ["88%", "28%", 16], ["92%", "70%", 10],
  ] as const;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {stars.map(([left, top, size], i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} className="absolute" style={{ left, top }}>
          <path d="M12 0c.8 5.6 4.4 9.2 12 12-7.6 2.8-11.2 6.4-12 12-.8-5.6-4.4-9.2-12-12 7.6-2.8 11.2-6.4 12-12z" fill="#FFE9A8" />
        </svg>
      ))}
    </div>
  );
}

function Grid({ title, products }: { title: string; products: Parameters<typeof ProductCard>[0]["product"][] }) {
  return (
    <section className="container-page py-10">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-[28px]">{title}</h2>
        <Link href="/productos" className="font-semibold text-brand hover:underline">Ver todo ✦</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}
