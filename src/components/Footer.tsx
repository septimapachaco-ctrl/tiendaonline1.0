import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-soft">
      <div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-brand">{site.name}</p>
          <p className="mt-2 text-muted">{site.description}</p>
        </div>
        <div>
          <p className="mb-2 font-semibold">Información</p>
          <ul className="space-y-1.5 text-muted">
            <li><Link href="/nosotros" className="hover:text-ink">Nosotros</Link></li>
            <li><Link href="/envios" className="hover:text-ink">Envíos y retiros</Link></li>
            <li><Link href="/terminos" className="hover:text-ink">Términos y condiciones</Link></li>
            <li><Link href="/contacto" className="hover:text-ink">Contacto</Link></li>
            <li><Link href="/contacto?motivo=arrepentimiento" className="hover:text-ink">Botón de arrepentimiento</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-semibold">Medios de pago</p>
          <p className="text-muted">
            Tarjetas de crédito y débito, dinero en cuenta de Mercado Pago y cuotas.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
