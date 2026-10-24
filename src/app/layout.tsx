import type { Metadata, Viewport } from "next";
import { Baloo_2, Caveat, Nunito } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { CartProvider } from "@/components/CartProvider";
import { site } from "@/lib/site";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-nunito" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500"], variable: "--font-caveat" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, locale: "es_AR", type: "website" },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = { themeColor: "#8ECAE6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${baloo.variable} ${nunito.variable} ${caveat.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
