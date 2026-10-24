# Mi Pequeña Delfina — Tienda Online 1.0

Tienda online de artículos para bebés y niños, responsive, con catálogo, carrito, cobro con **Mercado Pago Checkout Pro** y **panel de administración** para gestionar productos, stock, pedidos, clientes, cupones y usuarios.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL y Storage en Supabase.

La identidad visual sigue el manual de marca de **Mi Pequeña Delfina**: paleta marina (Azul Marea, Aqua Delfina, Arena Suave y Blanco Espuma, con Violeta Coral y Rosa Concha como acentos), texto en Azul Profundo, tipografías Baloo 2 (títulos), Nunito (texto) y Caveat (acentos), degradado firma, burbujas, olas y Delfina —la delfín bebé— como guía en el inicio, la canasta vacía, la confirmación de compra y la página 404. Los botones usan fondo Azul Marea con texto Azul Profundo (contraste AA 6,4:1); con texto blanco no llegaría a AA. Las burbujas animadas se detienen con `prefers-reduced-motion`.

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
cp .env.example .env        # completar DATABASE_URL, DIRECT_URL y el resto
npx prisma db push          # sincroniza las tablas (en Supabase ya están creadas)
npm run db:seed             # crea el admin (ADMIN_EMAIL/ADMIN_PASSWORD) y, si la base está vacía, el catálogo de ejemplo
npm run dev
```

## Base de datos y fotos en Supabase

Proyecto: `tienda-mi-pequeno-pony` (región São Paulo, `sa-east-1`; el nombre del proyecto se puede cambiar en *Project Settings → General* sin afectar la conexión). Ya tiene creadas las tablas, el catálogo de ejemplo (12 productos, 5 categorías, 4 zonas de envío, cupón `BIENVENIDA10`) y el bucket público `productos` para las fotos.

- **Conexión:** en Supabase → *Connect* → *ORMs* → *Prisma* están las dos URLs. `DATABASE_URL` usa el pooler (puerto 6543, con `pgbouncer=true`) y `DIRECT_URL` la conexión directa (puerto 5432). La contraseña es la de la base; si no la tenés, se resetea en *Project Settings → Database*.
- **Fotos:** `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (*Project Settings → API*). La service role key es secreta: solo va en el servidor/Vercel, nunca en variables `NEXT_PUBLIC_*`.
- **Seguridad:** todas las tablas tienen RLS activado sin políticas. La app accede con Prisma (rol `postgres`), y la API pública de Supabase (clave anon) no puede leer ni escribir datos. Supabase muestra un aviso informativo "RLS enabled, no policy": es intencional.
- **Administrador:** no se creó en la base. Corré `npm run db:seed` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` apuntando a Supabase para crearlo.

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

1. Importar el repositorio en Vercel (vercel.com/new).
2. Cargar `DATABASE_URL` y `DIRECT_URL` de Supabase.
3. Definir todas las variables de `.env.example` en el hosting, con `NEXT_PUBLIC_SITE_URL` = dominio final con `https://` y un `AUTH_SECRET` largo y aleatorio (`openssl rand -base64 32`).
4. Ejecutar `npm run db:seed` contra Supabase para crear el administrador (cambiar luego la contraseña desde *Mi cuenta*).
5. `npm run build` y `npm start` (o desplegar en Vercel / un VPS con Node).

**Imágenes:** con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las fotos subidas desde el panel van al bucket `productos` de Supabase Storage (funciona en Vercel). Sin esas variables se guardan en `public/uploads`, que solo sirve con disco persistente. Las fotos del catálogo de ejemplo son marcadores de color: reemplazarlas por las reales.

El certificado SSL lo provee el hosting (Vercel, Cloudflare o Let's Encrypt en un VPS).

## SEO y analítica

- `NEXT_PUBLIC_GA_ID`: ID de medición de GA4 (`G-XXXX`). Se registran `add_to_cart`, `begin_checkout` y `purchase`.
- `NEXT_PUBLIC_META_PIXEL_ID`: píxel de Meta (PageView, AddToCart, InitiateCheckout, Purchase).
- `NEXT_PUBLIC_GSC_VERIFICATION`: código de verificación de Search Console (método etiqueta HTML). Luego enviar `https://TU-DOMINIO/sitemap.xml`.

## Personalización de marca

- Nombre, WhatsApp y URL: variables `NEXT_PUBLIC_*`.
- Colores: bloque `@theme` en `src/app/globals.css`. Tipografías: `src/app/layout.tsx`. Logo, isotipo y personaje Delfina (SVG): `src/components/Logo.tsx`. Olas: `src/components/Olas.tsx`. Favicon: `src/app/icon.svg`.
- Catálogo de ejemplo: `prisma/catalog.ts`.
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
