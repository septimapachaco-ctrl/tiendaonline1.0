import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductGallery } from "@/components/ProductGallery";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string) {
  return db.product.findFirst({
    where: { slug, active: true },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, category: true },
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

  const inStock = product.variants.some((v) => v.stock > 0);
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
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.comparePrice && product.comparePrice > product.price && (
            <p className="mt-2 text-muted line-through">{money(product.comparePrice)}</p>
          )}
          <div className="mt-4">
            <AddToCart
              product={{ name: product.name, slug: product.slug, price: product.price, image: product.images[0]?.url ?? null }}
              variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, price: v.price }))}
            />
          </div>
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/85">{product.description}</p>
          </div>
          <div className="mt-6 space-y-1 rounded-lg bg-soft p-4 text-sm">
            <p>💳 Hasta {process.env.MP_MAX_INSTALLMENTS || 12} cuotas con Mercado Pago</p>
            <p>🚚 Envío a domicilio o retiro en el local. <Link href="/envios" className="underline">Ver costos</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
