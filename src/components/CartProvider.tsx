"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

// El carrito vive en el navegador; precios y stock se revalidan en el servidor al pagar.
export type CartItem = {
  variantId: string;
  productName: string;
  variantName: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  /** id del vendedor o "tienda"; cada vendedor se paga por separado */
  sellerKey?: string;
  sellerName?: string;
};

export const STORE_KEY = "tienda";
export const sellerKeyOf = (i: Pick<CartItem, "sellerKey">) => i.sellerKey ?? STORE_KEY;

type CartContext = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  removeMany: (variantIds: string[]) => void;
};

const Ctx = createContext<CartContext | null>(null);
const KEY = "cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const value = useMemo<CartContext>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      add: (item) =>
        setItems((prev) => {
          const found = prev.find((p) => p.variantId === item.variantId);
          if (!found) return [...prev, { ...item, quantity: Math.min(item.quantity, item.stock) }];
          return prev.map((p) =>
            p.variantId === item.variantId
              ? { ...p, ...item, quantity: Math.min(p.quantity + item.quantity, item.stock) }
              : p,
          );
        }),
      setQuantity: (variantId, quantity) =>
        setItems((prev) =>
          prev.map((p) =>
            p.variantId === variantId ? { ...p, quantity: Math.max(1, Math.min(quantity, p.stock)) } : p,
          ),
        ),
      remove: (variantId) => setItems((prev) => prev.filter((p) => p.variantId !== variantId)),
      clear: () => setItems((prev) => (prev.length ? [] : prev)),
      removeMany: (ids) =>
        setItems((prev) => (prev.some((p) => ids.includes(p.variantId)) ? prev.filter((p) => !ids.includes(p.variantId)) : prev)),
    }),
    [items, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart fuera de CartProvider");
  return ctx;
}
