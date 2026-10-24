import Link from "next/link";
import { site } from "@/lib/site";
import { Isotipo } from "./Logo";
import { Olas } from "./Olas";

const linkClass = "hover:underline decoration-marea decoration-2 underline-offset-4";

export function Footer() {
  return (
    <footer className="mt-20">
      <Olas className="text-arena" />
      <div className="bg-arena">
        <div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Isotipo />
              <p className="font-display text-xl font-bold">{site.name}</p>
            </div>
            <p className="mt-3">{site.description}</p>
            <p className="mt-3 font-hand text-2xl">Hecho con calma de mar</p>
          </div>
          <div>
            <p className="mb-2 font-display text-lg font-semibold">Información</p>
            <ul className="space-y-1.5">
              <li><Link href="/nosotros" className={linkClass}>Nosotros</Link></li>
              <li><Link href="/envios" className={linkClass}>Envíos y retiros</Link></li>
              <li><Link href="/terminos" className={linkClass}>Términos y condiciones</Link></li>
              <li><Link href="/contacto" className={linkClass}>Contacto</Link></li>
              <li><Link href="/contacto?motivo=arrepentimiento" className={linkClass}>Botón de arrepentimiento</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-display text-lg font-semibold">Medios de pago</p>
            <p>Tarjetas de crédito y débito, dinero en cuenta de Mercado Pago y cuotas.</p>
          </div>
        </div>
        <div className="border-t border-white/70 py-4 text-center text-xs">
          © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
