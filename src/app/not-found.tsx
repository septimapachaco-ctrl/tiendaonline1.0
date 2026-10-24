import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl font-bold">Página no encontrada</h1>
      <p className="mt-3 text-muted">El producto o la página que buscás no existe o ya no está disponible.</p>
      <Link href="/" className="btn mt-8">Volver a la tienda</Link>
    </div>
  );
}
