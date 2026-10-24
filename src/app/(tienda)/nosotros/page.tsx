import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Nosotros", alternates: { canonical: "/nosotros" } };

export default function AboutPage() {
  return (
    <div className="container-page prose-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Nosotros</h1>
      <p className="mt-4">
        {site.name} nació con una idea simple: productos bien hechos, a precios justos y con una atención
        cercana. Reemplazá este texto con la historia de tu marca desde el código o pedíselo a tu desarrollador.
      </p>
      <h2>Qué nos importa</h2>
      <ul>
        <li>Calidad en cada detalle.</li>
        <li>Atención personalizada por WhatsApp y email.</li>
        <li>Envíos rápidos y seguros a todo el país.</li>
      </ul>
    </div>
  );
}
