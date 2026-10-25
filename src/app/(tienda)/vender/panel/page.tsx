import Link from "next/link";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { requireSeller, sellerRating } from "@/lib/sellers";
import { commissionFor } from "@/lib/settings";

export const dynamic = "force-dynamic";

const MP_MESSAGES: Record<string, { text: string; ok: boolean }> = {
  ok: { text: "¡Listo! Tu cuenta de Mercado Pago quedó conectada. Ya podés vender.", ok: true },
  error: { text: "No pudimos conectar tu cuenta de Mercado Pago. Probá de nuevo.", ok: false },
  "sin-configurar": { text: "La conexión con Mercado Pago todavía no está habilitada en la página.", ok: false },
};

export default async function SellerHome({ searchParams }: { searchParams: Promise<{ mp?: string; bienvenida?: string }> }) {
  const sp = await searchParams;
  const { seller } = await requireSeller();
  const paidStatuses = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];
  const [active, sales, rating, pct] = await Promise.all([
    db.product.count({ where: { sellerId: seller.id, active: true } }),
    db.order.aggregate({
      where: { sellerId: seller.id, status: { in: paidStatuses } },
      _sum: { subtotal: true, commission: true, shippingCost: true },
      _count: true,
    }),
    sellerRating(seller.id),
    commissionFor(seller),
  ]);
  const net = (sales._sum.subtotal ?? 0) - (sales._sum.commission ?? 0) + (sales._sum.shippingCost ?? 0);
  const mp = sp.mp ? MP_MESSAGES[sp.mp] : null;

  return (
    <div className="space-y-6">
      {sp.bienvenida && (
        <p className="rounded-2xl bg-aqua/40 p-4">
          ¡Bienvenida/o! Tu perfil de vendedor está creado. Ahora{" "}
          {seller.mpAccessToken ? "" : <><a href="/vender/mercadopago" className="link">conectá Mercado Pago</a> y </>}
          <Link href="/vender/panel/publicaciones/nueva" className="link">subí tu primera publicación</Link>.
        </p>
      )}
      {mp && <p className={`rounded-2xl p-4 ${mp.ok ? "bg-aqua/40" : "bg-anemona/40"}`}>{mp.text}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Publicaciones activas" value={String(active)} />
        <Stat label="Ventas" value={String(sales._count)} />
        <Stat label="Te quedó (después de la comisión)" value={money(net)} hint={`Comisión de la página: ${pct} %`} />
        <Stat
          label="Calificación"
          value={rating.average ? `${rating.average.toFixed(1)} / 5` : "—"}
          hint={`${rating.count} opiniones · ${rating.sales} entregas`}
        />
      </div>

      <div className="card space-y-2 text-sm">
        <p className="font-display text-lg font-semibold">Recordá</p>
        <p>Cobrás a través de Mercado Pago: la comisión se descuenta sola y el resto llega a tu cuenta.</p>
        <p>Mercado Pago también descuenta su tarifa por procesar el pago.</p>
        <p>Los datos del comprador aparecen en <Link href="/vender/panel/ventas" className="link">Ventas</Link> cuando el pago está aprobado.</p>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
