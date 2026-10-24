import Link from "next/link";
import { money } from "@/lib/format";

export type CardProduct = {
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: { url: string }[];
  variants: { stock: number }[];
};

export function ProductCard({ product }: { product: CardProduct }) {
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const image = product.images[0]?.url;
  return (
    <Link href={`/productos/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-soft">
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
          <span className="absolute top-2 left-2 rounded bg-ink px-2 py-0.5 text-xs font-semibold text-white">
            Sin stock
          </span>
        )}
        {!soldOut && product.comparePrice && product.comparePrice > product.price && (
          <span className="absolute top-2 left-2 rounded bg-accent px-2 py-0.5 text-xs font-semibold text-white">
            -{Math.round(100 - (product.price / product.comparePrice) * 100)}%
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-medium group-hover:text-brand">{product.name}</h3>
      <p className="mt-1 text-sm">
        <span className="font-semibold">{money(product.price)}</span>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="ml-2 text-muted line-through">{money(product.comparePrice)}</span>
        )}
      </p>
    </Link>
  );
}
