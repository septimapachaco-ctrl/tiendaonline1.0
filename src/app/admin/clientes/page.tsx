import { db } from "@/lib/db";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

// Lista compradores: clientes registrados y compras como invitado agrupadas por email.
export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [users, stats] = await Promise.all([
    db.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { createdAt: "desc" } }),
    db.order.groupBy({
      by: ["email"],
      where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } },
      _count: true,
      _sum: { total: true },
      _max: { createdAt: true, name: true, phone: true },
    }),
  ]);

  const rows = new Map<string, { name: string; email: string; phone: string; registered: boolean; orders: number; spent: number; last: Date | null }>();
  for (const u of users) {
    rows.set(u.email, { name: u.name, email: u.email, phone: u.phone ?? "", registered: true, orders: 0, spent: 0, last: null });
  }
  for (const s of stats) {
    const row = rows.get(s.email) ?? { name: s._max.name ?? "", email: s.email, phone: s._max.phone ?? "", registered: false, orders: 0, spent: 0, last: null };
    row.orders = s._count;
    row.spent = s._sum.total ?? 0;
    row.last = s._max.createdAt;
    rows.set(s.email, row);
  }
  let list = [...rows.values()].sort((a, b) => b.spent - a.spent);
  if (q) {
    const term = q.toLowerCase();
    list = list.filter((r) => r.name.toLowerCase().includes(term) || r.email.includes(term));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <form><input name="q" defaultValue={q} placeholder="Buscar…" className="input" /></form>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Tipo</th><th>Compras</th><th>Total gastado</th><th>Última compra</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.email}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td>{r.registered ? "Registrado" : "Invitado"}</td>
                <td>{r.orders}</td>
                <td>{money(r.spent)}</td>
                <td>{r.last?.toLocaleDateString("es-AR") ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-4 text-sm text-muted">Sin clientes todavía.</p>}
      </div>
    </div>
  );
}
