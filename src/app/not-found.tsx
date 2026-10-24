import Link from "next/link";
import { Delfina } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <Delfina className="mx-auto h-40 w-40" />
      <h1 className="mt-6 text-[32px] md:text-[40px]">Delfina se perdió entre los corales</h1>
      <p className="mt-3 text-muted">La página que buscás no está por acá. Volvamos a la superficie.</p>
      <Link href="/" className="btn mt-8">Volver a la superficie</Link>
    </div>
  );
}
