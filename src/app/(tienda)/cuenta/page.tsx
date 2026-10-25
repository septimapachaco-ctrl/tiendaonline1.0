import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, ORDER_STATUS } from "@/lib/format";
import { logout, updateProfile } from "../auth-actions";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cuenta");
  const [orders, seller] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" } }),
    db.seller.findUnique({ where: { userId: user.id }, select: { id: true } }),
  ]);

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[40px]">Hola, {user.name.split(" ")[0]}</h1>
        <form action={logout}><button className="btn-outline">Cerrar sesión</button></form>
      </div>

      <p className="mt-4 rounded-2xl bg-aqua/30 p-4 text-sm">
        {seller ? (
          <>Tenés un perfil de vendedor. <Link href="/vender/panel" className="link">Ir a mi panel de ventas</Link></>
        ) : (
          <>¿Tus peques ya no usan algo, o hacés productos para bebés y niños? <Link href="/vender" className="link">Empezá a vender</Link></>
        )}
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Mis pedidos</h2>
          {orders.length === 0 && <p className="card text-muted">Todavía no hiciste ninguna compra.</p>}
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="card text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/pedido/${o.id}`} className="link">Pedido #{o.number}</Link>
                  <span className="rounded-full bg-soft px-3 py-1 text-xs font-medium">{ORDER_STATUS[o.status]}</span>
                </div>
                <p className="text-muted">{o.createdAt.toLocaleDateString("es-AR")} · {o.shippingName}</p>
                <ul className="mt-3 space-y-1">
                  {o.items.map((i) => (
                    <li key={i.id}>{i.productName} ({i.variantName}) x{i.quantity}</li>
                  ))}
                </ul>
                {o.trackingCode && <p className="mt-2">Seguimiento: <b>{o.trackingCode}</b></p>}
                <p className="mt-3 font-semibold">Total: {money(o.total)}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="card h-fit">
          <h2 className="mb-4 text-lg font-semibold">Mis datos</h2>
          <ActionForm action={updateProfile} submitLabel="Guardar">
            <div>
              <label className="label" htmlFor="name">Nombre</label>
              <input id="name" name="name" defaultValue={user.name} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={user.email} disabled className="input bg-soft" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Teléfono</label>
              <input id="phone" name="phone" defaultValue={user.phone ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="password">Nueva contraseña (opcional)</label>
              <input id="password" name="password" type="password" className="input" autoComplete="new-password" />
            </div>
          </ActionForm>
        </aside>
      </div>
    </div>
  );
}
