import type { Metadata } from "next";
import { ActionForm } from "@/components/ActionForm";
import { site } from "@/lib/site";
import { sendContact } from "./actions";

export const metadata: Metadata = { title: "Contacto", alternates: { canonical: "/contacto" } };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  const regret = motivo === "arrepentimiento";
  return (
    <div className="container-page grid max-w-4xl gap-10 py-12 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">{regret ? "Botón de arrepentimiento" : "Contacto"}</h1>
        <p className="mt-4 text-muted">
          {regret
            ? "Indicá tu número de pedido para revocar la compra (10 días corridos desde la entrega). Te confirmamos por email."
            : "Escribinos y te respondemos dentro de las 24 h hábiles."}
        </p>
        {site.whatsapp && (
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn mt-6 bg-[#25d366] hover:bg-[#1da851]">
            Escribinos por WhatsApp
          </a>
        )}
      </div>
      <div className="card">
        <ActionForm action={sendContact} submitLabel="Enviar mensaje">
          <div>
            <label className="label" htmlFor="name">Nombre</label>
            <input id="name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Teléfono (opcional)</label>
            <input id="phone" name="phone" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="message">Mensaje</label>
            <textarea id="message" name="message" rows={5} required className="input" defaultValue={regret ? "Quiero revocar mi compra. Número de pedido: " : ""} />
          </div>
          {/* campo trampa para bots */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        </ActionForm>
      </div>
    </div>
  );
}
