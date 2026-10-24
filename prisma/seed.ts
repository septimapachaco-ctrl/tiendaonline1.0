// Datos iniciales: usuario administrador, categorías, zonas de envío y catálogo de ejemplo.
// Uso: npm run db:seed  (es seguro correrlo varias veces)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categories, placeholderImage, products, slugOf } from "./catalog";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await db.user.upsert({
      where: { email },
      update: { role: "ADMIN" },
      create: { email, name: "Administrador", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Administrador listo: ${email}`);
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD vacíos: no se creó el administrador.");
  }

  if ((await db.shippingZone.count()) === 0) {
    await db.shippingZone.createMany({
      data: [
        { name: "nuestro local", price: 0, isPickup: true, sortOrder: 0 },
        { name: "CABA", price: 4500, sortOrder: 1 },
        { name: "GBA", price: 6500, sortOrder: 2 },
        { name: "Resto del país", price: 9500, sortOrder: 3 },
      ],
    });
  }

  if ((await db.product.count()) > 0) {
    console.log("Ya hay productos: se omite el catálogo de ejemplo.");
    return;
  }

  const catIds = new Map<string, string>();
  for (const [i, name] of categories.entries()) {
    const cat = await db.category.upsert({
      where: { slug: slugOf(name) },
      update: {},
      create: { name, slug: slugOf(name), sortOrder: i },
    });
    catIds.set(name, cat.id);
  }

  for (const [i, p] of products.entries()) {
    const slug = slugOf(p.name);
    const sizes = p.sizes.length ? p.sizes : [null];
    const colors = p.colors.length ? p.colors : [null];
    await db.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        comparePrice: p.compare ?? null,
        featured: p.featured ?? false,
        categoryId: catIds.get(p.category),
        images: { create: [0, 1].map((n) => ({ url: placeholderImage(p.name, p.color, n), sortOrder: n })) },
        variants: {
          create: sizes.flatMap((size, si) =>
            colors.map((color, ci) => ({ size, color, stock: 3 + ((i * 5 + si * 3 + ci) % 10) })),
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

  console.log("Catálogo de ejemplo cargado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
