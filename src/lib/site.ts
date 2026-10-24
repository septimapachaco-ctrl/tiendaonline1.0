export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Mi Pequeño Pony",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  description:
    "Artículos para bebés y niños con un poquito de magia ✨ Ropa, juguetes, decoración y cuidado. Envíos a todo el país.",
};
