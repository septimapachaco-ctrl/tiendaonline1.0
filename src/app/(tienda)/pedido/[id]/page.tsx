import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Delfina } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, ORDER_STATUS } from "@/lib/format";

export const metadata: Metadata = { title: "Estado de tu pedido", robots: { index: false } };

const STEPS = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;

/**
 * Seguimiento de un pedido sin necesidad de cuenta. Se accede con el enlace del email:
 * el id del pedido es largo y aleatorio, por eso funciona como enlace privado.
 */
export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, user] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true } }),
    getCurrentUser(),
  ]);
  if (!order) notFound();

  const cancelled = order.status === "CANCELLED";
  const current = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="text-center">
        <Delfina className="mx-auto h-32 w-32" />
        <h1 className="mt-4 text-[32px] md:text-[40px]">Pedido #{order.number}</h1>
        <p className="mt-2 text-muted">
          Hecho el {order.createdAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="mt-3 inline-block rounded-full bg-aqua/50 px-4 py-1 font-semibold">
          {ORDER_STATUS[order.status] ?? order.status}
        </p>
      </div>

      {cancelled ? (
        <p className="card mt-8 text-center">
          Este pedido fue cancelado. Si tenés dudas, escribinos desde{" "}
          <Link href="/contacto" className="link">contacto</Link>.
        </p>
      ) : order.status === "PENDING" ? (
        <p className="card mt-8 text-center">
          Todavía estamos esperando la acreditación del pago. Cuando Mercado Pago lo confirme, te avisamos por email.
        </p>
      ) : (
        <ol className="card mt-8 grid gap-4 sm:grid-cols-4" aria-label="Recorrido del pedido">
          {STEPS.map((step, i) => {
            const done = i <= current;
            return (
              <li key={step} className="flex items-center gap-3 sm:flex-col sm:text-center">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    done ? "border-profundo bg-marea" : "border-line bg-white text-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={done ? "font-semibold" : "text-muted"}>
                  {ORDER_STATUS[step]}
                  <span className="sr-only">{done ? " (completado)" : " (pendiente)"}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.trackingCode && (
        <p className="card mt-4 text-center">
          Código de seguimiento: <b className="font-mono">{order.trackingCode}</b>
        </p>
      )}

      <section className="card mt-4">
        <h2 className="mb-3 text-[22px]">Detalle</h2>
        <ul className="divide-y divide-line text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>
                {i.productName} <span className="text-muted">({i.variantName}) x{i.quantity}</span>
              </span>
              <span>{money(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          <Row label="Subtotal" value={money(order.subtotal)} />
          {order.discount > 0 && <Row label="Descuento" value={`-${money(order.discount)}`} />}
          <Row label={order.shippingName} value={order.shippingCost === 0 ? "Gratis" : money(order.shippingCost)} />
          <div className="flex justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
        </div>
        {order.street && (
          <p className="mt-4 text-sm text-muted">
            Envío a: {order.street}, {order.city}, {order.province} ({order.zip})
          </p>
        )}
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/productos" className="btn">Seguir comprando</Link>
        {user && <Link href="/cuenta" className="btn-outline">Mis pedidos</Link>}
        <Link href="/contacto" className="btn-outline">¿Dudas? Escribinos</Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
