import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { HAND_DELIVERY } from "@/lib/format";
import { CheckoutForm, type Zone } from "./CheckoutForm";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

const STORE_KEY = "tienda";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ vendedor?: string }> }) {
  const { vendedor } = await searchParams;
  const sellerKey = vendedor || STORE_KEY;
  const [zones, user, seller] = await Promise.all([
    db.shippingZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    getCurrentUser(),
    sellerKey === STORE_KEY ? null : db.seller.findUnique({ where: { id: sellerKey } }),
  ]);
  const address = user ? await db.address.findFirst({ where: { userId: user.id } }) : null;

  // vendedores del marketplace: envío por zona (lo cobra el vendedor) o entrega en mano en su ciudad;
  // el retiro en el local es solo para productos de la tienda
  const options: Zone[] = zones
    .filter((z) => !seller || !z.isPickup)
    .map((z) => ({ id: z.id, name: z.isPickup ? `Retiro en ${z.name}` : `Envío a ${z.name}`, price: z.price, needsAddress: !z.isPickup }));
  if (seller?.handDelivery) {
    options.unshift({
      id: HAND_DELIVERY,
      name: `Entrega en mano en ${seller.city} (coordinan después de pagar)`,
      price: 0,
      needsAddress: false,
    });
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-[40px]">Finalizar compra</h1>
      {seller && <p className="mt-1 text-muted">Comprás a {seller.displayName}</p>}
      <CheckoutForm
        sellerKey={sellerKey}
        allowCoupon={!seller}
        zones={options}
        defaults={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          street: address?.street ?? "",
          city: address?.city ?? "",
          province: address?.province ?? "",
          zip: address?.zip ?? "",
        }}
        loggedIn={Boolean(user)}
      />
    </div>
  );
}
