/** Olas suaves de dos líneas para cerrar banners. Toma el color de `currentColor`. */
export function Olas({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={`block h-8 w-full md:h-12 ${className}`} aria-hidden="true">
      <path d="M0 30c120-20 240-20 360 0s240 20 360 0 240-20 360 0 240 20 360 0v30H0z" fill="currentColor" opacity="0.55" />
      <path d="M0 42c120-16 240-16 360 0s240 16 360 0 240-16 360 0 240 16 360 0v18H0z" fill="currentColor" />
    </svg>
  );
}
