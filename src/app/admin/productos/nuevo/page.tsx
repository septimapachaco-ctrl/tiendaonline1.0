import { db } from "@/lib/db";
import { ProductForm } from "../ProductForm";

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
