export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Mi Tienda",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  description: "Tienda online oficial. Pagá con Mercado Pago en cuotas y recibí en todo el país.",
};
