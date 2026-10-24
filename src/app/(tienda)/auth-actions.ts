"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { checkPassword, endSession, getSession, hashPassword, startSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos." };
  }
  await startSession(user);
  redirect(safeNext(formData.get("next")) ?? (user.role === "CUSTOMER" ? "/cuenta" : "/admin"));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Ya existe una cuenta con ese email." };
  }
  const user = await db.user.create({
    data: { name, email, phone: phone || null, passwordHash: await hashPassword(password) },
  });
  await startSession(user);
  redirect(safeNext(formData.get("next")) ?? "/cuenta");
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2) return { error: "Ingresá tu nombre." };
  if (password && password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  await db.user.update({
    where: { id: session.userId },
    data: { name, phone: phone || null, ...(password ? { passwordHash: await hashPassword(password) } : {}) },
  });
  return { ok: "Datos actualizados." };
}
