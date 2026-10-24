import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { deleteCoupon, saveCoupon } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  await requireStaff("ADMIN");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cupones de descuento</h1>
      <CouponForm />
      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="card">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>
                <b className="font-mono">{c.code}</b> · {c.type === "PERCENT" ? `${c.value}%` : money(c.value)} · usado {c.usedCount}
                {c.maxUses != null ? `/${c.maxUses}` : ""} veces
              </p>
              <form action={deleteCoupon}>
                <input type="hidden" name="id" value={c.id} />
                <button className="btn-danger">Eliminar</button>
              </form>
            </div>
            <CouponForm coupon={c} />
          </div>
        ))}
      </div>
    </div>
  );
}

type Coupon = Awaited<ReturnType<typeof db.coupon.findFirst>>;

function CouponForm({ coupon }: { coupon?: Coupon }) {
  return (
    <form action={saveCoupon} className={`grid gap-2 text-sm sm:grid-cols-4 lg:grid-cols-8 ${coupon ? "" : "card"}`}>
      <input type="hidden" name="id" value={coupon?.id ?? ""} />
      <input name="code" required placeholder="CÓDIGO" defaultValue={coupon?.code} className="input uppercase lg:col-span-2" />
      <select name="type" defaultValue={coupon?.type ?? "PERCENT"} className="input">
        <option value="PERCENT">% off</option>
        <option value="FIXED">$ fijo</option>
      </select>
      <input name="value" type="number" min={1} required placeholder="Valor" defaultValue={coupon?.value} className="input" />
      <input name="minTotal" type="number" min={0} placeholder="Compra mín." defaultValue={coupon?.minTotal || ""} className="input" title="Compra mínima" />
      <input name="maxUses" type="number" min={1} placeholder="Usos máx." defaultValue={coupon?.maxUses ?? ""} className="input" title="Usos máximos" />
      <input name="expiresAt" type="date" defaultValue={coupon?.expiresAt?.toISOString().slice(0, 10)} className="input" title="Vence" />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} /> Activo</label>
        <button className={coupon ? "btn-outline" : "btn"}>{coupon ? "Guardar" : "Crear"}</button>
      </div>
    </form>
  );
}
