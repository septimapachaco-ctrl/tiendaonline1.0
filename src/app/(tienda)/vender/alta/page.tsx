import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCommissions, SELLER_KINDS } from "@/lib/settings";
import { createSeller } from "../actions";

export const metadata: Metadata = { title: "Empezar a vender", robots: { index: false } };

export default async function SellerSignup() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vender/alta");
  if (await db.seller.findUnique({ where: { userId: user.id } })) redirect("/vender/panel");
  const commissions = await getCommissions();

  return (
    <div className="container-page max-w-xl py-12">
      <h1 className="text-[40px]">Empezar a vender</h1>
      <p className="mt-2 text-muted">Completá tu perfil de vendedor. Lo podés cambiar cuando quieras.</p>
      <div className="card mt-6">
        <ActionForm action={createSeller} submitLabel="Crear mi perfil de vendedor">
          <fieldset>
            <legend className="label">¿Qué vas a vender?</legend>
            <div className="space-y-2">
              {Object.entries(SELLER_KINDS).map(([k, v], i) => (
                <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border-2 border-line p-3 has-[:checked]:border-marea has-[:checked]:bg-aqua/20">
                  <input type="radio" name="kind" value={k} defaultChecked={i === 0} />
                  <span>
                    {v.label}
                    <span className="block text-xs text-muted">Comisión: {commissions[k]} % por venta</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="displayName">Nombre para mostrar</label>
            <input id="displayName" name="displayName" required minLength={3} maxLength={40} className="input" placeholder="Ej.: El ropero de Juana" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="city">Ciudad</label>
              <input id="city" name="city" required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="province">Provincia</label>
              <input id="province" name="province" required className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Contá algo sobre vos o tus productos (opcional)</label>
            <textarea id="bio" name="bio" rows={3} maxLength={600} className="input" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="handDelivery" defaultChecked className="mt-1" />
            Ofrezco entrega en mano a compradores de mi ciudad
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="terms" required className="mt-1" />
            <span>
              Leí y acepto las <Link href="/vender/reglas" target="_blank" className="link">reglas para vender</Link>, incluida la
              prohibición de acordar ventas o pagos por fuera de la página.
            </span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
