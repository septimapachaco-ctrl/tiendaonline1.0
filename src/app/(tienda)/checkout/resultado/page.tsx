import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, ORDER_STATUS } from "@/lib/format";
import { getPayment, mpEnabled } from "@/lib/mercadopago";
import { applyPayment } from "@/lib/orders";
import { Delfina } from "@/components/Logo";
import { PurchaseTracker } from "./PurchaseTracker";

export const metadata: Metadata = { title: "Estado de tu compra", robots: { index: false } };

type SP = Promise<Record<string, string | undefined>>;

export default async function ResultPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const orderId = sp.order ?? sp.external_reference;
  if (!orderId) return <Message title="No encontramos el pedido" />;

  // Al volver de Mercado Pago se consulta el pago directamente, por si el webhook todavía no llegó.
  const paymentId = sp.payment_id ?? sp.collection_id;
  if (paymentId && paymentId !== "null" && mpEnabled()) {
    try {
      const payment = await getPayment(paymentId);
      if (payment.external_reference === orderId) {
        await applyPayment(orderId, {
          status: payment.status,
          paymentId: String(payment.id),
          paymentMethod: payment.payment_method_id,
          installments: payment.installments,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const [order, user] = await Promise.all([db.order.findUnique({ where: { id: orderId } }), getCurrentUser()]);
  if (!order) return <Message title="No encontramos el pedido" />;

  const paid = order.paidAt != null;
  const pending = !paid && order.status === "PENDING";
  return (
    <div className="container-page max-w-xl py-16 text-center">
      {paid && <PurchaseTracker orderId={order.id} value={order.total} />}
      {paid ? <Delfina className="mx-auto h-40 w-40" /> : <p className="text-5xl" aria-hidden="true">{pending ? "🌙" : "🌊"}</p>}
      <h1 className="mt-4 text-[40px]">
        {paid ? "Tu pedido ya está nadando hacia vos" : pending ? "Tu pago está en camino, como una ola" : "El pago no se completó"}
      </h1>
      <p className="mt-3 text-muted">
        Pedido <b>#{order.number}</b> · {money(order.total)} · Estado: {ORDER_STATUS[order.status]}
      </p>
      {sp.demo && (
        <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
          Modo demostración: el pago se aprobó automáticamente porque Mercado Pago no está configurado.
        </p>
      )}
      <p className="mt-4 text-sm">
        {paid
          ? `Te enviamos la confirmación a ${order.email}, con un enlace para seguir tu pedido.`
          : pending
            ? "Cuando Mercado Pago acredite el pago te avisamos por email."
            : "No se realizó ningún cobro. Podés intentarlo de nuevo cuando quieras o escribirnos por WhatsApp."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/productos" className="btn">Seguir comprando</Link>
        {user ? (
          <Link href="/cuenta" className="btn-outline">Mis pedidos</Link>
        ) : (
          <Link href={`/pedido/${order.id}`} className="btn-outline">Ver el estado de mi pedido</Link>
        )}
      </div>
    </div>
  );
}

function Message({ title }: { title: string }) {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-[28px]">{title}</h1>
      <Link href="/" className="btn mt-6">Volver al inicio</Link>
    </div>
  );
}
