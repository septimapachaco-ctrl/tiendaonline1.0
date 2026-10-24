import type { Metadata } from "next";
import { Delfina } from "@/components/Logo";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Nosotros", alternates: { canonical: "/nosotros" } };

const values = [
  ["Ternura", "Todo lo que elegimos comunica cuidado y suavidad."],
  ["Calma", "El mar como metáfora de un entorno seguro."],
  ["Curiosidad", "Descubrir el mundo jugando."],
  ["Confianza", "Seguridad y transparencia para cada familia."],
];

export default function AboutPage() {
  return (
    <div className="container-page prose-page max-w-3xl py-12">
      <p className="font-hand text-2xl">Había una vez, en el fondo del mar…</p>
      <h1 className="text-[40px]">Nosotros</h1>
      <p className="mt-4 text-lg">
        En {site.name} creemos que la infancia merece un mundo sereno y luminoso. Por eso elegimos cada producto como si
        lo hubiéramos traído del fondo del mar: tierno, seguro y lleno de imaginación.
      </p>

      <div className="my-8 grid items-center gap-6 rounded-[24px] bg-aqua/30 p-6 sm:grid-cols-[160px_1fr]">
        <Delfina className="mx-auto h-36 w-36" />
        <div>
          <h2 className="!mt-0">Conocé a Delfina</h2>
          <p className="!mb-0">
            Es una delfín bebé curiosa y valiente, de unos pocos meses, que explora el mar acompañada de su familia. Entre
            praderas de algas, corales y burbujas, es la guía de nuestra tienda: te acompaña en cada paso de tu compra.
          </p>
        </div>
      </div>

      <h2>Nuestra misión</h2>
      <p>
        Ofrecer productos tiernos, seguros y llenos de imaginación, que transformen lo cotidiano en una pequeña aventura
        marina.
      </p>
      <h2>Lo que soñamos</h2>
      <p>Ser la tienda de referencia para familias que buscan un mundo infantil sereno, luminoso y con alma.</p>
      <h2>Lo que nos guía</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {values.map(([title, text], i) => (
          <div key={title} className={`rounded-[20px] p-5 ${["bg-aqua/50", "bg-arena", "bg-marea/40", "bg-aqua/30"][i]}`}>
            <p className="font-display text-xl font-bold">{title}</p>
            <p className="mt-1">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
