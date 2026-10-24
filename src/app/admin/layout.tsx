import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(tienda)/auth-actions";
import { requireStaff } from "@/lib/auth";
import { ROLES } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

const nav = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos y stock" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/mensajes", label: "Mensajes" },
  { href: "/admin/cupones", label: "Cupones", admin: true },
  { href: "/admin/envios", label: "Envíos", admin: true },
  { href: "/admin/usuarios", label: "Usuarios", admin: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-screen bg-soft md:flex">
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between p-4 md:block">
          <Link href="/admin" className="font-bold text-brand">{site.name} · Panel</Link>
          <Link href="/" className="text-xs text-muted underline md:mt-1 md:block">Ver tienda</Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 text-sm md:flex-col md:pb-0">
          {nav
            .filter((n) => !n.admin || user.role === "ADMIN")
            .map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 rounded px-3 py-2 hover:bg-soft">
                {n.label}
              </Link>
            ))}
        </nav>
        <div className="hidden p-4 text-xs text-muted md:absolute md:bottom-0 md:block">
          <p>{user.name}</p>
          <p>{ROLES[user.role]}</p>
          <form action={logout}><button className="mt-2 underline">Cerrar sesión</button></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
