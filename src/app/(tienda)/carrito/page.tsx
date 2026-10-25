"use client";

import Link from "next/link";
import { sellerKeyOf, STORE_KEY, useCart, type CartItem } from "@/components/CartProvider";
import { Delfina } from "@/components/Logo";
import { money } from "@/lib/format";
import { site } from "@/lib/site";

export default function CartPage() {
  const cart = useCart();

  if (!cart.ready) return <div className="container-page py-16" />;

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <Delfina className="mx-auto mb-6 h-36 w-36" />
        <h1 className="text-[28px]">Tu canasta está vacía, como una playa al amanecer</h1>
        <Link href="/productos" className="btn mt-6">Descubrir la tienda</Link>
      </div>
    );
  }

  // cada vendedor cobra en su propia cuenta de Mercado Pago: se paga un grupo por vez
  const groups = new Map<string, CartItem[]>();
  for (const item of cart.items) {
    const key = sellerKeyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-[40px]">Tu canasta</h1>
      {groups.size > 1 && (
        <p className="mt-2 text-muted">
          Tenés productos de {groups.size} vendedores. Cada uno se paga por separado, así el dinero le llega directo a quien
          vende.
        </p>
      )}
      <div className="mt-8 space-y-8">
        {[...groups.entries()].map(([key, items]) => {
          const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
          const sellerName = key === STORE_KEY ? site.name : (items[0].sellerName ?? "Vendedor");
          return (
            <section key={key} className="grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="card py-2">
                <p className="border-b border-line py-2 text-sm text-muted">
                  Vende: <b className="text-profundo">{sellerName}</b>
                </p>
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.variantId} className="flex gap-4 py-4">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-espuma">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {item.image && <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <Link href={`/productos/${item.slug}`} className="font-medium hover:underline decoration-marea decoration-2 underline-offset-4">{item.productName}</Link>
                        <p className="text-sm text-muted">{item.variantName}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center rounded-3xl border-2 border-line bg-white text-sm">
                            <button className="h-11 w-11" onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)} aria-label="Restar">−</button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button className="h-11 w-11" onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)} aria-label="Sumar">+</button>
                          </div>
                          <button className="min-h-11 px-2 text-sm text-muted underline" onClick={() => cart.remove(item.variantId)}>Quitar</button>
                        </div>
                      </div>
                      <p className="font-semibold">{money(item.unitPrice * item.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <aside className="card h-fit space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">{money(subtotal)}</span>
                </div>
                <p className="text-sm text-muted">La entrega se elige en el siguiente paso.</p>
                <Link href={`/checkout?vendedor=${encodeURIComponent(key)}`} className="btn w-full">
                  {groups.size > 1 ? `Comprar a ${sellerName}` : "Continuar la compra"}
                </Link>
              </aside>
            </section>
          );
        })}
      </div>
      <Link href="/productos" className="mt-8 inline-block text-sm text-muted underline">Seguir comprando</Link>
    </div>
  );
}
