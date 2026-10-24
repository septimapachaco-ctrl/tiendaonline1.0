"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/carrito" className="relative flex items-center gap-1 hover:underline decoration-marea decoration-2 underline-offset-4" aria-label="Carrito">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5 3H2" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 rounded-full bg-concha px-1.5 text-[11px] font-bold text-profundo">
          {count}
        </span>
      )}
    </Link>
  );
}
