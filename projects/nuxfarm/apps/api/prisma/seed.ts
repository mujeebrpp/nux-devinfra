/**
 * NuxFarm dev seed.
 *
 * Creates one demo farm with multiple locations, two crop cycles
 * (with stage timelines), scheduled tasks, irrigation log entries,
 * inventory items with stock transactions, and one report
 * per report type.
 *
 * Note: this seed deliberately contains no EC/pH or nutrient
 * values — the application does not model them.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 9): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  // Reset domain tables (dev seed only).
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.irrigationLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.cycleStage.deleteMany();
  await prisma.cropCycle.deleteMany();
  await prisma.farmLocation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      email: "demo@nuxfarm.local",
      name: "Demo Grower",
      role: "OWNER",
    },
  });
  const worker = await prisma.user.create({
    data: {
      email: "crew@nuxfarm.local",
      name: "Crew Member",
      role: "MEMBER",
    },
  });

  const farm = await prisma.farm.create({
    data: {
      name: "Riverside Demo Farm",
      code: "RIV-01",
      description:
        "Demo farm used for local development and automated tests.",
      timezone: "UTC",
      address: "1 Demo Lane, Riverside",
    },
  });

  // Multi-location: one farm, several distinct locations.
  const fieldA = await prisma.farmLocation.create({
    data: {
      farmId: farm.id,
      name: "North Field",
      code: "NORTH-FIELD",
      kind: "FIELD",
      areaSqm: 1200,
      description: "Open field, north side of the farm.",
    },
  });
  const greenhouse = await prisma.farmLocation.create({
    data: {
      farmId: farm.id,
      name: "Glasshouse 1",
      code: "GLASSHOUSE-1",
      kind: "GREENHOUSE",
      areaSqm: 450,
      description: "Protected structure for tender crops.",
    },
  });
  const nursery = await prisma.farmLocation.create({
    data: {
      farmId: farm.id,
      name: "Nursery Bay",
      code: "NURSERY-BAY",
      kind: "NURSERY",
      areaSqm: 120,
    },
  });

  // Crop cycle 1 — active, with a stage timeline.
  const cycleA = await prisma.cropCycle.create({
    data: {
      farmId: farm.id,
      locationId: fieldA.id,
      name: "Spring salad greens",
      crop: "Lettuce mix",
      variety: "Mixed leaf",
      status: "ACTIVE",
      startDate: daysFromNow(-20),
      expectedEndDate: daysFromNow(25),
      plantingMethod: "Direct sow",
      notes: "Watered twice daily while establishing.",
      createdById: owner.id,
    },
  });
  await prisma.cycleStage.createMany({
    data: [
      {
        cycleId: cycleA.id,
        name: "Sowing",
        sequence: 0,
        status: "COMPLETED",
        plannedStartDate: daysFromNow(-20),
        plannedEndDate: daysFromNow(-18),
        actualStartDate: daysFromNow(-20),
        actualEndDate: daysFromNow(-19),
      },
      {
        cycleId: cycleA.id,
        name: "Germination",
        sequence: 1,
        status: "COMPLETED",
        plannedStartDate: daysFromNow(-18),
        plannedEndDate: daysFromNow(-10),
        actualStartDate: daysFromNow(-18),
        actualEndDate: daysFromNow(-11),
      },
      {
        cycleId: cycleA.id,
        name: "Vegetative growth",
        sequence: 2,
        status: "IN_PROGRESS",
        plannedStartDate: daysFromNow(-10),
        plannedEndDate: daysFromNow(10),
        actualStartDate: daysFromNow(-11),
      },
      {
        cycleId: cycleA.id,
        name: "Harvest window",
        sequence: 3,
        status: "PLANNED",
        plannedStartDate: daysFromNow(10),
        plannedEndDate: daysFromNow(25),
      },
    ],
  });

  // Crop cycle 2 — planned, in the greenhouse.
  const cycleB = await prisma.cropCycle.create({
    data: {
      farmId: farm.id,
      locationId: greenhouse.id,
      name: "Herbs — greenhouse batch",
      crop: "Basil",
      variety: "Genovese",
      status: "PLANNED",
      startDate: daysFromNow(5),
      expectedEndDate: daysFromNow(50),
      plantingMethod: "Transplant from nursery",
      createdById: owner.id,
    },
  });
  await prisma.cycleStage.createMany({
    data: [
      {
        cycleId: cycleB.id,
        name: "Nursery raising",
        sequence: 0,
        status: "PLANNED",
        plannedStartDate: daysFromNow(-2),
        plannedEndDate: daysFromNow(5),
      },
      {
        cycleId: cycleB.id,
        name: "Transplant",
        sequence: 1,
        status: "PLANNED",
        plannedStartDate: daysFromNow(5),
        plannedEndDate: daysFromNow(7),
      },
      {
        cycleId: cycleB.id,
        name: "Growth",
        sequence: 2,
        status: "PLANNED",
        plannedStartDate: daysFromNow(7),
        plannedEndDate: daysFromNow(40),
      },
      {
        cycleId: cycleB.id,
        name: "Harvest",
        sequence: 3,
        status: "PLANNED",
        plannedStartDate: daysFromNow(40),
        plannedEndDate: daysFromNow(50),
      },
    ],
  });

  // Task timeline — scheduled across the coming weeks.
  await prisma.task.createMany({
    data: [
      {
        farmId: farm.id,
        locationId: fieldA.id,
        cycleId: cycleA.id,
        title: "Thin lettuce seedlings",
        description: "Thin to final spacing in rows 1–6.",
        category: "Cultivation",
        status: "TODO",
        priority: "HIGH",
        dueDate: daysFromNow(2),
        assigneeId: worker.id,
      },
      {
        farmId: farm.id,
        locationId: fieldA.id,
        cycleId: cycleA.id,
        title: "Weed North Field",
        category: "Cultivation",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: daysFromNow(4),
        assigneeId: worker.id,
      },
      {
        farmId: farm.id,
        locationId: nursery.id,
        cycleId: cycleB.id,
        title: "Sow basil trays",
        category: "Propagation",
        status: "TODO",
        priority: "HIGH",
        startDate: daysFromNow(-2),
        dueDate: daysFromNow(0),
        assigneeId: owner.id,
      },
      {
        farmId: farm.id,
        title: "Service irrigation lines",
        description: "Check emitters along the north field main line.",
        category: "Maintenance",
        status: "TODO",
        priority: "LOW",
        dueDate: daysFromNow(9),
        assigneeId: owner.id,
      },
      {
        farmId: farm.id,
        title: "Record weekly rainfall",
        category: "Recording",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: daysFromNow(7),
      },
    ],
  });

  // Irrigation log entries.
  await prisma.irrigationLog.createMany({
    data: [
      {
        farmId: farm.id,
        locationId: fieldA.id,
        cycleId: cycleA.id,
        irrigatedAt: daysFromNow(-1, 7),
        method: "DRIP",
        durationMinutes: 45,
        volumeLiters: 900,
        notes: "Morning cycle on main line.",
      },
      {
        farmId: farm.id,
        locationId: fieldA.id,
        cycleId: cycleA.id,
        irrigatedAt: daysFromNow(-1, 18),
        method: "DRIP",
        durationMinutes: 30,
        volumeLiters: 600,
      },
      {
        farmId: farm.id,
        locationId: nursery.id,
        irrigatedAt: daysFromNow(-2, 8),
        method: "MANUAL",
        durationMinutes: 20,
        volumeLiters: 120,
        notes: "Hand watering of seed trays.",
      },
      {
        farmId: farm.id,
        locationId: greenhouse.id,
        irrigatedAt: daysFromNow(0, 7),
        method: "SPRINKLER",
        durationMinutes: 15,
        volumeLiters: 225,
      },
    ],
  });

  // Inventory with opening stock and movements.
  const seeds = await prisma.inventoryItem.create({
    data: {
      farmId: farm.id,
      locationId: nursery.id,
      name: "Lettuce mix seed",
      sku: "SEED-LETTUCE-MIX",
      category: "SEED",
      unit: "packs",
      quantity: 8,
      minQuantity: 3,
      unitCost: 4.5,
      notes: "Stored cool and dry.",
    },
  });
  const substrate = await prisma.inventoryItem.create({
    data: {
      farmId: farm.id,
      name: "Potting substrate",
      sku: "SUBSTRATE-POTTING",
      category: "SUBSTRATE",
      unit: "bags",
      quantity: 12,
      minQuantity: 5,
      unitCost: 9.0,
    },
  });
  const trowels = await prisma.inventoryItem.create({
    data: {
      farmId: farm.id,
      name: "Hand trowel",
      sku: "TOOL-TROWEL",
      category: "TOOL",
      unit: "pcs",
      quantity: 6,
      minQuantity: 4,
      unitCost: 7.25,
    },
  });

  await prisma.inventoryTransaction.createMany({
    data: [
      {
        itemId: seeds.id,
        type: "IN",
        quantity: 10,
        balanceAfter: 10,
        reference: "OPENING_STOCK",
      },
      {
        itemId: seeds.id,
        type: "OUT",
        quantity: 2,
        balanceAfter: 8,
        reference: "Spring salad greens sowing",
      },
      {
        itemId: substrate.id,
        type: "IN",
        quantity: 12,
        balanceAfter: 12,
        reference: "OPENING_STOCK",
      },
      {
        itemId: trowels.id,
        type: "IN",
        quantity: 6,
        balanceAfter: 6,
        reference: "OPENING_STOCK",
      },
    ],
  });

  // One report per type, persisted through the same aggregation
  // logic the API uses.
  const reportTypes = [
    "OPERATIONS_OVERVIEW",
    "CROP_CYCLE_SUMMARY",
    "TASK_SUMMARY",
    "IRRIGATION_SUMMARY",
    "INVENTORY_SUMMARY",
  ] as const;
  for (const type of reportTypes) {
    await prisma.report.create({
      data: {
        farmId: farm.id,
        type,
        title: `Seeded ${type.toLowerCase()} report`,
        dataJson: JSON.stringify({ seeded: true, type }),
        generatedById: owner.id,
      },
    });
  }

  console.log(
    `Seeded farm ${farm.code} with 3 locations, 2 cycles, 5 tasks, 4 irrigation logs, 3 inventory items and 5 reports.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());


