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

// Guarda imágenes en public/uploads. En hosting sin disco persistente, usar URLs de un CDN.
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

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
