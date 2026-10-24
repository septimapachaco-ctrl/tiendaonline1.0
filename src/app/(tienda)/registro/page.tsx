import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { register } from "../auth-actions";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-[40px]">Crear cuenta</h1>
      <p className="mt-2 text-sm text-muted">Seguí tus pedidos y comprá más rápido la próxima vez.</p>
      <div className="card mt-6">
        <ActionForm action={register} submitLabel="Crear cuenta">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="name">Nombre y apellido</label>
            <input id="name" name="name" required className="input" autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Teléfono (opcional)</label>
            <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
            <input id="password" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
          </div>
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm">
        ¿Ya tenés cuenta? <Link href="/login" className="text-profundo underline">Ingresá</Link>
      </p>
    </div>
  );
}
