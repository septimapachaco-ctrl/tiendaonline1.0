import { ActionForm } from "@/components/ActionForm";
import { demoPayments, requireSeller } from "@/lib/sellers";
import { commissionFor } from "@/lib/settings";
import { disconnectMercadoPago, updateSeller } from "../../actions";

export default async function SellerProfile() {
  const { seller } = await requireSeller();
  const pct = await commissionFor(seller);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="card">
        <h2 className="mb-4 text-[22px]">Mi perfil</h2>
        <ActionForm action={updateSeller} submitLabel="Guardar perfil">
          <div>
            <label className="label" htmlFor="displayName">Nombre para mostrar</label>
            <input id="displayName" name="displayName" defaultValue={seller.displayName} required minLength={3} maxLength={40} className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="city">Ciudad</label>
              <input id="city" name="city" defaultValue={seller.city} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="province">Provincia</label>
              <input id="province" name="province" defaultValue={seller.province} required className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Sobre vos</label>
            <textarea id="bio" name="bio" rows={4} maxLength={600} defaultValue={seller.bio} className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="handDelivery" defaultChecked={seller.handDelivery} />
            Ofrezco entrega en mano en {seller.city}
          </label>
        </ActionForm>
      </section>

      <aside className="card h-fit space-y-3 text-sm">
        <h2 className="text-[22px]">Cobros</h2>
        <p>Comisión de la página: <b>{pct} %</b> sobre el precio de los productos.</p>
        {seller.mpAccessToken ? (
          <>
            <p className="rounded-2xl bg-aqua/40 p-3">Mercado Pago conectado (cuenta {seller.mpUserId}).</p>
            <form action={disconnectMercadoPago}>
              <button className="btn-outline w-full">Desconectar Mercado Pago</button>
            </form>
            <p className="text-xs text-muted">Si lo desconectás, tus publicaciones dejan de mostrarse hasta que lo vuelvas a conectar.</p>
          </>
        ) : (
          <>
            <p>Conectá tu cuenta de Mercado Pago para recibir el dinero de tus ventas.</p>
            {/* enlace común (no Link): es una ruta que redirige a Mercado Pago */}
            <a href="/vender/mercadopago" className="btn w-full">Conectar Mercado Pago</a>
            {demoPayments() && <p className="text-xs text-muted">Modo demostración activo: podés vender sin conectarlo.</p>}
          </>
        )}
      </aside>
    </div>
  );
}
