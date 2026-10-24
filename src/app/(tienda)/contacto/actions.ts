"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import type { FormState } from "../auth-actions";

const schema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre"),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(5, "Escribí tu mensaje").max(3000),
});

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export async function sendContact(_: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: "¡Gracias! Te respondemos a la brevedad." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const msg = await db.contactMessage.create({ data: { ...parsed.data, phone: parsed.data.phone || null } });
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    await sendMail(
      process.env.ADMIN_NOTIFY_EMAIL,
      `Nueva consulta de ${msg.name}`,
      `<p><b>${escape(msg.name)}</b> (${escape(msg.email)} ${escape(msg.phone ?? "")})</p><p>${escape(msg.message).replace(/\n/g, "<br>")}</p>`,
    );
  }
  return { ok: "¡Gracias! Te respondemos a la brevedad." };
}
