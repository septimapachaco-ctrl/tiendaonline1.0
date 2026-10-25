import Link from "next/link";
import { money } from "@/lib/format";

export type CardProduct = {
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: { url: string }[];
  variants: { stock: number }[];
  condition?: string;
  seller?: { displayName: string } | null;
};

export function ProductCard({ product }: { product: CardProduct }) {
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const image = product.images[0]?.url;
  const onSale = !soldOut && product.comparePrice != null && product.comparePrice > product.price;
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group block rounded-[20px] bg-white p-2 shadow-[0_8px_30px_rgba(43,58,85,0.07)] transition hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(43,58,85,0.14)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-espuma">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">Sin foto</div>
        )}
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-full bg-white px-3 py-0.5 text-xs font-semibold text-ink">
            Agotado por ahora
          </span>
        )}
        {product.condition && product.condition !== "NUEVO" && (
          <span className="absolute top-2 right-2 rounded-full bg-arena px-3 py-0.5 text-xs font-semibold text-ink">Usado</span>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 rounded-full bg-concha px-3 py-0.5 text-xs font-semibold text-ink">
            {Math.round(100 - (product.price / product.comparePrice!) * 100)}% menos
          </span>
        )}
      </div>
      <div className="px-2 pt-3 pb-2">
        <h3 className="font-display text-lg leading-snug font-semibold group-hover:underline decoration-marea decoration-2 underline-offset-4">{product.name}</h3>
        <p className="mt-1">
          <span className="font-semibold">{money(product.price)}</span>
          {onSale && <span className="ml-2 text-sm text-muted line-through">{money(product.comparePrice!)}</span>}
        </p>
        {product.seller && <p className="mt-0.5 truncate text-xs text-muted">Vende {product.seller.displayName}</p>}
      </div>
    </Link>
  );
}
