import Link from "next/link";
import { SELLER_KINDS } from "@/lib/settings";

type Props = {
  seller: { displayName: string; slug: string; kind: string; city: string; province: string; handDelivery: boolean };
  rating: { average: number | null; count: number; sales: number };
};

/** Datos públicos del vendedor: nunca muestra contacto, solo reputación construida dentro de la página. */
export function SellerCard({ seller, rating }: Props) {
  return (
    <div className="rounded-[20px] bg-aqua/25 p-4 text-sm">
      <p className="text-xs text-muted">Vende</p>
      <Link href={`/vendedores/${seller.slug}`} className="font-display text-lg font-semibold hover:underline decoration-marea decoration-2 underline-offset-4">
        {seller.displayName}
      </Link>
      <p className="text-muted">{SELLER_KINDS[seller.kind]?.label} · {seller.city}, {seller.province}</p>
      <p className="mt-1">
        {rating.average ? (
          <>
            <span aria-hidden="true">{"★".repeat(Math.round(rating.average))}{"☆".repeat(5 - Math.round(rating.average))}</span>{" "}
            {rating.average.toFixed(1)} ({rating.count} opiniones)
          </>
        ) : (
          "Todavía sin calificaciones"
        )}
        {rating.sales > 0 && ` · ${rating.sales} ventas entregadas`}
      </p>
      {seller.handDelivery && <p className="mt-1">Ofrece entrega en mano en {seller.city}.</p>}
    </div>
  );
}
