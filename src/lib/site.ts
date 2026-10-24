export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Mi Pequeña Delfina",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  description:
    "Artículos para bebés y niños con calma de mar 🐬 Ropa, juguetes, decoración y cuidado. Envíos a todo el país.",
};
