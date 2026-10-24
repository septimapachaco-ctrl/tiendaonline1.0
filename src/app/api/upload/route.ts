import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Sube a Supabase Storage si está configurado; si no, guarda en public/uploads (solo con disco persistente).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CUSTOMER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Formato no permitido (JPG, PNG, WEBP o AVIF)" }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "La imagen supera 4 MB" }, { status: 400 });

  const name = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const bucket = process.env.SUPABASE_BUCKET || "productos";
    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": file.type, "Cache-Control": "31536000" },
      body: bytes,
    });
    if (!res.ok) {
      console.error("[upload]", res.status, await res.text());
      return NextResponse.json({ error: "No se pudo guardar la imagen" }, { status: 502 });
    }
    return NextResponse.json({ url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${name}` });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return NextResponse.json({ url: `/uploads/${name}` });
}
