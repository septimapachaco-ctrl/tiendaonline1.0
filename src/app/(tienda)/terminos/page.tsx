import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/terminos" } };

export default function TermsPage() {
  return (
    <div className="container-page prose-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Términos y condiciones</h1>
      <p className="mt-4 text-sm text-muted">Texto modelo: revisalo con tu asesor legal antes de publicar.</p>
      <h2>1. Generalidades</h2>
      <p>El uso de este sitio implica la aceptación de estos términos. {site.name} puede modificarlos en cualquier momento.</p>
      <h2>2. Precios y medios de pago</h2>
      <p>Los precios están expresados en pesos argentinos e incluyen IVA. Los pagos se procesan a través de Mercado Pago; no almacenamos datos de tarjetas.</p>
      <h2>3. Stock</h2>
      <p>La compra queda confirmada al acreditarse el pago. Si un producto se quedara sin stock, te ofreceremos un cambio o el reintegro total.</p>
      <h2>4. Derecho de arrepentimiento</h2>
      <p>Según la Ley 24.240 de Defensa del Consumidor, podés revocar la compra dentro de los 10 días corridos desde la entrega, sin costo. Usá el botón de arrepentimiento o escribinos desde la página de contacto.</p>
      <h2>5. Datos personales</h2>
      <p>Tus datos se usan solo para procesar tus pedidos, conforme a la Ley 25.326 de Protección de Datos Personales.</p>
    </div>
  );
}
