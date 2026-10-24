# Tienda Online 1.0

Tienda online responsive con catálogo, carrito, cobro con **Mercado Pago Checkout Pro** y **panel de administración** para gestionar productos, stock, pedidos, clientes, cupones y usuarios.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma (SQLite en desarrollo, PostgreSQL en producción).

## Qué incluye

| Área | Funcionalidades |
| --- | --- |
| Tienda | Inicio, catálogo con filtros (categoría, talle, color, precio) y buscador, ficha con variantes y galería, carrito, checkout, mi cuenta |
| Clientes | Registro/login, historial de pedidos, datos y dirección guardados |
| Pagos | Mercado Pago Checkout Pro (tarjetas, débito, dinero en cuenta, cuotas), webhooks con validación de firma, estados de pedido, emails de confirmación |
| Envíos | Tarifa fija por zona y retiro en local |
| Panel `/admin` | Resumen de ventas (por período, por día, top productos, stock bajo), productos con variantes/fotos/stock, categorías, pedidos y estados con aviso por email, clientes, cupones, zonas de envío, usuarios con roles, mensajes de contacto |
| Institucional | Nosotros, Contacto (formulario), Envíos, Términos, botón de arrepentimiento, botón flotante de WhatsApp |
| SEO y analítica | URLs amigables, metadatos y Open Graph, datos estructurados de producto, `sitemap.xml`, `robots.txt`, Google Analytics 4, Search Console, píxel de Meta |

Roles del panel: **Administrador** (todo) y **Operador** (productos, stock, pedidos, clientes y mensajes).

## Puesta en marcha (desarrollo)

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env        # completar valores
npx prisma db push          # crea la base
npm run db:seed             # admin inicial + datos de ejemplo
npm run dev
```

- Tienda: http://localhost:3000
- Panel: http://localhost:3000/admin con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.
- Cupón de ejemplo: `BIENVENIDA10`.

Sin `MP_ACCESS_TOKEN`, en desarrollo los pagos se aprueban automáticamente (modo demo) para poder probar todo el circuito. En producción el modo demo está apagado salvo que se defina `PAYMENTS_DEMO="true"`.

## Mercado Pago

1. Crear una aplicación en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) (producto: Checkout Pro).
2. Copiar el **Access Token** (de prueba o de producción) en `MP_ACCESS_TOKEN`.
3. En *Webhooks*, configurar la URL `https://TU-DOMINIO/api/webhooks/mercadopago` con el evento **Pagos**, y copiar la clave secreta en `MP_WEBHOOK_SECRET`.
4. `MP_MAX_INSTALLMENTS` limita las cuotas ofrecidas.

Flujo: el checkout crea el pedido como *Pendiente de pago* y redirige a Mercado Pago. Al aprobarse el pago (webhook o regreso del comprador) el pedido pasa a *Pagado*, se descuenta el stock y el uso del cupón una sola vez, y se envía el email de confirmación al cliente y, si está configurado, a `ADMIN_NOTIFY_EMAIL`.

Para probar con dinero ficticio usar credenciales y [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test/test-cards). Los webhooks y el retorno automático requieren una URL pública con HTTPS (en local se puede usar un túnel como `ngrok` o `cloudflared`).

## Emails

Configurar SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). Funciona con Gmail (contraseña de aplicación), Brevo, Mailgun, Amazon SES, etc. Sin SMTP los envíos se registran en la consola.

## Publicación (producción)

1. Crear una base PostgreSQL (Neon, Supabase, Railway, etc.).
2. En `prisma/schema.prisma` cambiar `provider = "sqlite"` por `provider = "postgresql"` y poner la URL en `DATABASE_URL`.
3. Definir todas las variables de `.env.example` en el hosting, con `NEXT_PUBLIC_SITE_URL` = dominio final con `https://` y un `AUTH_SECRET` largo y aleatorio (`openssl rand -base64 32`).
4. Ejecutar `npx prisma db push` y `npm run db:seed` contra la base de producción (cambiar luego la contraseña del admin desde *Mi cuenta*).
5. `npm run build` y `npm start` (o desplegar en Vercel / un VPS con Node).

**Imágenes:** las fotos subidas desde el panel se guardan en `public/uploads`, lo que requiere disco persistente (VPS, Railway con volumen). En hosting sin disco (Vercel) cargar las fotos por URL desde un servicio de imágenes (Cloudinary, S3, etc.).

El certificado SSL lo provee el hosting (Vercel, Cloudflare o Let's Encrypt en un VPS).

## SEO y analítica

- `NEXT_PUBLIC_GA_ID`: ID de medición de GA4 (`G-XXXX`). Se registran `add_to_cart`, `begin_checkout` y `purchase`.
- `NEXT_PUBLIC_META_PIXEL_ID`: píxel de Meta (PageView, AddToCart, InitiateCheckout, Purchase).
- `NEXT_PUBLIC_GSC_VERIFICATION`: código de verificación de Search Console (método etiqueta HTML). Luego enviar `https://TU-DOMINIO/sitemap.xml`.

## Personalización de marca

- Nombre, WhatsApp y URL: variables `NEXT_PUBLIC_*`.
- Colores: bloque `@theme` en `src/app/globals.css`.
- Textos institucionales: `src/app/(tienda)/nosotros`, `envios`, `terminos`.

## Estructura

```
prisma/              esquema de datos y seed
src/app/(tienda)/    páginas públicas, checkout y cuenta
src/app/admin/       panel de administración y sus acciones
src/app/api/         webhook de Mercado Pago y subida de imágenes
src/lib/             base de datos, sesión, Mercado Pago, pedidos, email
src/components/      componentes compartidos (carrito, header, etc.)
docs/MANUAL.md       manual de uso del panel
```

Manual para el equipo de la tienda: [docs/MANUAL.md](docs/MANUAL.md).
