"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "../actions";

type VariantRow = {
  id?: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  price: number | null;
};

type Props = {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice: number | null;
    categoryId: string | null;
    active: boolean;
    featured: boolean;
    variants: VariantRow[];
    images: string[];
  };
};

const emptyVariant: VariantRow = { size: null, color: null, sku: null, stock: 0, price: null };

export function ProductForm({ categories, product }: Props) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [variants, setVariants] = useState<VariantRow[]>(product?.variants.length ? product.variants : [emptyVariant]);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [bulkSizes, setBulkSizes] = useState("");
  const [bulkColors, setBulkColors] = useState("");

  function patch(i: number, data: Partial<VariantRow>) {
    setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...data } : v)));
  }

  function generate() {
    const sizes = bulkSizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = bulkColors.split(",").map((s) => s.trim()).filter(Boolean);
    const combos: VariantRow[] = [];
    for (const size of sizes.length ? sizes : [null]) {
      for (const color of colors.length ? colors : [null]) {
        const existing = variants.find((v) => v.size === size && v.color === color);
        combos.push(existing ?? { ...emptyVariant, size, color });
      }
    }
    setVariants(combos);
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (res.ok) setImages((imgs) => [...imgs, json.url]);
      else setUploadError(json.error ?? "No se pudo subir la imagen");
    }
    setUploading(false);
  }

  function move(i: number, dir: -1 | 1) {
    setImages((imgs) => {
      const next = [...imgs];
      const j = i + dir;
      if (j < 0 || j >= next.length) return imgs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const cleanVariants = variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 }));

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="variants" value={JSON.stringify(cleanVariants)} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="space-y-6">
        <section className="card space-y-4">
          <div>
            <label className="label" htmlFor="name">Nombre</label>
            <input id="name" name="name" required defaultValue={product?.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={6} defaultValue={product?.description} className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="price">Precio (ARS)</label>
              <input id="price" name="price" type="number" min={1} required defaultValue={product?.price} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="comparePrice">Precio anterior / tachado (opcional)</label>
              <input id="comparePrice" name="comparePrice" type="number" min={0} defaultValue={product?.comparePrice ?? ""} className="input" />
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold">Fotos</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((src, i) => (
              <div key={src + i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="aspect-[4/5] w-full rounded object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 rounded bg-ink px-1.5 text-[10px] text-white">Portada</span>}
                <div className="mt-1 flex justify-between text-xs">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Mover a la izquierda">◀</button>
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="text-red-700">Quitar</button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Mover a la derecha">▶</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-outline cursor-pointer">
              {uploading ? "Subiendo…" : "Subir fotos"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            </label>
            <div className="flex flex-1 gap-2">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="…o pegá la URL de una imagen" className="input" />
              <button type="button" className="btn-outline" onClick={() => { if (imageUrl) { setImages([...images, imageUrl]); setImageUrl(""); } }}>Agregar</button>
            </div>
          </div>
          {uploadError && <p className="text-sm text-red-700">{uploadError}</p>}
        </section>

        <section className="card space-y-4">
          <h2 className="font-semibold">Variantes y stock</h2>
          <div className="grid gap-2 rounded-md bg-soft p-3 text-sm sm:grid-cols-[1fr_1fr_auto]">
            <input value={bulkSizes} onChange={(e) => setBulkSizes(e.target.value)} placeholder="Talles: S, M, L" className="input" />
            <input value={bulkColors} onChange={(e) => setBulkColors(e.target.value)} placeholder="Colores: Negro, Blanco" className="input" />
            <button type="button" className="btn-outline" onClick={generate}>Generar combinaciones</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Talle</th><th>Color</th><th>SKU</th><th>Stock</th><th>Precio propio</th><th></th></tr></thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id ?? `new-${i}`}>
                    <td><input value={v.size ?? ""} onChange={(e) => patch(i, { size: e.target.value || null })} className="input w-20" /></td>
                    <td><input value={v.color ?? ""} onChange={(e) => patch(i, { color: e.target.value || null })} className="input w-28" /></td>
                    <td><input value={v.sku ?? ""} onChange={(e) => patch(i, { sku: e.target.value || null })} className="input w-24" /></td>
                    <td><input type="number" min={0} value={v.stock} onChange={(e) => patch(i, { stock: Number(e.target.value) })} className="input w-20" /></td>
                    <td><input type="number" min={0} value={v.price ?? ""} placeholder="—" onChange={(e) => patch(i, { price: e.target.value ? Number(e.target.value) : null })} className="input w-28" /></td>
                    <td>
                      {variants.length > 1 && (
                        <button type="button" className="btn-danger" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn-outline" onClick={() => setVariants([...variants, emptyVariant])}>+ Agregar variante</button>
          <p className="text-xs text-muted">Si el producto no tiene talles ni colores, dejá una sola variante vacía con su stock.</p>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Publicado en la tienda
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} /> Destacado en el inicio
          </label>
          <div>
            <label className="label" htmlFor="categoryId">Categoría</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="input">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="slug">URL amigable (opcional)</label>
            <input id="slug" name="slug" defaultValue={product?.slug} placeholder="se genera del nombre" className="input" />
          </div>
        </section>
        {state?.error && <p className="rounded bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
        <button className="btn w-full" disabled={pending || uploading}>{pending ? "Guardando…" : "Guardar producto"}</button>
      </aside>
    </form>
  );
}
