import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { login } from "../auth-actions";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-3xl font-bold">Ingresar</h1>
      <div className="card mt-6">
        <ActionForm action={login} submitLabel="Ingresar">
          <input type="hidden" name="next" value={next ?? ""} />
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
          </div>
        </ActionForm>
      </div>
      <p className="mt-4 text-center text-sm">
        ¿No tenés cuenta?{" "}
        <Link href={`/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-brand underline">Registrate</Link>
      </p>
    </div>
  );
}
