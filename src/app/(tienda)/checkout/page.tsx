import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const [zones, user] = await Promise.all([
    db.shippingZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    getCurrentUser(),
  ]);
  const address = user ? await db.address.findFirst({ where: { userId: user.id } }) : null;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">Finalizar compra</h1>
      <CheckoutForm
        zones={zones.map((z) => ({ id: z.id, name: z.name, price: z.price, isPickup: z.isPickup }))}
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
