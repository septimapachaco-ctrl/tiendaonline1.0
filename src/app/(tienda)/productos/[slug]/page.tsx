import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { AddToCart } from "@/components/AddToCart";
import { ProductGallery } from "@/components/ProductGallery";
import { SellerCard } from "@/components/SellerCard";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { sellerRating, visibleProductWhere } from "@/lib/sellers";
import { CONDITIONS } from "@/lib/settings";
import { site } from "@/lib/site";
import { askQuestion } from "../../marketplace-actions";

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, ...visibleProductWhere() },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: true,
      seller: true,
      questions: { where: { hidden: false }, orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const description = product.description.slice(0, 155) || `${product.name} a ${money(product.price)}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images.slice(0, 1).map((i) => i.url) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [user, rating] = await Promise.all([
    getCurrentUser(),
    product.seller ? sellerRating(product.seller.id) : null,
  ]);
  const isOwner = Boolean(user && product.seller && product.seller.userId === user.id);

  const inStock = product.variants.some((v) => v.stock > 0);
  const used = product.condition !== "NUEVO";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price: product.price,
      itemCondition: used ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}/productos/${product.slug}`,
    },
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm text-muted">
        <Link href="/productos" className="hover:text-ink">Tienda</Link>
        {product.category && (
          <> / <Link href={`/productos?categoria=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link></>
        )}
        {" / "}<span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images.map((i) => i.url)} name={product.name} />
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${used ? "bg-arena" : "bg-aqua/50"}`}>
            {CONDITIONS[product.condition] ?? "Nuevo"}
          </span>
          <h1 className="mt-2 text-[32px] md:text-[40px]">{product.name}</h1>
          {product.comparePrice && product.comparePrice > product.price && (
            <p className="mt-2 text-muted">
              <span className="line-through">{money(product.comparePrice)}</span>
              {used && <span className="ml-1 text-xs">(precio original)</span>}
            </p>
          )}
          <div className="mt-4">
            {isOwner ? (
              <p className="rounded-2xl bg-arena p-4 text-sm">
                Esta es tu publicación. <Link href={`/vender/panel/publicaciones/${product.id}`} className="link">Editarla</Link>
              </p>
            ) : (
              <AddToCart
                product={{
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  image: product.images[0]?.url ?? null,
                  sellerKey: product.seller?.id,
                  sellerName: product.seller?.displayName,
                }}
                variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, price: v.price }))}
              />
            )}
          </div>

          {product.seller && rating && (
            <div className="mt-6">
              <SellerCard seller={product.seller} rating={rating} />
            </div>
          )}

          <div className="mt-8 border-t border-line pt-6">
            <h2 className="mb-2 text-[22px]">Descripción</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
          </div>
          <div className="mt-6 space-y-1 rounded-2xl bg-soft p-4 text-sm">
            <p>💳 Hasta {process.env.MP_MAX_INSTALLMENTS || 12} cuotas con Mercado Pago</p>
            <p>
              🚚 Envío a domicilio{product.seller ? (product.seller.handDelivery ? ` o entrega en mano en ${product.seller.city}` : "") : " o retiro en el local"}.{" "}
              <Link href="/envios" className="underline">Ver costos</Link>
            </p>
            {product.seller && <p>🛟 Compra protegida: pagás dentro de la página y tu dinero está cuidado.</p>}
          </div>
        </div>
      </div>

      {product.seller && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-[28px]">Preguntas al vendedor</h2>
          <p className="mt-1 text-sm text-muted">
            Por tu seguridad, no compartas datos de contacto: toda la compra se hace dentro de la página.
          </p>
          {!isOwner && (
            <div className="card mt-4">
              {user ? (
                <ActionForm action={askQuestion} submitLabel="Preguntar" className="space-y-3">
                  <input type="hidden" name="productId" value={product.id} />
                  <textarea name="text" rows={2} required minLength={5} maxLength={500} className="input" placeholder="Escribí tu pregunta…" aria-label="Tu pregunta" />
                </ActionForm>
              ) : (
                <p className="text-sm">
                  <Link href={`/login?next=/productos/${product.slug}`} className="link">Ingresá</Link> o{" "}
                  <Link href={`/registro?next=/productos/${product.slug}`} className="link">creá una cuenta</Link> para hacer una pregunta.
                </p>
              )}
            </div>
          )}
          <ul className="mt-4 space-y-3">
            {product.questions.length === 0 && <li className="text-sm text-muted">Todavía no hay preguntas.</li>}
            {product.questions.map((q) => (
              <li key={q.id} className="text-sm">
                <p className="font-semibold">{q.text}</p>
                <p className={q.answer ? "mt-1 border-l-2 border-marea pl-3" : "mt-1 text-muted"}>
                  {q.answer ?? "Esperando respuesta del vendedor."}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
