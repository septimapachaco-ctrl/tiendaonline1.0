import Link from "next/link";
import { db } from "@/lib/db";
import { money, ORDER_STATUS } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ dias?: string; error?: string }> }) {
  const sp = await searchParams;
  const days = [7, 30, 90, 365].includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const since = new Date(Date.now() - days * 86400000);

  const [paid, pendingCount, toShip, lowStock, recent, items] = await Promise.all([
    db.order.findMany({ where: { status: { in: PAID_STATUSES }, paidAt: { gte: since } }, select: { total: true, paidAt: true } }),
    db.order.count({ where: { status: "PENDING", createdAt: { gte: since } } }),
    db.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    db.variant.findMany({ where: { stock: { lte: 3 }, product: { active: true } }, include: { product: true }, orderBy: { stock: "asc" }, take: 10 }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.orderItem.findMany({
      where: { order: { status: { in: PAID_STATUSES }, paidAt: { gte: since } } },
      select: { productName: true, quantity: true, unitPrice: true },
    }),
  ]);

  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const avg = paid.length ? Math.round(revenue / paid.length) : 0;

  const byProduct = new Map<string, { qty: number; total: number }>();
  for (const i of items) {
    const p = byProduct.get(i.productName) ?? { qty: 0, total: 0 };
    p.qty += i.quantity;
    p.total += i.quantity * i.unitPrice;
    byProduct.set(i.productName, p);
  }
  const top = [...byProduct.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  const byDay = new Map<string, number>();
  for (const o of paid) {
    const k = o.paidAt!.toISOString().slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + o.total);
  }
  const chartDays = Math.min(days, 30);
  const series = Array.from({ length: chartDays }, (_, i) => {
    const d = new Date(Date.now() - (chartDays - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { d, v: byDay.get(d) ?? 0 };
  });
  const maxV = Math.max(1, ...series.map((s) => s.v));

  return (
    <div className="space-y-6">
      {sp.error === "permiso" && <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">Tu usuario no tiene permiso para esa sección.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Resumen de ventas</h1>
        <div className="flex gap-1 text-sm">
          {[7, 30, 90, 365].map((d) => (
            <Link key={d} href={`/admin?dias=${d}`} className={`rounded px-3 py-1.5 ${d === days ? "bg-brand text-white" : "bg-white"}`}>
              {d === 365 ? "1 año" : `${d} días`}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ventas" value={money(revenue)} />
        <Stat label="Pedidos pagados" value={String(paid.length)} />
        <Stat label="Ticket promedio" value={money(avg)} />
        <Stat label="Para preparar / enviar" value={String(toShip)} hint={`${pendingCount} pendientes de pago`} />
      </div>

      <div className="card">
        <p className="mb-4 font-semibold">Ventas por día (últimos {chartDays} días)</p>
        <div className="flex h-40 items-end gap-1">
          {series.map((s) => (
            <div key={s.d} className="group relative flex-1">
              <div className="rounded-t bg-brand/80 group-hover:bg-brand" style={{ height: `${(s.v / maxV) * 150}px`, minHeight: s.v ? 2 : 0 }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                {s.d.slice(5)}: {money(s.v)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <p className="mb-3 font-semibold">Productos más vendidos</p>
          {top.length === 0 ? <p className="text-sm text-muted">Sin ventas en el período.</p> : (
            <table className="table">
              <thead><tr><th>Producto</th><th>Unidades</th><th>Total</th></tr></thead>
              <tbody>{top.map(([name, v]) => <tr key={name}><td>{name}</td><td>{v.qty}</td><td>{money(v.total)}</td></tr>)}</tbody>
            </table>
          )}
        </div>
        <div className="card">
          <p className="mb-3 font-semibold">Stock bajo (3 o menos)</p>
          {lowStock.length === 0 ? <p className="text-sm text-muted">Todo en orden.</p> : (
            <table className="table">
              <thead><tr><th>Producto</th><th>Variante</th><th>Stock</th></tr></thead>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id}>
                    <td><Link href={`/admin/productos/${v.productId}`} className="underline">{v.product.name}</Link></td>
                    <td>{[v.size, v.color].filter(Boolean).join(" / ") || "Único"}</td>
                    <td className={v.stock === 0 ? "font-semibold text-red-700" : ""}>{v.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <p className="mb-3 font-semibold">Últimos pedidos</p>
        <table className="table">
          <thead><tr><th>#</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/pedidos/${o.id}`} className="underline">#{o.number}</Link></td>
                <td>{o.name}</td>
                <td>{ORDER_STATUS[o.status]}</td>
                <td>{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
