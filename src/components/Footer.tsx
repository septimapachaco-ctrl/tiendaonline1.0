import Link from "next/link";
import { site } from "@/lib/site";
import { Isotipo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 bg-firma">
      <div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Isotipo />
            <p className="font-display text-xl font-bold">{site.name}</p>
          </div>
          <p className="mt-3">{site.description}</p>
          <p className="mt-3 font-hand text-2xl text-brand-dark">Hecho con magia</p>
        </div>
        <div>
          <p className="mb-2 font-display text-lg font-semibold">Información</p>
          <ul className="space-y-1.5">
            <li><Link href="/nosotros" className="hover:text-brand-dark hover:underline">Nosotros</Link></li>
            <li><Link href="/envios" className="hover:text-brand-dark hover:underline">Envíos y retiros</Link></li>
            <li><Link href="/terminos" className="hover:text-brand-dark hover:underline">Términos y condiciones</Link></li>
            <li><Link href="/contacto" className="hover:text-brand-dark hover:underline">Contacto</Link></li>
            <li><Link href="/contacto?motivo=arrepentimiento" className="hover:text-brand-dark hover:underline">Botón de arrepentimiento</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-display text-lg font-semibold">Medios de pago</p>
          <p>Tarjetas de crédito y débito, dinero en cuenta de Mercado Pago y cuotas.</p>
        </div>
      </div>
      <div className="border-t border-white/60 py-4 text-center text-xs">
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
