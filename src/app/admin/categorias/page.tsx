import { db } from "@/lib/db";
import { deleteCategory, saveCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Categorías</h1>
      <form action={saveCategory} className="card flex flex-wrap gap-2">
        <input name="name" placeholder="Nueva categoría" required className="input flex-1" />
        <input name="sortOrder" type="number" placeholder="Orden" className="input w-24" />
        <button className="btn">Agregar</button>
      </form>
      <div className="card space-y-2 p-3">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <form action={saveCategory} className="flex flex-1 gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="input flex-1" />
              <input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input w-20" />
              <button className="btn-outline">Guardar</button>
            </form>
            <span className="w-24 text-xs text-muted">{c._count.products} productos</span>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn-danger">Eliminar</button>
            </form>
          </div>
        ))}
        {categories.length === 0 && <p className="p-2 text-sm text-muted">Todavía no hay categorías.</p>}
      </div>
    </div>
  );
}
