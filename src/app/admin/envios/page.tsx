import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteZone, saveZone } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminShipping() {
  await requireStaff("ADMIN");
  const zones = await db.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Envíos y retiro</h1>
      <p className="text-sm text-muted">Tarifa fija por zona. Marcá “Retiro” para opciones de retiro en el local (no piden dirección).</p>
      <ZoneForm />
      <div className="card space-y-3 p-3">
        {zones.map((z) => (
          <div key={z.id} className="flex items-center gap-2">
            <div className="flex-1"><ZoneForm zone={z} /></div>
            <form action={deleteZone}>
              <input type="hidden" name="id" value={z.id} />
              <button className="btn-danger">✕</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

type Zone = { id: string; name: string; price: number; isPickup: boolean; active: boolean; sortOrder: number };

function ZoneForm({ zone }: { zone?: Zone }) {
  return (
    <form action={saveZone} className={`flex flex-wrap items-center gap-2 text-sm ${zone ? "" : "card"}`}>
      <input type="hidden" name="id" value={zone?.id ?? ""} />
      <input name="name" required placeholder="Zona (ej: CABA)" defaultValue={zone?.name} className="input min-w-40 flex-1" />
      <input name="price" type="number" min={0} required placeholder="Costo" defaultValue={zone?.price} className="input w-28" />
      <input name="sortOrder" type="number" placeholder="Orden" defaultValue={zone?.sortOrder} className="input w-20" />
      <label className="flex items-center gap-1"><input type="checkbox" name="isPickup" defaultChecked={zone?.isPickup} /> Retiro</label>
      <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={zone?.active ?? true} /> Activa</label>
      <button className={zone ? "btn-outline" : "btn"}>{zone ? "Guardar" : "Agregar"}</button>
    </form>
  );
}
