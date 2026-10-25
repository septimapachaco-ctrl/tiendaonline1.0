import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/app/admin/productos/ProductForm";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/sellers";
import { CONDITIONS } from "@/lib/settings";
import { deleteSellerProduct, saveSellerProduct } from "../../../actions";

export default async function EditSellerProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller } = await requireSeller();
  const [product, categories] = await Promise.all([
    db.product.findFirst({
      where: { id, sellerId: seller.id },
      include: { variants: true, images: { orderBy: { sortOrder: "asc" } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  const conditions = seller.kind === "ARTESANO" ? { NUEVO: CONDITIONS.NUEVO } : CONDITIONS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[28px]">{product.name}</h2>
        <div className="flex gap-2">
          <Link href={`/productos/${product.slug}`} target="_blank" className="btn-outline">Ver publicación</Link>
          <form action={deleteSellerProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button className="btn-danger">Eliminar</button>
          </form>
        </div>
      </div>
      <ProductForm
        key={product.updatedAt.toISOString()}
        categories={categories}
        mode="seller"
        action={saveSellerProduct}
        conditions={conditions}
        product={{ ...product, images: product.images.map((i) => i.url) }}
      />
    </div>
  );
}
