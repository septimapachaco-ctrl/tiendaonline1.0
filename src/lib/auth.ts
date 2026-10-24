import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, signSession, verifySession, type SessionPayload } from "./session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(user: { id: string; role: string; name: string }) {
  const token = await signSession({ userId: user.id, role: user.role, name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

/** Exige un usuario del panel. "ADMIN" restringe a administradores. */
export async function requireStaff(level: "STAFF" | "ADMIN" = "STAFF") {
  const user = await getCurrentUser();
  if (!user || user.role === "CUSTOMER") redirect("/login?next=/admin");
  if (level === "ADMIN" && user.role !== "ADMIN") redirect("/admin?error=permiso");
  return user;
}
