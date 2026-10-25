# Manual de uso del panel de administración

Ingresá en `https://TU-DOMINIO/login` con tu email y contraseña. Los usuarios del panel entran directo a **/admin**.

## 1. Resumen

Muestra las ventas del período elegido (7, 30, 90 días o 1 año): total vendido, cantidad de pedidos pagados, ticket promedio, pedidos por preparar, gráfico de ventas por día, productos más vendidos y variantes con stock bajo (3 unidades o menos).

## 2. Pedidos

- Filtrá por estado o buscá por número, nombre o email.
- Entrá a un pedido para ver productos, datos del cliente, dirección y detalle del pago.
- **Estados:** Pendiente de pago → Pagado → En preparación → Enviado → Entregado. También *Cancelado*.
- El pago lo confirma Mercado Pago automáticamente: no hace falta marcarlo como pagado.
- Al pasar a *Enviado* cargá el **código de seguimiento**. Con la casilla “Avisar al cliente” marcada, se le envía un email con el nuevo estado.
- Cancelar un pedido pagado **devuelve el stock**. La devolución del dinero se hace desde tu cuenta de Mercado Pago (Actividad → el pago → Devolver).
- El teléfono del cliente abre WhatsApp con un clic.

## 3. Productos y stock

- **Nuevo producto:** nombre, descripción, precio y, si querés, precio anterior (aparece tachado con el % de descuento).
- **Fotos:** “Subir fotos” (JPG, PNG o WEBP, hasta 4 MB) o pegá la URL de una imagen. La primera es la portada; ordenalas con las flechas.
- **Variantes:** escribí los talles y colores separados por coma y tocá “Generar combinaciones”. Cargá el stock de cada una. El “Precio propio” es opcional, para variantes con otro precio. Si el producto no tiene variantes, dejá una sola fila vacía con el stock.
- **Publicado:** destildalo para ocultar el producto sin borrarlo. **Destacado:** aparece en el inicio.
- **Stock rápido:** en la lista de productos podés editar el stock de todas las variantes y tocar “Guardar stock”.
- El stock se descuenta solo cuando un pago se aprueba. Las variantes sin stock no se pueden comprar.
- Eliminar un producto con ventas lo oculta (para conservar el historial).

## 4. Categorías

Creá, renombrá u ordená categorías (número de orden menor = aparece primero). Las 4 primeras se muestran en el menú y en el inicio.

## 5. Clientes

Lista de compradores registrados y compras como invitado, con cantidad de compras, total gastado y fecha de la última compra.

## 6. Mensajes

Consultas recibidas desde el formulario de contacto y el botón de arrepentimiento. Marcalas como leídas al responderlas.

## 7. Cupones (solo administradores)

- **% off** o **$ fijo**, compra mínima, cantidad máxima de usos y fecha de vencimiento.
- El uso se cuenta solo cuando el pago se aprueba.
- Destildá “Activo” para pausar un cupón.

## 8. Envíos (solo administradores)

Zonas con tarifa fija (ej. CABA, GBA, Resto del país). Marcá “Retiro” para el retiro en local: el cliente no tiene que cargar dirección. Poné costo 0 para envío gratis.

## 9. Usuarios (solo administradores)

- **Administrador:** acceso a todo.
- **Operador:** productos, stock, pedidos, clientes y mensajes.
- Para dar acceso, cargá nombre, email, rol y contraseña. Para quitarlo, elegí el rol “Cliente”.
- Para cambiar tu contraseña: menú de la tienda → *Mi cuenta*.

## 10. Vendedores (solo administradores)

Lista de familias, artesanos y productores que venden en la página, con su conexión a Mercado Pago, publicaciones, ventas y la comisión que te dejaron.

- **Comisión general:** el porcentaje que cobra la página por venta, uno para usados y otro para artesanos. Aplica a ventas nuevas.
- **Comisión propia:** si querés darle a un vendedor un porcentaje distinto (por ejemplo, una promoción de lanzamiento), cargalo en su fila. Vacío = usa la general.
- **Suspender:** oculta el perfil y todas sus publicaciones al instante. Usalo si alguien intenta vender por fuera de la página o publica productos prohibidos.

El dinero de esas ventas entra a la cuenta de Mercado Pago de cada vendedor; tu comisión llega sola a tu cuenta. En **Resumen** ves por separado las ventas de la tienda y las comisiones del marketplace.

## 11. Preguntas

Todas las preguntas que los compradores hacen en las publicaciones. La página ya bloquea teléfonos, emails, links y redes; si alguna igual intenta llevar la venta afuera, tocá **Ocultar**.

## Cómo funciona para los vendedores

1. Se registran, entran a **Vender → Quiero vender** y completan su perfil (aceptando las reglas).
2. Conectan su Mercado Pago desde **Perfil y cobros**. Sin eso, sus publicaciones no se muestran.
3. Publican desde **Publicaciones** (fotos reales, estado, precio). Se publican al instante.
4. Responden preguntas, y cuando venden reciben un email. En **Ventas** ven los datos del comprador, cargan el seguimiento del envío o, si es entrega en mano, el código de 4 dígitos que les dicta el comprador al recibir el producto.

## Preguntas frecuentes

**Un cliente pagó pero el pedido sigue pendiente.** Los pagos en efectivo o en revisión pueden demorar. Cuando Mercado Pago lo acredite, el pedido cambia solo. Revisá el pago en tu cuenta de Mercado Pago con el número de pedido.

**¿Dónde veo la plata?** En tu cuenta de Mercado Pago. La tienda no guarda datos de tarjetas.

**Quiero cambiar textos de “Nosotros” o “Términos”.** Esos textos están en el código; pedíselo a tu desarrollador (incluido en el mantenimiento mensual).
