import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { money, ORDER_STATUS } from "@/lib/format";
import { updateOrder } from "../../actions";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true, coupon: true } });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/pedidos" className="text-sm text-muted underline">← Pedidos</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Pedido #{order.number}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Producto</th><th>Variante</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.productName}</td><td>{i.variantName}</td><td>{i.quantity}</td>
                    <td>{money(i.unitPrice)}</td><td>{money(i.unitPrice * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <p className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></p>
              {order.discount > 0 && (
                <p className="flex justify-between"><span>Descuento {order.coupon ? `(${order.coupon.code})` : ""}</span><span>-{money(order.discount)}</span></p>
              )}
              <p className="flex justify-between"><span>{order.shippingName}</span><span>{money(order.shippingCost)}</span></p>
              <p className="flex justify-between border-t border-line pt-1 font-bold"><span>Total</span><span>{money(order.total)}</span></p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card text-sm">
              <p className="mb-2 font-semibold">Cliente</p>
              <p>{order.name}</p>
              <p><a href={`mailto:${order.email}`} className="underline">{order.email}</a></p>
              <p><a href={`https://wa.me/${order.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="underline">{order.phone}</a></p>
              {order.street && (
                <p className="mt-2">{order.street}<br />{order.city}, {order.province} ({order.zip})</p>
              )}
              {order.notes && <p className="mt-2 rounded bg-soft p-2">Nota: {order.notes}</p>}
            </div>
            <div className="card text-sm">
              <p className="mb-2 font-semibold">Pago</p>
              <p>Estado MP: {order.paymentStatus ?? "sin pago"}</p>
              <p>ID de pago: {order.paymentId ?? "—"}</p>
              <p>Medio: {order.paymentMethod ?? "—"} {order.installments ? `· ${order.installments} cuota(s)` : ""}</p>
              <p>Pagado: {order.paidAt?.toLocaleString("es-AR") ?? "—"}</p>
              <p>Creado: {order.createdAt.toLocaleString("es-AR")}</p>
            </div>
          </div>
        </div>

        <div className="card h-fit">
          <p className="mb-4 font-semibold">Gestionar</p>
          <ActionForm action={updateOrder} submitLabel="Guardar cambios">
            <input type="hidden" name="id" value={order.id} />
            <div>
              <label className="label" htmlFor="status">Estado</label>
              <select id="status" name="status" defaultValue={order.status} className="input">
                {Object.entries(ORDER_STATUS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="trackingCode">Código de seguimiento</label>
              <input id="trackingCode" name="trackingCode" defaultValue={order.trackingCode ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="adminNotes">Notas internas</label>
              <textarea id="adminNotes" name="adminNotes" rows={3} defaultValue={order.adminNotes ?? ""} className="input" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notify" defaultChecked /> Avisar al cliente por email si cambia el estado
            </label>
            <p className="text-xs text-muted">Cancelar un pedido pagado devuelve el stock. El reintegro del dinero se hace desde Mercado Pago.</p>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
