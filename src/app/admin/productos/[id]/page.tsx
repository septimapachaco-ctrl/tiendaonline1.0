import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteProduct } from "../../actions";
import { ProductForm } from "../ProductForm";

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const [{ id }, { ok }] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: true, images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="flex gap-2">
          <Link href={`/productos/${product.slug}`} target="_blank" className="btn-outline">Ver en la tienda</Link>
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button className="btn-danger">Eliminar</button>
          </form>
        </div>
      </div>
      {ok && <p className="rounded bg-green-50 p-3 text-sm text-green-800">Producto guardado.</p>}
      <ProductForm
        key={product.updatedAt.toISOString()}
        categories={categories}
        product={{
          ...product,
          images: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
