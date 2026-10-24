import { NextResponse, type NextRequest } from "next/server";
import { getPayment, mpEnabled, validWebhookSignature } from "@/lib/mercadopago";
import { applyPayment } from "@/lib/orders";

// Notificaciones de Mercado Pago. Nunca se confía en el cuerpo: se consulta el pago a la API.
export async function POST(req: NextRequest) {
  if (!mpEnabled()) return NextResponse.json({ ok: false }, { status: 503 });

  const url = req.nextUrl;
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const type = (body.type as string) ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    (body.data as { id?: string } | undefined)?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });

  if (!validWebhookSignature(req.headers, String(dataId))) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  try {
    const payment = await getPayment(String(dataId));
    if (payment.external_reference) {
      await applyPayment(payment.external_reference, {
        status: payment.status,
        paymentId: String(payment.id),
        paymentMethod: payment.payment_method_id,
        installments: payment.installments,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook mp]", err);
    // 500 hace que Mercado Pago reintente la notificación
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
