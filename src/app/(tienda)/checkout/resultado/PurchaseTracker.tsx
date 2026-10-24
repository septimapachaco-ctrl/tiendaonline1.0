"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";
import { track } from "@/lib/track";

export function PurchaseTracker({ orderId, value }: { orderId: string; value: number }) {
  const { clear, ready } = useCart();

  // El carrito se vacía recién cuando el pago está aprobado
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);

  useEffect(() => {
    const key = `tracked-${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track("purchase", { currency: "ARS", value, transaction_id: orderId });
  }, [orderId, value]);
  return null;
}
