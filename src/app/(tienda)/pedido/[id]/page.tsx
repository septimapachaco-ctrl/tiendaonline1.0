import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Delfina } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, ORDER_STATUS } from "@/lib/format";
import { confirmReceived, reviewOrder } from "../../marketplace-actions";

export const metadata: Metadata = { title: "Estado de tu pedido", robots: { index: false } };

const STEPS = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;

/**
 * Seguimiento de un pedido sin necesidad de cuenta. Se accede con el enlace del email:
 * el id del pedido es largo y aleatorio, por eso funciona como enlace privado.
 */
export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, user] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true, seller: true, review: true } }),
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

      {order.seller && <p className="mt-6 text-center text-sm">Vende: <b>{order.seller.displayName}</b></p>}

      {order.deliveryMethod === "HAND" && order.deliveryCode && ["PAID", "PREPARING"].includes(order.status) && (
        <div className="mt-4 rounded-[20px] bg-aqua/40 p-5 text-center">
          <p>Elegiste entrega en mano en {order.seller?.city}. Tu código de entrega es:</p>
          <p className="my-2 font-mono text-4xl font-bold tracking-[0.4em]">{order.deliveryCode}</p>
          <p className="text-sm">
            Quien te vende ya tiene tus datos para coordinar. Dale el código <b>solo cuando tengas el producto en tus
            manos</b> y lo hayas revisado.
          </p>
        </div>
      )}

      {order.status === "SHIPPED" && order.sellerId && (
        <form action={confirmReceived} className="card mt-4 text-center">
          <input type="hidden" name="id" value={order.id} />
          <p className="mb-3">¿Ya te llegó? Avisanos para cerrar la compra y poder calificar a quien te vendió.</p>
          <button className="btn">Ya lo recibí</button>
        </form>
      )}

      {order.status === "DELIVERED" && order.sellerId && (
        <div className="card mt-4">
          {order.review ? (
            <p className="text-center">
              Calificaste con {"★".repeat(order.review.rating)}{"☆".repeat(5 - order.review.rating)}. ¡Gracias!
            </p>
          ) : (
            <>
              <h2 className="text-[22px]">¿Cómo fue tu compra?</h2>
              <p className="mb-3 text-sm text-muted">Tu opinión ayuda a otras familias a comprar con confianza.</p>
              <ActionForm action={reviewOrder} submitLabel="Enviar calificación">
                <input type="hidden" name="id" value={order.id} />
                <fieldset className="flex flex-wrap gap-2">
                  <legend className="label">Calificación</legend>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <label key={n} className="flex min-h-11 cursor-pointer items-center gap-1 rounded-2xl border-2 border-line px-3 has-[:checked]:border-marea has-[:checked]:bg-aqua/30">
                      <input type="radio" name="rating" value={n} required defaultChecked={n === 5} />
                      <span aria-hidden="true">{"★".repeat(n)}</span>
                      <span className="sr-only">{n} estrellas</span>
                    </label>
                  ))}
                </fieldset>
                <textarea name="comment" rows={2} maxLength={500} className="input" placeholder="Contanos cómo te fue (opcional)" aria-label="Comentario" />
              </ActionForm>
            </>
          )}
        </div>
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
