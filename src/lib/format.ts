const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function money(value: number) {
  return ars.format(value);
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function variantLabel(v: { size?: string | null; color?: string | null }) {
  return [v.size, v.color].filter(Boolean).join(" / ") || "Único";
}

export const ORDER_STATUS: Record<string, string> = {
  PENDING: "Pendiente de pago",
  PAID: "Pagado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const ROLES: Record<string, string> = {
  CUSTOMER: "Cliente",
  STAFF: "Operador",
  ADMIN: "Administrador",
};
