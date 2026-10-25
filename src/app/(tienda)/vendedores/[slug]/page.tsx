import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { SellerCard } from "@/components/SellerCard";
import { db } from "@/lib/db";
import { sellerCanSell, sellerRating, visibleProductWhere } from "@/lib/sellers";

type Params = Promise<{ slug: string }>;

async function getSeller(slug: string) {
  const seller = await db.seller.findUnique({ where: { slug } });
  return seller && sellerCanSell(seller) ? seller : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const seller = await getSeller((await params).slug);
  if (!seller) return {};
  return {
    title: seller.displayName,
    description: seller.bio.slice(0, 155) || `Productos de ${seller.displayName} en ${seller.city}.`,
    alternates: { canonical: `/vendedores/${seller.slug}` },
  };
}

export default async function SellerPage({ params }: { params: Params }) {
  const seller = await getSeller((await params).slug);
  if (!seller) notFound();
  const [products, rating, reviews] = await Promise.all([
    db.product.findMany({
      where: { AND: [visibleProductWhere(), { sellerId: seller.id }] },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, variants: { select: { stock: true } } },
      orderBy: { createdAt: "desc" },
    }),
    sellerRating(seller.id),
    db.review.findMany({ where: { sellerId: seller.id, comment: { not: "" } }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <div className="container-page py-10">
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <SellerCard seller={seller} rating={rating} />
          {seller.bio && <p className="card whitespace-pre-line text-sm">{seller.bio}</p>}
          {reviews.length > 0 && (
            <div className="card space-y-3 text-sm">
              <p className="font-display text-lg font-semibold">Opiniones</p>
              {reviews.map((r) => (
                <p key={r.id}>
                  <span aria-label={`${r.rating} estrellas`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span> {r.comment}
                </p>
              ))}
            </div>
          )}
        </aside>
        <section>
          <h1 className="text-[32px]">{seller.displayName}</h1>
          {products.length === 0 ? (
            <p className="card mt-6 text-muted">No tiene publicaciones activas por ahora.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
