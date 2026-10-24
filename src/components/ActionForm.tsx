"use client";

import { useActionState } from "react";

type State = { error?: string; ok?: string } | undefined;

/** Formulario que muestra el error/ok devuelto por una server action. */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = "space-y-4",
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="rounded bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      {state?.ok && <p className="rounded bg-green-50 p-3 text-sm text-green-800">{state.ok}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Enviando…" : submitLabel}
      </button>
    </form>
  );
}
