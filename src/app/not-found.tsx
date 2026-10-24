import Link from "next/link";
import { Isotipo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <Isotipo className="mx-auto h-24 w-24" />
      <h1 className="mt-6 text-[40px]">Este unicornio se perdió en el bosque</h1>
      <p className="mt-3 text-muted">La página que buscás no está por acá. Volvamos al inicio.</p>
      <Link href="/" className="btn mt-8">Volver al inicio</Link>
    </div>
  );
}
