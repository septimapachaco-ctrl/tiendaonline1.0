import type { Metadata } from "next";
import { getCommissions } from "@/lib/settings";

export const metadata: Metadata = { title: "Reglas para vender", alternates: { canonical: "/vender/reglas" } };
export const dynamic = "force-dynamic";

export default async function SellerRules() {
  const c = await getCommissions();
  return (
    <div className="container-page prose-page max-w-3xl py-12">
      <h1 className="text-[40px]">Reglas para vender</h1>
      <p className="mt-4 text-sm text-muted">Texto modelo: revisalo con tu asesor legal antes de publicar.</p>

      <h2>1. Comisión</h2>
      <p>
        Publicar es gratis. Por cada venta, la página cobra un {c.USADOS} % (artículos usados) o un {c.ARTESANO} % (artesanos
        y productores) sobre el precio de los productos. El envío no lleva comisión: lo paga el comprador y lo recibe el
        vendedor junto con el cobro. La comisión se descuenta automáticamente a través de Mercado Pago, que además cobra
        su propia tarifa por procesar el pago.
      </p>

      <h2>2. Todo se hace dentro de la página</h2>
      <ul>
        <li>No se permite publicar teléfonos, emails, links, usuarios de redes ni datos bancarios.</li>
        <li>No se permite ofrecer o aceptar pagos por fuera (transferencias, efectivo u otros medios).</li>
        <li>Las preguntas se responden dentro de la publicación.</li>
        <li>Los datos de contacto del comprador se comparten con el vendedor recién cuando el pago está aprobado.</li>
        <li>Incumplir estas reglas puede llevar a la pausa de publicaciones o la suspensión de la cuenta.</li>
      </ul>

      <h2>3. Qué se puede vender</h2>
      <ul>
        <li>Ropa, calzado, juguetes, libros, accesorios, decoración y artículos de cuidado para bebés y niños.</li>
        <li>Usados: limpios, completos y en buen estado. Las fotos tienen que ser reales y mostrar cualquier detalle.</li>
        <li>Artesanos y productores: productos propios, con materiales seguros para bebés y niños.</li>
      </ul>

      <h2>4. Qué no se puede vender</h2>
      <ul>
        <li>Butacas y sillas de auto usadas (no se puede garantizar que no hayan sufrido un choque).</li>
        <li>Productos retirados del mercado por seguridad, o juguetes sin la información obligatoria.</li>
        <li>Mamaderas, tetinas, chupetes y extractores de leche usados.</li>
        <li>Alimentos, medicamentos, cosméticos abiertos o vencidos.</li>
        <li>Copias o imitaciones de marcas.</li>
      </ul>

      <h2>5. Entrega</h2>
      <ul>
        <li>Envío por correo: despachalo dentro de las 48 h hábiles y cargá el código de seguimiento en tu panel.</li>
        <li>
          Entrega en mano (misma ciudad): coordinan después del pago. Al entregar, pedile al comprador el código de 4
          dígitos y cargalo en tu panel para registrar la entrega.
        </li>
      </ul>

      <h2>6. Devoluciones</h2>
      <p>
        Si el producto no coincide con la publicación, el comprador puede pedir la devolución. Los artesanos y productores
        además deben respetar el derecho de arrepentimiento de 10 días de la Ley 24.240.
      </p>
    </div>
  );
}
