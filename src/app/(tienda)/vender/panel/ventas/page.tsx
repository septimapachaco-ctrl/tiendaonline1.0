import { ActionForm } from "@/components/ActionForm";
import { StatusBadge } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { requireSeller } from "@/lib/sellers";
import { confirmHandDelivery, sellerUpdateOrder } from "../../actions";

export const dynamic = "force-dynamic";

const DELIVERY: Record<string, string> = { SHIPPING: "Envío por correo", HAND: "Entrega en mano", PICKUP: "Retiro" };

export default async function SellerSales() {
  const { seller } = await requireSeller();
  const orders = await db.order.findMany({
    where: { sellerId: seller.id, status: { not: "PENDING" } },
    include: { items: true, review: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-[28px]">Mis ventas</h2>
      {orders.length === 0 && <p className="card text-muted">Todavía no tenés ventas.</p>}
      {orders.map((o) => {
        const paid = o.status !== "CANCELLED";
        const net = o.subtotal - o.commission + o.shippingCost;
        return (
          <article key={o.id} className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-lg font-semibold">Venta #{o.number}</p>
              <StatusBadge status={o.status} />
            </div>
            <ul className="text-sm">
              {o.items.map((i) => (
                <li key={i.id}>{i.productName} ({i.variantName}) x{i.quantity} · {money(i.unitPrice * i.quantity)}</li>
              ))}
            </ul>
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-soft p-3">
                <p className="font-semibold">{DELIVERY[o.deliveryMethod]}</p>
                {paid ? (
                  <>
                    <p className="mt-1">{o.name} · {o.phone}</p>
                    {o.street && <p>{o.street}, {o.city}, {o.province} ({o.zip})</p>}
                    {o.notes && <p className="mt-1 text-muted">Nota: {o.notes}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-muted">Pedido cancelado.</p>
                )}
              </div>
              <div className="rounded-2xl bg-soft p-3">
                <p>Productos: {money(o.subtotal)}</p>
                <p>Comisión ({o.commissionPct} %): -{money(o.commission)}</p>
                {o.shippingCost > 0 && <p>Envío (lo cobrás vos): {money(o.shippingCost)}</p>}
                <p className="font-semibold">Te queda: {money(net)}</p>
                <p className="text-xs text-muted">Antes de la tarifa de Mercado Pago.</p>
              </div>
            </div>

            {["PAID", "PREPARING", "SHIPPED"].includes(o.status) && o.deliveryMethod === "SHIPPING" && (
              <ActionForm action={sellerUpdateOrder} submitLabel="Guardar" className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={o.id} />
                <div>
                  <label className="label" htmlFor={`st-${o.id}`}>Estado</label>
                  <select id={`st-${o.id}`} name="status" defaultValue={o.status === "PAID" ? "PREPARING" : o.status} className="input">
                    <option value="PREPARING">En preparación</option>
                    <option value="SHIPPED">Enviado</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`tr-${o.id}`}>Código de seguimiento</label>
                  <input id={`tr-${o.id}`} name="trackingCode" defaultValue={o.trackingCode ?? ""} className="input" />
                </div>
              </ActionForm>
            )}

            {["PAID", "PREPARING"].includes(o.status) && o.deliveryMethod === "HAND" && (
              <div className="rounded-2xl border-2 border-marea p-3">
                <p className="text-sm">
                  Coordiná la entrega con {o.name.split(" ")[0]}. Cuando le entregues el producto, pedile el{" "}
                  <b>código de 4 dígitos</b> que recibió por email y cargalo acá.
                </p>
                <ActionForm action={confirmHandDelivery} submitLabel="Confirmar entrega" className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <input name="code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required placeholder="0000" className="input w-28 text-center text-lg tracking-widest" aria-label="Código de entrega" />
                </ActionForm>
              </div>
            )}

            {o.review && (
              <p className="text-sm">Calificación: {"★".repeat(o.review.rating)}{"☆".repeat(5 - o.review.rating)} {o.review.comment && `· “${o.review.comment}”`}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
