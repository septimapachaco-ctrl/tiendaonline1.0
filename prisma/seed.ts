// Datos iniciales: usuario administrador, categorías, zonas de envío y productos de ejemplo.
// Uso: npm run db:seed  (es seguro correrlo varias veces)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/1000`;

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@mitienda.test").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin-dev-1234";
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Administrador", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });

  if ((await db.shippingZone.count()) === 0) {
    await db.shippingZone.createMany({
      data: [
        { name: "local (Av. Siempreviva 742, CABA)", price: 0, isPickup: true, sortOrder: 0 },
        { name: "CABA", price: 4500, sortOrder: 1 },
        { name: "GBA", price: 6500, sortOrder: 2 },
        { name: "Resto del país", price: 9500, sortOrder: 3 },
      ],
    });
  }

  if ((await db.product.count()) > 0) {
    console.log("Ya hay productos: se omiten los de ejemplo.");
    return;
  }

  const cats = await Promise.all(
    ["Remeras", "Buzos", "Pantalones", "Accesorios"].map((name, i) =>
      db.category.create({ data: { name, slug: name.toLowerCase(), sortOrder: i } }),
    ),
  );
  const [remeras, buzos, pantalones, accesorios] = cats;

  const products = [
    { name: "Remera Básica Algodón", cat: remeras, price: 18900, compare: 22900, sizes: ["S", "M", "L", "XL"], colors: ["Negro", "Blanco"], featured: true },
    { name: "Remera Oversize Estampada", cat: remeras, price: 24500, sizes: ["M", "L", "XL"], colors: ["Gris"], featured: true },
    { name: "Buzo Canguro Frisa", cat: buzos, price: 45900, sizes: ["S", "M", "L"], colors: ["Azul", "Verde"], featured: true },
    { name: "Buzo Cuello Redondo", cat: buzos, price: 39900, compare: 44900, sizes: ["M", "L"], colors: ["Beige"] },
    { name: "Jean Recto Clásico", cat: pantalones, price: 52000, sizes: ["38", "40", "42", "44"], colors: ["Azul"], featured: true },
    { name: "Jogger Algodón", cat: pantalones, price: 34900, sizes: ["S", "M", "L"], colors: ["Negro", "Gris"] },
    { name: "Gorra Bordada", cat: accesorios, price: 14900, sizes: [], colors: ["Negro", "Beige"] },
    { name: "Tote Bag Lona", cat: accesorios, price: 12500, sizes: [], colors: [] },
  ];

  for (const [i, p] of products.entries()) {
    const slug = p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
    const sizes = p.sizes.length ? p.sizes : [null];
    const colors = p.colors.length ? p.colors : [null];
    await db.product.create({
      data: {
        name: p.name,
        slug,
        description: `${p.name} de excelente calidad. Producto de ejemplo: editá este texto desde el panel.`,
        price: p.price,
        comparePrice: p.compare ?? null,
        featured: p.featured ?? false,
        categoryId: p.cat.id,
        images: { create: [0, 1].map((n) => ({ url: img(`${slug}-${n}`), sortOrder: n })) },
        variants: {
          create: sizes.flatMap((size, si) =>
            colors.map((color, ci) => ({ size, color, stock: i === 3 ? 0 : 2 + ((i * 5 + si * 3 + ci) % 10) })),
          ),
        },
      },
    });
  }

  await db.coupon.upsert({
    where: { code: "BIENVENIDA10" },
    update: {},
    create: { code: "BIENVENIDA10", type: "PERCENT", value: 10 },
  });

  console.log(`Listo. Panel: /admin con ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
