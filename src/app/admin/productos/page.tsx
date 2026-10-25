import Link from "next/link";
import { db } from "@/lib/db";
import { money, variantLabel } from "@/lib/format";
import { updateStock } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await db.product.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    include: { variants: true, category: true, seller: { select: { displayName: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Productos y stock</h1>
        <div className="flex gap-2">
          <form><input name="q" defaultValue={q} placeholder="Buscar…" className="input" /></form>
          <Link href="/admin/productos/nuevo" className="btn">+ Nuevo producto</Link>
        </div>
      </div>
      <p className="text-sm text-muted">{products.length} productos. Podés editar el stock directamente en la tabla y guardar.</p>

      <form action={updateStock} className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr><th></th><th>Producto</th><th>Categoría</th><th>Vende</th><th>Precio</th><th>Stock por variante</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="w-14">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.images[0] && <img src={p.images[0].url} alt="" className="h-12 w-10 rounded object-cover" />}
                </td>
                <td><Link href={`/admin/productos/${p.id}`} className="font-medium underline">{p.name}</Link></td>
                <td>{p.category?.name ?? "—"}</td>
                <td>{p.seller?.displayName ?? "Tienda"}</td>
                <td>{money(p.price)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {p.variants.map((v) => (
                      <label key={v.id} className="flex items-center gap-1 text-xs">
                        <span className="text-muted">{variantLabel(v)}</span>
                        <input name={`stock_${v.id}`} type="number" min={0} defaultValue={v.stock} className={`input w-16 px-2 py-1 ${v.stock === 0 ? "border-red-300" : ""}`} />
                      </label>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? "bg-green-50 text-green-800" : "bg-soft text-muted"}`}>
                    {p.active ? "Publicado" : "Oculto"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length > 0 && (
          <div className="flex justify-end p-4"><button className="btn">Guardar stock</button></div>
        )}
      </form>
    </div>
  );
}
