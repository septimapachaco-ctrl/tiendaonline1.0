import { ProductForm } from "@/app/admin/productos/ProductForm";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/sellers";
import { CONDITIONS } from "@/lib/settings";
import { saveSellerProduct } from "../../../actions";

export default async function NewSellerProduct() {
  const { seller } = await requireSeller();
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  // los artesanos venden productos nuevos; las familias, usados
  const conditions =
    seller.kind === "ARTESANO" ? { NUEVO: CONDITIONS.NUEVO } : Object.fromEntries(Object.entries(CONDITIONS));
  return (
    <div className="space-y-4">
      <h2 className="text-[28px]">Nueva publicación</h2>
      <ProductForm categories={categories} mode="seller" action={saveSellerProduct} conditions={conditions} />
    </div>
  );
}
