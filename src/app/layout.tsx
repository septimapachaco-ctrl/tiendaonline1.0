import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { CartProvider } from "@/components/CartProvider";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, locale: "es_AR", type: "website" },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = { themeColor: "#1f3a5f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-screen antialiased">
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
