import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { requireSeller } from "@/lib/sellers";
import { answerQuestion } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SellerQuestions() {
  const { seller } = await requireSeller();
  const questions = await db.question.findMany({
    where: { product: { sellerId: seller.id }, hidden: false },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: [{ answeredAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-[28px]">Preguntas</h2>
      <p className="text-sm text-muted">Las respuestas son públicas. No incluyas datos de contacto: no se publican.</p>
      {questions.length === 0 && <p className="card text-muted">No tenés preguntas por ahora.</p>}
      {questions.map((q) => (
        <article key={q.id} className="card space-y-2 text-sm">
          <Link href={`/productos/${q.product.slug}`} className="link">{q.product.name}</Link>
          <p className="text-base">{q.text}</p>
          {q.answer ? (
            <p className="rounded-2xl bg-soft p-3">Tu respuesta: {q.answer}</p>
          ) : (
            <ActionForm action={answerQuestion} submitLabel="Responder">
              <input type="hidden" name="id" value={q.id} />
              <textarea name="answer" rows={2} required maxLength={1000} className="input" aria-label="Respuesta" />
            </ActionForm>
          )}
        </article>
      ))}
    </div>
  );
}
