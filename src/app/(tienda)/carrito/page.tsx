"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { money } from "@/lib/format";

export default function CartPage() {
  const cart = useCart();

  if (!cart.ready) return <div className="container-page py-16" />;

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <Link href="/productos" className="btn mt-6">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">Carrito</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((item) => (
            <li key={item.variantId} className="flex gap-4 py-4">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.image && <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <Link href={`/productos/${item.slug}`} className="font-medium hover:text-brand">{item.productName}</Link>
                <p className="text-sm text-muted">{item.variantName}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-line text-sm">
                    <button className="px-3 py-1" onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)} aria-label="Restar">−</button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button className="px-3 py-1" onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)} aria-label="Sumar">+</button>
                  </div>
                  <button className="text-sm text-muted underline" onClick={() => cart.remove(item.variantId)}>Quitar</button>
                </div>
              </div>
              <p className="font-semibold">{money(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{money(cart.subtotal)}</span>
          </div>
          <p className="text-sm text-muted">El envío y los cupones se calculan en el siguiente paso.</p>
          <Link href="/checkout" className="btn w-full">Iniciar compra</Link>
          <Link href="/productos" className="block text-center text-sm text-muted underline">Seguir comprando</Link>
        </aside>
      </div>
    </div>
  );
}
