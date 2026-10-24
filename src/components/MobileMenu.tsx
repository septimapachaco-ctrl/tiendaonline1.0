"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} aria-label="Menú" className="p-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-white shadow-sm">
          <form action="/productos" className="p-4 pb-2">
            <input name="q" placeholder="Buscar productos…" className="input" aria-label="Buscar" />
          </form>
          <nav className="flex flex-col p-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded px-3 py-2.5 hover:bg-soft">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
