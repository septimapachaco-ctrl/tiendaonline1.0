import { site } from "@/lib/site";

/**
 * Isotipo: Delfina, delfín bebé de perfil con el cuerpo en curva ascendente,
 * aleta pequeña y una burbuja junto a la aleta.
 */
export function Isotipo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* cuerpo y cola en curva ascendente */}
      <path
        d="M50 12c7 0 11 4 11 8 0 2-2 3-5 3h-4c-9 1-17 7-22 15-3 5-5 10-9 13l-2 1c1 3 1 6-1 8-2-2-5-3-8-3 1-3 4-5 7-6 2-4 4-9 7-14 6-14 15-25 26-25z"
        fill="#8ECAE6"
      />
      {/* panza */}
      <path d="M53 23c-8 1-15 7-19 14 5-5 11-9 18-11z" fill="#A8DADC" />
      {/* aleta dorsal pequeña */}
      <path d="M35 18c1-5 4-8 8-9-1 3-1 6 0 8z" fill="#8ECAE6" />
      {/* ojo con brillo y sonrisa leve */}
      <circle cx="52" cy="17" r="2.2" fill="#2B3A55" />
      <circle cx="52.8" cy="16.2" r="0.7" fill="#FDFCFB" />
      <path d="M55.5 20.6c1.2.8 2.6.8 3.8 0" stroke="#2B3A55" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* burbujas junto a la aleta */}
      <circle cx="41" cy="5" r="2.4" fill="none" stroke="#C3B1E1" strokeWidth="1.4" />
      <circle cx="46" cy="2.6" r="1.4" fill="none" stroke="#C3B1E1" strokeWidth="1.2" />
    </svg>
  );
}

/** Delfina ilustrada con burbujas que suben (se detienen con prefers-reduced-motion). */
export function Delfina({ className = "h-64 w-64" }: { className?: string }) {
  const bubbles = [
    { left: "18%", size: 14, delay: "0s" },
    { left: "34%", size: 9, delay: "2.2s" },
    { left: "62%", size: 18, delay: "1.1s" },
    { left: "78%", size: 11, delay: "3.4s" },
    { left: "48%", size: 7, delay: "4.6s" },
  ];
  return (
    <div className={`relative ${className}`} role="img" aria-label="Delfina, una delfín bebé sonriente, nadando hacia arriba">
      <div className="absolute inset-x-6 bottom-2 h-10 rounded-full bg-aqua/50 blur-xl" />
      <Isotipo className="flotar relative h-full w-full drop-shadow-[0_12px_24px_rgba(43,58,85,0.12)]" />
      {bubbles.map((b, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="burbuja absolute bottom-6 rounded-full border-2 border-white/90 bg-white/30"
          style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
}

/** Logotipo horizontal: "Pequeña" en tamaño menor y en Violeta Coral, según el manual. */
export function Logo() {
  const isBrand = site.name === "Mi Pequeña Delfina";
  return (
    <span className="flex items-center gap-2" aria-label={site.name}>
      <Isotipo className="h-9 w-9 shrink-0 md:h-10 md:w-10" />
      <span className="font-display text-xl leading-none font-bold text-profundo md:text-2xl" aria-hidden="true">
        {isBrand ? (
          <>
            Mi <span className="text-base text-violeta md:text-lg [-webkit-text-stroke:0.3px_#2B3A55]">Pequeña</span>{" "}
            Delfina
          </>
        ) : (
          site.name
        )}
      </span>
    </span>
  );
}
