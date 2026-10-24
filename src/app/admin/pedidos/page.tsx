import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { money, ORDER_STATUS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const { estado, q } = await searchParams;
  const num = Number(q);
  const where: Prisma.OrderWhereInput = {
    ...(estado ? { status: estado } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, ...(Number.isInteger(num) && num > 0 ? [{ number: num }] : [])] }
      : {}),
  };
  const [orders, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { items: true } } } }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/pedidos" className={`rounded px-3 py-1.5 ${!estado ? "bg-brand text-white" : "bg-white"}`}>Todos</Link>
        {Object.entries(ORDER_STATUS).map(([k, label]) => (
          <Link key={k} href={`/admin/pedidos?estado=${k}`} className={`rounded px-3 py-1.5 ${estado === k ? "bg-brand text-white" : "bg-white"}`}>
            {label} ({countOf(k)})
          </Link>
        ))}
      </div>
      <form className="flex gap-2">
        {estado && <input type="hidden" name="estado" value={estado} />}
        <input name="q" defaultValue={q} placeholder="Buscar por número, nombre o email" className="input max-w-sm" />
        <button className="btn-outline">Buscar</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Entrega</th><th>Estado</th><th>Pago</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/pedidos/${o.id}`} className="font-medium underline">#{o.number}</Link></td>
                <td>{o.createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</td>
                <td>{o.name}<br /><span className="text-xs text-muted">{o.email}</span></td>
                <td>{o.shippingName}</td>
                <td><StatusBadge status={o.status} /></td>
                <td className="text-xs">{o.paymentStatus ?? "—"}</td>
                <td className="font-semibold">{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-4 text-sm text-muted">No hay pedidos.</p>}
      </div>
    </div>
  );
}

