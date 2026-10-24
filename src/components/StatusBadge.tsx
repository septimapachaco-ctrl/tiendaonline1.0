import { ORDER_STATUS } from "@/lib/format";

const COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  PAID: "bg-green-50 text-green-800",
  PREPARING: "bg-blue-50 text-blue-800",
  SHIPPED: "bg-indigo-50 text-indigo-800",
  DELIVERED: "bg-soft text-ink",
  CANCELLED: "bg-red-50 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${COLORS[status] ?? ""}`}>{ORDER_STATUS[status] ?? status}</span>;
}
