import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getCommissions, SELLER_KINDS } from "@/lib/settings";
import { saveCommissions, updateSellerAdmin } from "../actions";

export const dynamic = "force-dynamic";

const PAID = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];

export default async function AdminSellers() {
  await requireStaff("ADMIN");
  const [sellers, commissions, stats] = await Promise.all([
    db.seller.findMany({
      include: { user: { select: { email: true } }, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCommissions(),
    db.order.groupBy({
      by: ["sellerId"],
      where: { sellerId: { not: null }, status: { in: PAID } },
      _sum: { subtotal: true, commission: true },
      _count: true,
    }),
  ]);
  const statOf = (id: string) => stats.find((s) => s.sellerId === id);
  const totalCommission = stats.reduce((s, x) => s + (x._sum.commission ?? 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendedores del marketplace</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card">
          <p className="text-sm text-muted">Comisiones cobradas (ventas pagadas)</p>
          <p className="mt-1 text-2xl font-bold">{money(totalCommission)}</p>
          <p className="mt-1 text-xs text-muted">{sellers.length} vendedores · {stats.reduce((s, x) => s + x._count, 0)} ventas</p>
        </div>
        <form action={saveCommissions} className="card space-y-3 text-sm">
          <p className="font-semibold">Comisión general por venta</p>
          {Object.entries(SELLER_KINDS).map(([k, v]) => (
            <label key={k} className="flex items-center justify-between gap-3">
              <span>{v.label}</span>
              <span className="flex items-center gap-1">
                <input name={k} type="number" min={0} max={50} defaultValue={commissions[k]} className="input w-20" />%
              </span>
            </label>
          ))}
          <button className="btn w-full">Guardar comisiones</button>
          <p className="text-xs text-muted">Aplica a las ventas nuevas. Las ya hechas conservan su comisión.</p>
        </form>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr><th>Vendedor</th><th>Tipo</th><th>Ciudad</th><th>Mercado Pago</th><th>Publicaciones</th><th>Ventas</th><th>Comisión cobrada</th><th>Gestión</th></tr>
          </thead>
          <tbody>
            {sellers.map((s) => {
              const st = statOf(s.id);
              return (
                <tr key={s.id}>
                  <td>
                    <Link href={`/vendedores/${s.slug}`} className="font-medium underline" target="_blank">{s.displayName}</Link>
                    <br /><span className="text-xs text-muted">{s.user.email}</span>
                  </td>
                  <td>{SELLER_KINDS[s.kind]?.short}</td>
                  <td>{s.city}, {s.province}</td>
                  <td>{s.mpAccessToken ? "Conectado" : "Sin conectar"}</td>
                  <td>{s._count.products}</td>
                  <td>{st?._count ?? 0}</td>
                  <td>{money(st?._sum.commission ?? 0)}</td>
                  <td>
                    <form action={updateSellerAdmin} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <select name="status" defaultValue={s.status} className="input w-32 py-1" aria-label="Estado">
                        <option value="ACTIVE">Activo</option>
                        <option value="SUSPENDED">Suspendido</option>
                      </select>
                      <input name="commissionPct" type="number" min={0} max={50} defaultValue={s.commissionPct ?? ""} placeholder={`${commissions[s.kind]} (general)`} className="input w-32 py-1" aria-label="Comisión propia %" />
                      <button className="btn-outline">Guardar</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sellers.length === 0 && <p className="p-4 text-sm text-muted">Todavía no hay vendedores.</p>}
      </div>
    </div>
  );
}
