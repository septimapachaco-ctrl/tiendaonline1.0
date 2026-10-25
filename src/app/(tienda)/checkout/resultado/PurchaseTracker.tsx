"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";
import { track } from "@/lib/track";

export function PurchaseTracker({ orderId, value, variantIds }: { orderId: string; value: number; variantIds: string[] }) {
  const { removeMany, ready } = useCart();

  // Se quitan de la canasta solo los productos pagados (puede haber otros vendedores pendientes)
  const ids = variantIds.join(",");
  useEffect(() => {
    if (ready) removeMany(ids.split(","));
  }, [ready, removeMany, ids]);

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
