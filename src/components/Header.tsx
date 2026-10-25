import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CartLink } from "./CartLink";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const [user, categories] = await Promise.all([
    // se valida contra la base: una cookie vieja no debe mostrar "Panel" ni "Mi cuenta"
    getCurrentUser(),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const links = [
    { href: "/productos", label: "Tienda" },
    ...categories.slice(0, 3).map((c) => ({ href: `/productos?categoria=${c.slug}`, label: c.name })),
    { href: "/vender", label: "Vender" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 shadow-[0_2px_20px_rgba(43,58,85,0.06)] backdrop-blur">
      <div className="bg-firma py-1.5 text-center text-sm text-ink">
        Hasta {process.env.MP_MAX_INSTALLMENTS || 12} cuotas con Mercado Pago · Envíos a todo el país
      </div>
      <div className="container-page relative flex h-18 items-center gap-3 md:gap-6">
        <MobileMenu links={links} />
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden flex-1 gap-5 font-semibold md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink hover:underline decoration-marea decoration-2 underline-offset-4">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm font-semibold md:ml-0 md:gap-4">
          <form action="/productos" className="hidden xl:block">
            <input name="q" placeholder="Buscar un tesoro…" className="input w-52" aria-label="Buscar" />
          </form>
          {user ? (
            <Link href={user.role === "CUSTOMER" ? "/cuenta" : "/admin"} className="hover:underline decoration-marea decoration-2 underline-offset-4">
              {user.role === "CUSTOMER" ? "Mi cuenta" : "Panel"}
            </Link>
          ) : (
            <Link href="/login" className="hover:underline decoration-marea decoration-2 underline-offset-4">
              Ingresar
            </Link>
          )}
          <CartLink />
        </div>
      </div>
    </header>
  );
}
