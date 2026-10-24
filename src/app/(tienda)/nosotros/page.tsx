import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Nosotros", alternates: { canonical: "/nosotros" } };

const values = [
  ["Ternura", "Todo lo que elegimos comunica cuidado y suavidad."],
  ["Fantasía", "La magia como lenguaje de todos los días."],
  ["Confianza", "Seguridad y transparencia para cada familia."],
  ["Juego", "La infancia es un derecho, no una etapa para apurar."],
];

export default function AboutPage() {
  return (
    <div className="container-page prose-page max-w-3xl py-12">
      <p className="font-hand text-2xl text-brand-dark">Había una vez…</p>
      <h1 className="text-[40px]">Nosotros</h1>
      <p className="mt-4 text-lg">
        En {site.name} creemos que la infancia merece magia real. Por eso elegimos cada producto como si saliera de un
        cuento: tierno, seguro y lleno de fantasía.
      </p>
      <h2>Nuestra misión</h2>
      <p>
        Acompañar a las familias con productos tiernos, seguros y llenos de fantasía, que transformen lo cotidiano en un
        pequeño cuento.
      </p>
      <h2>Lo que soñamos</h2>
      <p>Ser la tienda de referencia para familias que buscan un mundo infantil con imaginación, ternura y calidad.</p>
      <h2>Lo que nos guía</h2>
      <div className="not-prose mt-4 grid gap-4 sm:grid-cols-2">
        {values.map(([title, text], i) => (
          <div key={title} className={`rounded-[20px] p-5 ${["bg-rosa", "bg-menta", "bg-cielo", "bg-hada"][i]}`}>
            <p className="font-display text-xl font-bold">✦ {title}</p>
            <p className="mt-1">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
