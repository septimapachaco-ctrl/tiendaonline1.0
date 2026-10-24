"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/format";
import { track } from "@/lib/track";
import { checkCoupon, placeOrder } from "./actions";

type Zone = { id: string; name: string; price: number; isPickup: boolean };
type Defaults = Record<"name" | "email" | "phone" | "street" | "city" | "province" | "zip", string>;

export function CheckoutForm({ zones, defaults, loggedIn }: { zones: Zone[]; defaults: Defaults; loggedIn: boolean }) {
  const cart = useCart();
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const zone = zones.find((z) => z.id === zoneId);
  const lines = cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const discount = coupon?.discount ?? 0;
  const total = cart.subtotal - discount + (zone?.price ?? 0);

  if (!cart.ready) return null;
  if (cart.items.length === 0) {
    return (
      <p className="mt-6">
        Tu carrito está vacío. <Link href="/productos" className="underline">Ver productos</Link>
      </p>
    );
  }

  function applyCoupon() {
    setCouponMsg("");
    startTransition(async () => {
      const res = await checkCoupon(couponInput, lines);
      if (res.ok) {
        setCoupon({ code: res.code, discount: res.discount });
        setCouponMsg(`Cupón ${res.code} aplicado.`);
      } else {
        setCoupon(null);
        setCouponMsg(res.error);
      }
    });
  }

  function submit(formData: FormData) {
    setError("");
    const input = Object.fromEntries(formData) as Record<string, string>;
    track("begin_checkout", { currency: "ARS", value: total });
    startTransition(async () => {
      const res = await placeOrder({ ...input, zoneId, coupon: coupon?.code } as never, lines);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.href = res.redirectUrl;
    });
  }

  return (
    <form action={submit} className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tus datos</h2>
            {!loggedIn && (
              <Link href="/login?next=/checkout" className="text-sm text-brand underline">¿Ya tenés cuenta? Ingresá</Link>
            )}
          </div>
          <Field name="name" label="Nombre y apellido" defaultValue={defaults.name} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label="Email" type="email" defaultValue={defaults.email} required />
            <Field name="phone" label="Teléfono" type="tel" defaultValue={defaults.phone} required />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Entrega</h2>
          {zones.length === 0 && <p className="text-sm text-red-700">No hay formas de entrega configuradas.</p>}
          <div className="space-y-2">
            {zones.map((z) => (
              <label key={z.id} className={`flex min-h-11 cursor-pointer items-center justify-between rounded-2xl border-2 p-3 text-sm ${zoneId === z.id ? "border-lila bg-lila/10" : "border-line"}`}>
                <span className="flex items-center gap-2">
                  <input type="radio" name="zone" checked={zoneId === z.id} onChange={() => setZoneId(z.id)} />
                  {z.isPickup ? `Retiro en ${z.name}` : `Envío a ${z.name}`}
                </span>
                <span className="font-semibold">{z.price === 0 ? "Gratis" : money(z.price)}</span>
              </label>
            ))}
          </div>
          {zone && !zone.isPickup && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field name="street" label="Calle, número, piso/depto" defaultValue={defaults.street} required />
              </div>
              <Field name="city" label="Localidad" defaultValue={defaults.city} required />
              <Field name="province" label="Provincia" defaultValue={defaults.province} required />
              <Field name="zip" label="Código postal" defaultValue={defaults.zip} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="notes">Notas del pedido (opcional)</label>
            <textarea id="notes" name="notes" rows={2} className="input" />
          </div>
        </section>
      </div>

      <aside className="card h-fit space-y-3 text-sm">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <ul className="space-y-2 border-b border-line pb-3">
          {cart.items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-2">
              <span>{i.productName} <span className="text-muted">({i.variantName}) x{i.quantity}</span></span>
              <span>{money(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Cupón de descuento" className="input" />
          <button type="button" className="btn-outline" onClick={applyCoupon} disabled={!couponInput || pending}>Aplicar</button>
        </div>
        {couponMsg && <p className={coupon ? "text-green-700" : "text-red-700"}>{couponMsg}</p>}
        <Row label="Subtotal" value={money(cart.subtotal)} />
        {discount > 0 && <Row label="Descuento" value={`-${money(discount)}`} />}
        <Row label="Entrega" value={zone ? (zone.price === 0 ? "Gratis" : money(zone.price)) : "—"} />
        <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
        {error && <p className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
        <button className="btn w-full" disabled={pending || !zone}>
          {pending ? "Preparando tu pedido…" : "Pagar con Mercado Pago"}
        </button>
        <p className="text-center text-xs text-muted">
          Vas a ser redirigido a Mercado Pago para pagar con tarjeta, débito o dinero en cuenta.
        </p>
      </aside>
    </form>
  );
}

function Field(props: { name: string; label: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <input id={props.name} name={props.name} type={props.type ?? "text"} defaultValue={props.defaultValue} required={props.required} className="input" />
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
