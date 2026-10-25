import "server-only";
import { db } from "./db";

export const SELLER_KINDS: Record<string, { label: string; short: string }> = {
  USADOS: { label: "Familias que venden lo que ya no usan", short: "Usado" },
  ARTESANO: { label: "Artesanos y productores", short: "Hecho a mano" },
};

export const CONDITIONS: Record<string, string> = {
  NUEVO: "Nuevo",
  COMO_NUEVO: "Usado, como nuevo",
  BUEN_ESTADO: "Usado, buen estado",
  USO_VISIBLE: "Usado, con detalles visibles",
};

const DEFAULT_COMMISSION: Record<string, number> = { USADOS: 12, ARTESANO: 15 };

export async function getCommissions() {
  const rows = await db.setting.findMany({ where: { key: { startsWith: "commission_" } } });
  const result = { ...DEFAULT_COMMISSION };
  for (const r of rows) {
    const kind = r.key.replace("commission_", "");
    const value = Number(r.value);
    if (kind in result && Number.isFinite(value)) result[kind] = value;
  }
  return result;
}

/** Porcentaje que cobra la página a un vendedor (su valor propio o el general de su tipo). */
export async function commissionFor(seller: { kind: string; commissionPct: number | null }) {
  if (seller.commissionPct != null) return seller.commissionPct;
  return (await getCommissions())[seller.kind] ?? 15;
}
