import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { oauthToken } from "@/lib/mercadopago";
import { saveSellerTokens } from "@/lib/sellers";
import { site } from "@/lib/site";

// Mercado Pago vuelve acá después de que el vendedor autoriza a la página a cobrar en su nombre.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const fail = NextResponse.redirect(`${site.url}/vender/panel?mp=error`);
  if (!code || !state) return fail;

  try {
    const { payload } = await jwtVerify(state, new TextEncoder().encode(process.env.AUTH_SECRET));
    const user = await getCurrentUser();
    const seller = await db.seller.findUnique({ where: { id: String(payload.sellerId) } });
    if (!user || !seller || seller.userId !== user.id) return fail;

    const token = await oauthToken({ code, siteUrl: site.url });
    await saveSellerTokens(seller.id, token);
    return NextResponse.redirect(`${site.url}/vender/panel?mp=ok`);
  } catch (err) {
    console.error("[mp oauth]", err);
    return fail;
  }
}
