import Link from "next/link";
import { Delfina } from "@/components/Logo";
import { ProductCard } from "@/components/ProductCard";
import { Olas } from "@/components/Olas";
import { db } from "@/lib/db";
import { visibleProductWhere } from "@/lib/sellers";

export const dynamic = "force-dynamic";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  variants: { select: { stock: true } },
  seller: { select: { displayName: true } },
};

// bases suaves de la paleta; Rosa Concha y Violeta Coral quedan como acento
const CATEGORY_COLORS = ["bg-aqua/70", "bg-arena", "bg-marea/50", "bg-aqua/40"];

export default async function HomePage() {
  const visible = visibleProductWhere();
  const recent = { orderBy: { createdAt: "desc" as const }, include: productInclude, take: 4 };
  const [featured, latest, used, handmade, categories] = await Promise.all([
    db.product.findMany({ where: { AND: [visible, { featured: true }] }, include: productInclude, take: 8 }),
    db.product.findMany({ where: { AND: [visible, { sellerId: null }] }, ...recent, take: 8 }),
    db.product.findMany({ where: { AND: [visible, { seller: { kind: "USADOS" } }] }, ...recent }),
    db.product.findMany({ where: { AND: [visible, { seller: { kind: "ARTESANO" } }] }, ...recent }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <section className="bg-firma relative overflow-hidden">
        <div className="container-page relative grid items-center gap-8 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="font-hand text-2xl text-profundo">Para los primeros pasos y los primeros chapuzones</p>
            <h1 className="mt-2 text-[32px] md:text-[40px]">Bienvenida al mar donde Delfina cuida a los más pequeños</h1>
            <p className="mt-4 max-w-md text-lg">
              Ropa, juguetes y rincones serenos, elegidos para que cada día tenga la calma del mar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/productos" className="btn">Explorar la tienda</Link>
              <Link href="/nosotros" className="btn-outline">Conocé a Delfina</Link>
            </div>
          </div>
          <Delfina className="mx-auto h-56 w-56 md:h-80 md:w-80" />
        </div>
        <Olas className="text-espuma" />
      </section>

      <section className="container-page py-10">
        <h2 className="mb-5 text-[28px]">Explorá el fondo del mar</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.slice(0, 4).map((c, i) => (
            <Link
              key={c.id}
              href={`/productos?categoria=${c.slug}`}
              className={`${CATEGORY_COLORS[i % 4]} flex aspect-[4/3] items-end rounded-[24px] p-5 font-display text-2xl font-bold text-profundo transition hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(43,58,85,0.1)]`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-4 pb-6 sm:grid-cols-3">
        {[
          ["Pagás como te quede cómodo", "Tarjetas, débito, dinero en cuenta y cuotas con Mercado Pago"],
          ["Del mar a tu casa", "Envíos a todo el país o retiro en nuestro local"],
          ["Elegido con calma", "Materiales suaves y seguros para los más pequeños"],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <p className="font-display text-lg font-semibold">{t}</p>
            <p className="text-muted">{d}</p>
          </div>
        ))}
      </section>

      {featured.length > 0 && <Grid title="Tesoros del fondo del mar" products={featured} />}
      {used.length > 0 && <Grid title="Ropero de familias" href="/productos?origen=usados" products={used} />}
      {handmade.length > 0 && <Grid title="Hecho a mano" href="/productos?origen=artesanos" products={handmade} />}

      <section className="container-page py-6">
        <div className="grid items-center gap-4 rounded-[24px] bg-arena p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <h2 className="text-[28px]">¿Tus peques ya no usan algo?</h2>
            <p className="mt-1">
              Vendelo acá, seguro y sin vueltas. Y si hacés productos para bebés y niños, sumate como artesana o productor.
            </p>
          </div>
          <Link href="/vender" className="btn">Quiero vender</Link>
        </div>
      </section>

      <Grid title="Recién llegados a la orilla" products={latest} />
    </>
  );
}

function Grid({
  title,
  products,
  href = "/productos",
}: {
  title: string;
  products: Parameters<typeof ProductCard>[0]["product"][];
  href?: string;
}) {
  return (
    <section className="container-page py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-[28px]">{title}</h2>
        <Link href={href} className="link shrink-0">Ver todo</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}
