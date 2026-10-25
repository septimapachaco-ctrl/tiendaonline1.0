import type { Metadata } from "next";
import Link from "next/link";
import { Delfina } from "@/components/Logo";
import { getCommissions } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Vendé en Mi Pequeña Delfina",
  description: "Vendé la ropa, juguetes y artículos que tus peques ya no usan, o tus productos hechos a mano para bebés y niños.",
  alternates: { canonical: "/vender" },
};
export const dynamic = "force-dynamic";

export default async function SellLanding() {
  const commissions = await getCommissions();
  return (
    <>
      <section className="bg-firma">
        <div className="container-page grid items-center gap-8 py-14 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-hand text-2xl">Lo que fue de ellos, ahora es de otros</p>
            <h1 className="mt-2 text-[32px] md:text-[40px]">Vendé en Mi Pequeña Delfina</h1>
            <p className="mt-4 max-w-lg text-lg">
              Un lugar seguro para que las familias vendan lo que sus peques ya no usan, y para que artesanos y productores
              lleguen a quienes buscan algo hecho con amor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vender/alta" className="btn">Quiero vender</Link>
              <Link href="/vender/reglas" className="btn-outline">Ver las reglas</Link>
            </div>
          </div>
          <Delfina className="mx-auto h-56 w-56" />
        </div>
      </section>

      <section className="container-page grid gap-4 py-12 md:grid-cols-2">
        <div className="card">
          <h2 className="text-[22px]">Familias</h2>
          <p className="mt-2">Ropa, juguetes y artículos usados en buen estado.</p>
          <p className="mt-4 font-display text-3xl font-bold">{commissions.USADOS} %</p>
          <p className="text-sm text-muted">de comisión por venta, solo cuando vendés.</p>
        </div>
        <div className="card">
          <h2 className="text-[22px]">Artesanos y productores</h2>
          <p className="mt-2">Productos nuevos hechos a mano o de producción propia.</p>
          <p className="mt-4 font-display text-3xl font-bold">{commissions.ARTESANO} %</p>
          <p className="text-sm text-muted">de comisión por venta, solo cuando vendés.</p>
        </div>
      </section>

      <section className="container-page pb-6">
        <h2 className="mb-6 text-[28px]">¿Cómo funciona?</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            ["Creá tu perfil", "Registrate, contanos qué vendés y conectá tu cuenta de Mercado Pago para cobrar."],
            ["Publicá", "Subí fotos reales, el estado del producto y el precio. Publicar es gratis."],
            ["Vendé seguro", "El comprador paga dentro de la página. La comisión se descuenta sola y el resto llega a tu Mercado Pago."],
            ["Entregá", "Envialo por correo (el envío lo paga el comprador) o entregalo en mano si viven en la misma ciudad."],
          ].map(([t, d], i) => (
            <li key={t} className="card">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marea font-bold">{i + 1}</span>
              <p className="mt-3 font-display text-lg font-semibold">{t}</p>
              <p className="mt-1 text-sm">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page py-10">
        <div className="rounded-[24px] bg-aqua/30 p-6">
          <h2 className="text-[22px]">Por qué vender dentro de la página</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Cobrás con Mercado Pago, sin riesgo de pagos falsos ni estafas.</li>
            <li>Tus calificaciones y ventas suman reputación, que te ayuda a vender más.</li>
            <li>El comprador tiene garantía, por eso compra con más confianza.</li>
            <li>No compartimos tus datos personales hasta que la venta está paga.</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            Las ventas acordadas por fuera de la página no tienen protección y son motivo de suspensión de la cuenta.
          </p>
        </div>
      </section>
    </>
  );
}
