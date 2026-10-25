import Link from "next/link";
import { db } from "@/lib/db";
import { toggleQuestion } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminQuestions() {
  const questions = await db.question.findMany({
    include: {
      product: { select: { name: true, slug: true, seller: { select: { displayName: true } } } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Preguntas de las publicaciones</h1>
      <p className="text-sm text-muted">
        Los datos de contacto se bloquean automáticamente. Ocultá las que igual intenten llevar la venta afuera.
      </p>
      {questions.length === 0 && <p className="card text-sm text-muted">No hay preguntas.</p>}
      {questions.map((q) => (
        <div key={q.id} className={`card text-sm ${q.hidden ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted">
            <span>
              <Link href={`/productos/${q.product.slug}`} className="underline" target="_blank">{q.product.name}</Link>
              {q.product.seller && ` · vende ${q.product.seller.displayName}`}
            </span>
            <span>{q.user.name} ({q.user.email}) · {q.createdAt.toLocaleString("es-AR")}</span>
          </div>
          <p className="mt-2 font-semibold">{q.text}</p>
          {q.answer && <p className="mt-1 border-l-2 border-marea pl-3">{q.answer}</p>}
          <form action={toggleQuestion} className="mt-3">
            <input type="hidden" name="id" value={q.id} />
            <button className="btn-outline">{q.hidden ? "Volver a mostrar" : "Ocultar"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
