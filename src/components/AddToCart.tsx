"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { track } from "@/lib/track";
import { useCart } from "./CartProvider";

type Variant = { id: string; size: string | null; color: string | null; stock: number; price: number | null };

type Props = {
  product: { name: string; slug: string; price: number; image: string | null };
  variants: Variant[];
};

export function AddToCart({ product, variants }: Props) {
  const cart = useCart();
  const sizes = useMemo(() => unique(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => unique(variants.map((v) => v.color)), [variants]);
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [size, setSize] = useState(firstAvailable?.size ?? null);
  const [color, setColor] = useState(firstAvailable?.color ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.size === size && v.color === color);
  const price = variant?.price ?? product.price;
  const available = (variant?.stock ?? 0) > 0;

  function add() {
    if (!variant) return;
    cart.add({
      variantId: variant.id,
      productName: product.name,
      variantName: [variant.size, variant.color].filter(Boolean).join(" / ") || "Único",
      slug: product.slug,
      image: product.image,
      unitPrice: price,
      quantity: qty,
      stock: variant.stock,
    });
    track("add_to_cart", { currency: "ARS", value: price * qty, content_name: product.name });
    setAdded(true);
  }

  return (
    <div className="space-y-5">
      <p className="text-[28px] font-semibold">{money(price)}</p>

      {sizes.length > 0 && (
        <Picker
          label="Talle"
          options={sizes}
          value={size}
          onChange={(s) => { setSize(s); setAdded(false); }}
          isAvailable={(s) => variants.some((v) => v.size === s && (colors.length === 0 || v.color === color) && v.stock > 0)}
        />
      )}
      {colors.length > 0 && (
        <Picker
          label="Color"
          options={colors}
          value={color}
          onChange={(c) => { setColor(c); setAdded(false); }}
          isAvailable={(c) => variants.some((v) => v.color === c && (sizes.length === 0 || v.size === size) && v.stock > 0)}
        />
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-3xl border-2 border-line bg-white">
          <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Restar">−</button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty(Math.min(variant?.stock ?? 1, qty + 1))} aria-label="Sumar">+</button>
        </div>
        <button className="btn flex-1" disabled={!available} onClick={add}>
          {available ? "Llevar calma a casa" : variant ? "Agotado por ahora" : "Combinación no disponible"}
        </button>
      </div>
      {available && variant!.stock <= 3 && (
        <p className="text-sm text-muted">Quedan {variant!.stock} unidades</p>
      )}
      {added && (
        <p className="rounded-2xl bg-aqua/50 p-3 text-sm">
          Ya está en tu canasta. <Link href="/carrito" className="font-semibold underline">Ver canasta</Link>
        </p>
      )}
    </div>
  );
}

function unique(values: (string | null)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function Picker(props: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  isAvailable: (v: string) => boolean;
}) {
  return (
    <div>
      <p className="label">
        {props.label}: <span className="font-normal text-muted">{props.value}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {props.options.map((o) => (
          <button
            key={o}
            onClick={() => props.onChange(o)}
            className={`min-h-11 min-w-11 rounded-2xl border-2 px-3 py-1.5 text-sm ${
              props.value === o ? "border-profundo bg-marea text-profundo" : "border-line bg-white hover:border-marea"
            } ${props.isAvailable(o) ? "" : "opacity-40 line-through"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
