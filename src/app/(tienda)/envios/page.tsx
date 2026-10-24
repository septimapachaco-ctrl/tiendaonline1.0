import type { Metadata } from "next";
import { db } from "@/lib/db";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Envíos y retiros", alternates: { canonical: "/envios" } };
export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const zones = await db.shippingZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="container-page prose-page max-w-3xl py-12">
      <h1 className="text-[40px]">Envíos y retiros</h1>
      <p className="mt-4">Despachamos los pedidos dentro de las 48 h hábiles posteriores a la acreditación del pago.</p>
      <h2>Costos por zona</h2>
      <table className="table not-prose mb-6">
        <thead><tr><th>Zona</th><th>Costo</th></tr></thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.id}>
              <td>{z.isPickup ? `Retiro en ${z.name}` : z.name}</td>
              <td>{z.price === 0 ? "Gratis" : money(z.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Seguimiento</h2>
      <p>Cuando despachamos tu pedido te enviamos por email el código de seguimiento. También lo ves en “Mi cuenta”.</p>
      <h2>Cambios y devoluciones</h2>
      <p>Tenés 30 días desde la recepción para solicitar un cambio, con el producto sin uso y en su empaque original.</p>
    </div>
  );
}
