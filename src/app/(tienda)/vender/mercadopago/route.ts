import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import { mpMarketplaceEnabled, oauthAuthorizeUrl } from "@/lib/mercadopago";
import { requireSeller } from "@/lib/sellers";
import { site } from "@/lib/site";

// Inicia la conexión de la cuenta de Mercado Pago del vendedor (OAuth).
export async function GET() {
  const { seller } = await requireSeller();
  if (!mpMarketplaceEnabled()) {
    return NextResponse.redirect(`${site.url}/vender/panel?mp=sin-configurar`);
  }
  // el "state" firmado evita que alguien conecte su cuenta al perfil de otra persona
  const state = await new SignJWT({ sellerId: seller.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  return NextResponse.redirect(oauthAuthorizeUrl(site.url, state));
}
