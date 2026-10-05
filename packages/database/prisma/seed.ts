/**
 * Demo seed: realistic restaurant data for exploration, demos and
 * screenshots. Safe to re-run — static entities are upserted and order
 * history is only generated on an empty database.
 *
 * Demo logins (password for all: Demo1234!):
 *   owner@demo.local / manager@demo.local / cashier@demo.local
 *   waiter@demo.local / kitchen@demo.local
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_PASSWORD = "Demo1234!";

/** Deterministic RNG so every fresh seed looks the same. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260929);
const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)];
const int = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));

async function upsertUser(
  email: string,
  name: string,
  role: "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN",
) {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, status: "ACTIVE" },
    create: { email, name, password, role, status: "ACTIVE" },
  });
}

async function upsertCategory(name: string, description: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.category.create({ data: { name, description } });
}

async function upsertProduct(
  categoryId: string,
  name: string,
  price: number,
  description: string,
) {
  const existing = await prisma.product.findFirst({ where: { name } });
  const imageUrl = `https://picsum.photos/seed/${name.toLowerCase().replace(/[^a-z]+/g, "-")}/400/300`;
  if (existing) {
    return prisma.product.update({
      where: { id: existing.id },
      data: { categoryId, price, description, imageUrl, isAvailable: true, isDeleted: false },
    });
  }
  return prisma.product.create({
    data: { categoryId, name, price, description, imageUrl },
  });
}

async function upsertIngredient(
  name: string,
  unit: string,
  quantityInStock: number,
  lowStockThreshold: number,
) {
  const existing = await prisma.ingredient.findUnique({ where: { name } });
  if (existing) {
    return prisma.ingredient.update({
      where: { id: existing.id },
      data: { unit, quantityInStock, lowStockThreshold, isActive: true },
    });
  }
  return prisma.ingredient.create({
    data: { name, unit, quantityInStock, lowStockThreshold },
  });
}

async function main() {
  const restaurant =
    (await prisma.restaurant.findFirst()) ??
    (await prisma.restaurant.create({
      data: {
        name: "Track Order",
        description: "Farm-fresh burgers, pizza and more.",
        phone: "01000000000",
        address: "12 Tahrir St, Cairo",
        primaryColor: "#059669",
      },
    }));
  console.log(`Restaurant: ${restaurant.name}`);

  await upsertUser("owner@demo.local", "Demo Owner", "OWNER");
  await upsertUser("manager@demo.local", "Mona Manager", "MANAGER");
  await upsertUser("cashier@demo.local", "Karim Cashier", "CASHIER");
  await upsertUser("waiter@demo.local", "Sara Waiter", "WAITER");
  await upsertUser("kitchen@demo.local", "Omar Kitchen", "KITCHEN");
  console.log("Users: 5 demo staff (password Demo1234!)");

  const burgers = await upsertCategory("Burgers", "Smashed, stacked, served hot");
  const pizza = await upsertCategory("Pizza", "Wood-fired classics");
  const drinks = await upsertCategory("Drinks", "Cold and fizzy");
  const desserts = await upsertCategory("Desserts", "Save room");

  const products = [
    await upsertProduct(burgers.id, "Classic Burger", 150, "Beef, cheddar, house sauce"),
    await upsertProduct(burgers.id, "Double Smash", 220, "Two patties, double cheese"),
    await upsertProduct(burgers.id, "Chicken Crispy", 130, "Fried chicken, slaw, garlic mayo"),
    await upsertProduct(burgers.id, "Cheese Fries", 90, "Loaded fries with cheese sauce"),
    await upsertProduct(pizza.id, "Margherita", 160, "Tomato, mozzarella, basil"),
    await upsertProduct(pizza.id, "Pepperoni", 200, "Pepperoni, mozzarella, oregano"),
    await upsertProduct(pizza.id, "Veggie", 170, "Peppers, mushrooms, olives"),
    await upsertProduct(drinks.id, "Cola", 40, "Chilled 330ml"),
    await upsertProduct(drinks.id, "Lemon Mint", 55, "Fresh-pressed with mint"),
    await upsertProduct(drinks.id, "Milkshake", 85, "Vanilla or chocolate"),
    await upsertProduct(desserts.id, "Molten Cake", 95, "Warm chocolate core"),
    await upsertProduct(desserts.id, "Cheesecake", 110, "Baked, berry topping"),
  ];
  console.log(`Menu: 4 categories, ${products.length} products`);

  const bun = await upsertIngredient("Bun", "pcs", 8, 20);
  const beef = await upsertIngredient("Beef Patty", "pcs", 60, 15);
  const cheese = await upsertIngredient("Cheddar", "slices", 12, 30);
  const flour = await upsertIngredient("Flour", "kg", 40, 10);
  const tomato = await upsertIngredient("Tomato Sauce", "liter", 15, 5);
  const potato = await upsertIngredient("Potato", "kg", 25, 8);
  const chicken = await upsertIngredient("Chicken Breast", "pcs", 30, 10);
  const cola = await upsertIngredient("Cola Syrup", "liter", 20, 5);
  await upsertIngredient("Lettuce", "pcs", 45, 10);
  await upsertIngredient("Chocolate", "kg", 12, 4);
  console.log("Ingredients: 10 (Bun + Cheddar intentionally low)");

  const recipe: Record<string, Array<[string, number]>> = {
    "Classic Burger": [[bun.id, 1], [beef.id, 1], [cheese.id, 1]],
    "Double Smash": [[bun.id, 1], [beef.id, 2], [cheese.id, 2]],
    "Chicken Crispy": [[bun.id, 1], [chicken.id, 1]],
    "Cheese Fries": [[potato.id, 0.3], [cheese.id, 2]],
    Margherita: [[flour.id, 0.25], [cheese.id, 2], [tomato.id, 0.1]],
    Pepperoni: [[flour.id, 0.25], [cheese.id, 2], [tomato.id, 0.1]],
    Veggie: [[flour.id, 0.25], [cheese.id, 1], [tomato.id, 0.1]],
    Cola: [[cola.id, 0.05]],
  };
  for (const product of products) {
    const rows = recipe[product.name] ?? [];
    await prisma.productIngredient.deleteMany({
      where: { productId: product.id },
    });
    if (rows.length > 0) {
      await prisma.productIngredient.createMany({
        data: rows.map(([ingredientId, quantityUsed]) => ({
          productId: product.id,
          ingredientId,
          quantityUsed,
        })),
      });
    }
  }
  console.log("Recipes attached");

  const tables = [];
  for (let number = 1; number <= 6; number += 1) {
    tables.push(
      await prisma.restaurantTable.upsert({
        where: { number },
        update: { name: `Table ${number}`, status: "AVAILABLE" },
        create: {
          number,
          name: `Table ${number}`,
          qrCode: `tbl_demo_${number}`,
        },
      }),
    );
  }
  console.log("Tables: 6 (qr tbl_demo_1..6)");

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: { isActive: true },
    create: {
      code: "WELCOME10",
      discountType: "PERCENT",
      value: 10,
      maxUses: 100,
    },
  });
  console.log("Coupon: WELCOME10 (10%)");

  const existingOrders = await prisma.order.count();
  if (existingOrders > 0) {
    console.log(`Orders: skipped (${existingOrders} already exist)`);
  } else {
    await seedHistory(products, tables);
  }

  await seedLoyalty();
  console.log("Done.");
}

async function seedHistory(
  products: Array<{ id: string; price: Prisma.Decimal }>,
  tables: Array<{ id: string }>,
) {
  const now = new Date();
  let created = 0;

  for (let daysAgo = 14; daysAgo >= 1; daysAgo -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - daysAgo);
    const ordersToday = int(8, 18);

    for (let n = 0; n < ordersToday; n += 1) {
      const createdAt = new Date(day);
      createdAt.setHours(int(11, 23), int(0, 59), 0, 0);

      const itemCount = int(1, 3);
      const items = [];
      let subtotal = new Prisma.Decimal(0);
      for (let i = 0; i < itemCount; i += 1) {
        const product = pick(products);
        const quantity = int(1, 3);
        const unitPrice = new Prisma.Decimal(product.price.toString());
        const totalPrice = unitPrice.mul(quantity);
        subtotal = subtotal.add(totalPrice);
        items.push({ productId: product.id, quantity, unitPrice, totalPrice });
      }

      const useCoupon = rand() < 0.2;
      const discount = useCoupon ? subtotal.mul(0.1).toDecimalPlaces(2) : new Prisma.Decimal(0);
      const total = subtotal.sub(discount);
      const cancelled = rand() < 0.06;
      const paidAt = new Date(createdAt.getTime() + int(20, 90) * 60_000);

      const order = await prisma.order.create({
        data: {
          tableId: pick(tables).id,
          status: cancelled ? "CANCELLED" : "COMPLETED",
          totalAmount: total,
          paymentStatus: cancelled ? "PENDING" : "PAID",
          couponCode: useCoupon ? "WELCOME10" : null,
          discountAmount: discount,
          customerPhone: rand() < 0.3 ? pick(["01000000001", "01000000002", "01000000003"]) : null,
          tipAmount: rand() < 0.25 ? total.mul(0.1).toDecimalPlaces(2) : 0,
          cancelledAt: cancelled ? paidAt : null,
          cancelledReason: cancelled ? "Customer left" : null,
          items: { create: items },
          createdAt,
          updatedAt: paidAt,
        },
      });

      if (!cancelled) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: total,
            method: pick(["CASH", "CASH", "CARD"] as const),
            status: "PAID",
            paidAt,
            createdAt: paidAt,
          },
        });
        created += 1;
      }
    }
  }

  // A few live orders so KDS / waiter / payments have something to show.
  const liveTable = tables[0].id;
  const live = async (status: "PENDING" | "PREPARING" | "READY", minutesAgo: number) => {
    const createdAt = new Date(now.getTime() - minutesAgo * 60_000);
    const product = products[0];
    const total = new Prisma.Decimal(product.price.toString()).mul(2);
    const order = await prisma.order.create({
      data: {
        tableId: liveTable,
        status,
        totalAmount: total,
        items: {
          create: [
            {
              productId: product.id,
              quantity: 2,
              unitPrice: product.price,
              totalPrice: total,
            },
          ],
        },
        createdAt,
        updatedAt: createdAt,
      },
    });
    await prisma.restaurantTable.update({
      where: { id: liveTable },
      data: { status: "OCCUPIED" },
    });
    return order;
  };
  await live("PENDING", 5);
  await live("PREPARING", 12);
  await live("READY", 20);

  console.log(`Orders: ~2 weeks of history (${created} paid) + 3 live`);
}

async function seedLoyalty() {
  const specs = [
    { phone: "01000000001", lifetime: 640 },
    { phone: "01000000002", lifetime: 120 },
  ];
  for (const spec of specs) {
    const account = await prisma.loyaltyAccount.upsert({
      where: { phone: spec.phone },
      update: {},
      create: { phone: spec.phone },
    });
    const existing = await prisma.loyaltyPointEntry.count({
      where: { accountId: account.id },
    });
    if (existing === 0) {
      const perEntry = Math.floor(spec.lifetime / 4);
      for (let i = 0; i < 4; i += 1) {
        const earnedAt = new Date();
        earnedAt.setMonth(earnedAt.getMonth() - i * 2);
        const expiresAt = new Date(earnedAt);
        expiresAt.setMonth(expiresAt.getMonth() + 12);
        await prisma.loyaltyPointEntry.create({
          data: {
            accountId: account.id,
            points: i === 3 ? spec.lifetime - perEntry * 3 : perEntry,
            earnedAt,
            expiresAt,
          },
        });
      }
    }
  }
  console.log("Loyalty: 01000000001 (Silver), 01000000002 (Bronze)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
