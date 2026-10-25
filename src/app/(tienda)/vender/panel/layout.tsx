import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { demoPayments, requireSeller } from "@/lib/sellers";
import { SELLER_KINDS } from "@/lib/settings";

export const metadata: Metadata = { title: "Mi panel de vendedor", robots: { index: false } };

export default async function SellerPanelLayout({ children }: { children: React.ReactNode }) {
  const { seller } = await requireSeller();
  const [pendingQuestions, toShip] = await Promise.all([
    db.question.count({ where: { product: { sellerId: seller.id }, answer: null, hidden: false } }),
    db.order.count({ where: { sellerId: seller.id, status: { in: ["PAID", "PREPARING"] } } }),
  ]);
  const nav = [
    { href: "/vender/panel", label: "Resumen" },
    { href: "/vender/panel/publicaciones", label: "Publicaciones" },
    { href: "/vender/panel/ventas", label: `Ventas${toShip ? ` (${toShip})` : ""}` },
    { href: "/vender/panel/preguntas", label: `Preguntas${pendingQuestions ? ` (${pendingQuestions})` : ""}` },
    { href: "/vender/panel/perfil", label: "Perfil y cobros" },
  ];

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{SELLER_KINDS[seller.kind]?.label}</p>
          <h1 className="text-[32px]">{seller.displayName}</h1>
        </div>
        <Link href={`/vendedores/${seller.slug}`} className="link text-sm">Ver mi perfil público</Link>
      </div>

      {seller.status !== "ACTIVE" && (
        <p className="mt-4 rounded-2xl bg-anemona/40 p-4 text-sm">
          Tu cuenta de vendedor está suspendida y tus publicaciones no se muestran. Escribinos desde contacto.
        </p>
      )}
      {seller.status === "ACTIVE" && !seller.mpAccessToken && (
        <div className="mt-4 rounded-2xl bg-arena p-4 text-sm">
          {demoPayments() ? (
            <p>Modo demostración: podés vender sin conectar Mercado Pago. En la página publicada vas a tener que conectarlo.</p>
          ) : (
            <p>
              <b>Conectá tu cuenta de Mercado Pago para empezar a vender.</b> Hasta entonces tus publicaciones no se muestran.{" "}
              <a href="/vender/mercadopago" className="link">Conectar ahora</a>
            </p>
          )}
        </div>
      )}

      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-2 text-sm font-semibold">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 rounded-2xl px-4 py-2 hover:bg-aqua/30">
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
