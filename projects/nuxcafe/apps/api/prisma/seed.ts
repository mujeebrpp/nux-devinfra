import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

/**
 * Load the project-level environment contract (see projects/README.md)
 * when DATABASE_URL is not already present in the environment.
 * The seed script is run directly via tsx, so it cannot rely on
 * the Prisma CLI to inject environment variables.
 */
if (!process.env.DATABASE_URL) {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(dir, ".env.local");
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
}

const prisma = new PrismaClient();

/**
 * Local development seed for NuxCafe.
 *
 * Idempotent: run it any number of times - ingredients,
 * menu items and recipes are upserted by their unique
 * slugs, opening stock movements are replayed, and the
 * two sample orders (marked with a "SEED-" order number)
 * are recreated fresh on every run so they always land
 * relative to "now".
 */

interface SeedIngredient {
  slug: string;
  name: string;
  unit: "G" | "KG" | "ML" | "L" | "PCS";
  costCents: number;
  quantity: number;
  minQuantity: number;
}

const INGREDIENTS: SeedIngredient[] = [
  { slug: "espresso-beans", name: "Espresso Beans", unit: "G", costCents: 3, quantity: 5000, minQuantity: 1000 },
  { slug: "matcha-powder", name: "Matcha Powder", unit: "G", costCents: 50, quantity: 500, minQuantity: 100 },
  { slug: "whole-milk", name: "Whole Milk", unit: "ML", costCents: 1, quantity: 6000, minQuantity: 1500 },
  { slug: "oat-milk", name: "Oat Milk", unit: "ML", costCents: 2, quantity: 3000, minQuantity: 1000 },
  { slug: "sugar-syrup", name: "Sugar Syrup", unit: "ML", costCents: 1, quantity: 1500, minQuantity: 500 },
  { slug: "vanilla-syrup", name: "Vanilla Syrup", unit: "ML", costCents: 1, quantity: 1200, minQuantity: 400 },
  { slug: "butter", name: "Butter", unit: "G", costCents: 1, quantity: 2000, minQuantity: 500 },
  { slug: "flour", name: "Flour", unit: "G", costCents: 1, quantity: 10000, minQuantity: 2000 },
  { slug: "eggs", name: "Eggs", unit: "PCS", costCents: 25, quantity: 120, minQuantity: 30 },
  { slug: "sourdough-slices", name: "Sourdough Slices", unit: "PCS", costCents: 50, quantity: 400, minQuantity: 100 },
  { slug: "coffee-cups", name: "Coffee Cups", unit: "PCS", costCents: 8, quantity: 500, minQuantity: 100 },
  { slug: "cup-lids", name: "Cup Lids", unit: "PCS", costCents: 3, quantity: 500, minQuantity: 100 },
  { slug: "water", name: "Filtered Water", unit: "ML", costCents: 0, quantity: 10000, minQuantity: 1000 },
];

interface SeedMenuItem {
  slug: string;
  name: string;
  description: string;
  category: "COFFEE" | "TEA" | "PASTRY" | "FOOD";
  priceCents: number;
  prepMinutes: number;
}

const MENU_ITEMS: SeedMenuItem[] = [
  { slug: "espresso", name: "Espresso", description: "Double shot of house espresso.", category: "COFFEE", priceCents: 300, prepMinutes: 2 },
  { slug: "cappuccino", name: "Cappuccino", description: "Espresso with steamed milk and foam.", category: "COFFEE", priceCents: 450, prepMinutes: 4 },
  { slug: "cafe-latte", name: "Cafe Latte", description: "Espresso with silky steamed milk.", category: "COFFEE", priceCents: 500, prepMinutes: 4 },
  { slug: "mocha", name: "Mocha", description: "Espresso, chocolate syrup and steamed milk.", category: "COFFEE", priceCents: 550, prepMinutes: 5 },
  { slug: "matcha-latte", name: "Matcha Latte", description: "Ceremonial matcha whisked with milk.", category: "TEA", priceCents: 550, prepMinutes: 5 },
  { slug: "butter-croissant", name: "Butter Croissant", description: "Flaky laminated pastry, baked in-house.", category: "PASTRY", priceCents: 350, prepMinutes: 3 },
  { slug: "blueberry-muffin", name: "Blueberry Muffin", description: "Baked daily with wild blueberries.", category: "PASTRY", priceCents: 400, prepMinutes: 3 },
  { slug: "avocado-toast", name: "Avocado Toast", description: "Smashed avocado on sourdough with jammy egg.", category: "FOOD", priceCents: 850, prepMinutes: 8 },
];

/** Recipe per menu item slug: [ingredientSlug, quantity in ingredient unit]. */
const RECIPES: Record<string, [string, number][]> = {
  espresso: [["espresso-beans", 18], ["water", 30]],
  cappuccino: [["espresso-beans", 18], ["water", 30], ["whole-milk", 150]],
  "cafe-latte": [["espresso-beans", 18], ["water", 30], ["whole-milk", 200]],
  mocha: [["espresso-beans", 18], ["water", 30], ["whole-milk", 180], ["sugar-syrup", 15]],
  "matcha-latte": [["matcha-powder", 4], ["whole-milk", 200], ["sugar-syrup", 15]],
  "butter-croissant": [["flour", 120], ["butter", 35], ["eggs", 0.25]],
  "blueberry-muffin": [["flour", 100], ["eggs", 0.5], ["butter", 30], ["sugar-syrup", 20]],
  "avocado-toast": [["sourdough-slices", 2], ["eggs", 1], ["butter", 5]],
};

async function main(): Promise<void> {
  console.log("Seeding NuxCafe development database...");

  // 1. Ingredients (upserted by slug).
  for (const ingredient of INGREDIENTS) {
    await prisma.ingredient.upsert({
      where: { slug: ingredient.slug },
      update: {
        name: ingredient.name,
        unit: ingredient.unit,
        costCents: ingredient.costCents,
        quantity: ingredient.quantity,
        minQuantity: ingredient.minQuantity,
        isActive: true,
      },
      create: ingredient,
    });
  }

  // 2. Opening-stock movements (replayed fresh on every run).
  await prisma.stockMovement.deleteMany({
    where: { reference: "opening-stock" },
  });
  for (const ingredient of INGREDIENTS) {
    const record = await prisma.ingredient.findUniqueOrThrow({
      where: { slug: ingredient.slug },
    });
    await prisma.stockMovement.create({
      data: {
        ingredientId: record.id,
        type: "PURCHASE",
        quantity: ingredient.quantity,
        note: "Opening stock",
        reference: "opening-stock",
      },
    });
  }

  // 3. Menu items (upserted by slug).
  for (const menuItem of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { slug: menuItem.slug },
      update: {
        name: menuItem.name,
        description: menuItem.description,
        category: menuItem.category,
        priceCents: menuItem.priceCents,
        prepMinutes: menuItem.prepMinutes,
        isActive: true,
      },
      create: menuItem,
    });
  }

  // 4. Recipes (replaced wholesale on every run).
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  for (const menuItem of MENU_ITEMS) {
    const rows = RECIPES[menuItem.slug] ?? [];
    if (rows.length === 0) {
      continue;
    }
    const menuItemRecord = await prisma.menuItem.findUniqueOrThrow({
      where: { slug: menuItem.slug },
    });
    const items = [];
    for (const [ingredientSlug, quantity] of rows) {
      const ingredient = await prisma.ingredient.findUniqueOrThrow({
        where: { slug: ingredientSlug },
      });
      items.push({ ingredientId: ingredient.id, quantity });
    }
    await prisma.recipe.create({
      data: { menuItemId: menuItemRecord.id, items: { create: items } },
    });
  }

  // 5. Sample orders: removed and recreated on every run so
  //    they always land relative to "now".
  const seedOrders = await prisma.order.findMany({
    where: { number: { startsWith: "SEED-" } },
  });
  for (const order of seedOrders) {
    // Productions point back at the order (FK default is
    // SetNull), so clear them explicitly first.
    await prisma.production.deleteMany({ where: { orderId: order.id } });
    await prisma.sale.deleteMany({ where: { orderId: order.id } });
  }
  if (seedOrders.length > 0) {
    await prisma.order.deleteMany({
      where: { number: { startsWith: "SEED-" } },
    });
  }
  await prisma.stockMovement.deleteMany({
    where: { reference: { startsWith: "SEED-" } },
  });

  const espresso = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "espresso" },
  });
  const croissant = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "butter-croissant" },
  });
  const latte = await prisma.menuItem.findUniqueOrThrow({
    where: { slug: "cafe-latte" },
  });

  // A completed order: consumes stock and records a sale.
  const completedNumber = `SEED-${Date.now().toString(36).toUpperCase()}-C`;
  await prisma.order.create({
    data: {
      number: completedNumber,
      status: "COMPLETED",
      totalCents: espresso.priceCents * 2 + croissant.priceCents,
      completedAt: new Date(),
      items: {
        create: [
          { menuItemId: espresso.id, quantity: 2, priceCents: espresso.priceCents },
          { menuItemId: croissant.id, quantity: 1, priceCents: croissant.priceCents },
        ],
      },
      productions: {
        create: [
          { menuItemId: espresso.id, quantity: 2, status: "COMPLETED", startedAt: new Date(), completedAt: new Date() },
          { menuItemId: croissant.id, quantity: 1, status: "COMPLETED", startedAt: new Date(), completedAt: new Date() },
        ],
      },
      sale: {
        create: {
          amountCents: espresso.priceCents * 2 + croissant.priceCents,
          itemsCount: 3,
        },
      },
    },
  });

  // Record stock usage for the completed seed order.
  const usage: [string, number][] = [
    ["espresso-beans", 18 * 2],
    ["water", 30 * 2],
    ["flour", 120],
    ["butter", 35],
    ["eggs", 0.25],
  ];
  for (const [ingredientSlug, amount] of usage) {
    if (amount <= 0) {
      continue;
    }
    const ingredient = await prisma.ingredient.findUniqueOrThrow({
      where: { slug: ingredientSlug },
    });
    await prisma.ingredient.update({
      where: { id: ingredient.id },
      data: { quantity: ingredient.quantity - amount },
    });
    await prisma.stockMovement.create({
      data: {
        ingredientId: ingredient.id,
        type: "USAGE",
        quantity: amount,
        note: `Order ${completedNumber}`,
        reference: completedNumber,
      },
    });
  }

  // An in-flight order with a queued production run so the
  // kitchen board shows live work.
  const pendingNumber = `SEED-${Date.now().toString(36).toUpperCase()}-P`;
  await prisma.order.create({
    data: {
      number: pendingNumber,
      status: "PENDING",
      totalCents: latte.priceCents,
      items: {
        create: [{ menuItemId: latte.id, quantity: 1, priceCents: latte.priceCents }],
      },
      productions: {
        create: [{ menuItemId: latte.id, quantity: 1, status: "QUEUED" }],
      },
    },
  });

  console.log(
    `Seeded ${await prisma.ingredient.count()} ingredients, ${await prisma.menuItem.count()} menu items, ` +
      `${await prisma.recipe.count()} recipes, ${await prisma.production.count()} production runs, ` +
      `${await prisma.order.count()} orders, ${await prisma.sale.count()} sales.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

