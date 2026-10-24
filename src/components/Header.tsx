import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { site } from "@/lib/site";
import { CartLink } from "./CartLink";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const [session, categories] = await Promise.all([
    getSession(),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const links = [
    { href: "/productos", label: "Tienda" },
    ...categories.slice(0, 4).map((c) => ({ href: `/productos?categoria=${c.slug}`, label: c.name })),
    { href: "/contacto", label: "Contacto" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="bg-brand py-1.5 text-center text-xs text-white">
        Hasta {process.env.MP_MAX_INSTALLMENTS || 12} cuotas con Mercado Pago · Envíos a todo el país
      </div>
      <div className="container-page flex h-16 items-center gap-6">
        <MobileMenu links={links} />
        <Link href="/" className="text-xl font-bold tracking-tight text-brand">
          {site.name}
        </Link>
        <nav className="hidden flex-1 gap-5 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/80 hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4 text-sm md:ml-0">
          <form action="/productos" className="hidden lg:block">
            <input name="q" placeholder="Buscar productos…" className="input w-52" aria-label="Buscar" />
          </form>
          {session ? (
            <Link href={session.role === "CUSTOMER" ? "/cuenta" : "/admin"} className="hover:text-brand">
              {session.role === "CUSTOMER" ? "Mi cuenta" : "Panel"}
            </Link>
          ) : (
            <Link href="/login" className="hover:text-brand">
              Ingresar
            </Link>
          )}
          <CartLink />
        </div>
      </div>
    </header>
  );
}
