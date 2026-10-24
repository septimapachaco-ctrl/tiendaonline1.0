import { db } from "@/lib/db";
import { toggleMessage } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Mensajes de contacto</h1>
      {messages.length === 0 && <p className="card text-sm text-muted">No hay mensajes.</p>}
      {messages.map((m) => (
        <div key={m.id} className={`card text-sm ${m.read ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              <b>{m.name}</b> · <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
              {m.phone && ` · ${m.phone}`}
            </p>
            <span className="text-xs text-muted">{m.createdAt.toLocaleString("es-AR")}</span>
          </div>
          <p className="mt-2 whitespace-pre-line">{m.message}</p>
          <form action={toggleMessage} className="mt-3">
            <input type="hidden" name="id" value={m.id} />
            <button className="btn-outline">{m.read ? "Marcar como no leído" : "Marcar como leído"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
