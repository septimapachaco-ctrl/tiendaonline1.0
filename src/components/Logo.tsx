import { site } from "@/lib/site";

/** Isotipo: pony de perfil con cuerno, crin ondulada y estrella en la frente. */
export function Isotipo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M33 13 L41 1 L38 15 Z" fill="#FFE9A8" stroke="#B79CED" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d="M22 18c6-6 18-6 22 2 3 5 5 10 11 13 3 2 2 7-2 8-5 1-9-1-12-3-1 6-1 11 1 17H18c2-9 1-18-3-24-2-4 2-9 7-13z"
        fill="#B79CED"
      />
      <path
        d="M22 18c-6 1-11 5-12 11-1 5 2 9 1 14-1 4-4 6-3 9 5-1 9-6 9-11 0-4-2-7 0-11 1-4 3-8 5-12z"
        fill="#FFC2D9"
      />
      <path d="M26 17c-3 3-5 7-5 11" stroke="#BDE0FE" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="44" cy="25" r="2" fill="#4A4458" />
      <path d="M36 14l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#FFE9A8" />
    </svg>
  );
}

/** Logotipo horizontal: "Pequeño" en tamaño menor y Rosa Nube, según el manual. */
export function Logo() {
  const [first, ...rest] = site.name.split(" ");
  const isBrand = site.name === "Mi Pequeño Pony";
  return (
    <span className="flex items-center gap-2" aria-label={site.name}>
      <Isotipo className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
      <span className="font-display text-xl md:text-2xl leading-none font-bold text-lila" aria-hidden="true">
        {isBrand ? (
          <>
            Mi <span className="text-base text-rosa md:text-lg [-webkit-text-stroke:0.4px_#B79CED]">Pequeño</span> Pony
          </>
        ) : (
          <>
            {first} {rest.join(" ")}
          </>
        )}
      </span>
    </span>
  );
}
