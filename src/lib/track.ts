/** Dispara un evento en GA y Meta si están cargados (uso desde componentes cliente). */
export function track(event: "add_to_cart" | "begin_checkout" | "purchase", data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
  w.gtag?.("event", event, data);
  const metaName = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" }[event];
  w.fbq?.("track", metaName, data);
}
