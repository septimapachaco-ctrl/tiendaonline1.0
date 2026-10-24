import { ActionForm } from "@/components/ActionForm";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/format";
import { saveStaffUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  await requireStaff("ADMIN");
  const staff = await db.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, orderBy: { createdAt: "asc" } });
  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Usuarios del panel</h1>
        <div className="card text-sm">
          <p><b>Administrador:</b> acceso total (cupones, envíos y usuarios).</p>
          <p><b>Operador:</b> productos, stock, pedidos, clientes y mensajes.</p>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{ROLES[u.role]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card h-fit">
        <p className="mb-1 font-semibold">Agregar o modificar usuario</p>
        <p className="mb-4 text-xs text-muted">Si el email ya existe se actualiza su rol (y su contraseña, si la completás). Elegí “Cliente” para quitarle el acceso al panel.</p>
        <ActionForm action={saveStaffUser} submitLabel="Guardar usuario">
          <input name="name" placeholder="Nombre" className="input" />
          <input name="email" type="email" required placeholder="Email" className="input" />
          <select name="role" defaultValue="STAFF" className="input">
            <option value="STAFF">Operador</option>
            <option value="ADMIN">Administrador</option>
            <option value="CUSTOMER">Cliente (sin acceso al panel)</option>
          </select>
          <input name="password" type="password" placeholder="Contraseña (mín. 8)" className="input" autoComplete="new-password" />
        </ActionForm>
      </div>
    </div>
  );
}
