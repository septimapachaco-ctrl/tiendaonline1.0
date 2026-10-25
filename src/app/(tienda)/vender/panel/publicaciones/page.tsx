import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { requireSeller } from "@/lib/sellers";
import { CONDITIONS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SellerProducts({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { seller } = await requireSeller();
  const products = await db.product.findMany({
    where: { sellerId: seller.id },
    include: { variants: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[28px]">Mis publicaciones</h2>
        <Link href="/vender/panel/publicaciones/nueva" className="btn">+ Nueva publicación</Link>
      </div>
      {ok && <p className="rounded-2xl bg-aqua/40 p-3 text-sm">Publicación guardada.</p>}
      {products.length === 0 && (
        <p className="card text-muted">Todavía no publicaste nada. Subí fotos reales y contá bien el estado del producto.</p>
      )}
      <div className="grid gap-3">
        {products.map((p) => {
          const stock = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <Link key={p.id} href={`/vender/panel/publicaciones/${p.id}`} className="card flex items-center gap-4 hover:shadow-md">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-espuma">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.images[0] && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-sm text-muted">{CONDITIONS[p.condition]} · {money(p.price)} · {stock} disponible{stock === 1 ? "" : "s"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.active && stock > 0 ? "bg-aqua/50" : "bg-arena"}`}>
                {!p.active ? "Pausada" : stock > 0 ? "Activa" : "Sin stock"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
