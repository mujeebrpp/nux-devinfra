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
 * Local development seed for NuxWell.
 *
 * Idempotent: run it any number of times - entities are upserted by their
 * unique slugs/emails. The two sample bookings are refreshed on every run
 * so they always land relative to "now".
 */
async function main(): Promise<void> {
  console.log("Seeding NuxWell development database...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@nuxwell.local" },
    update: {},
    create: {
      email: "admin@nuxwell.local",
      fullName: "NuxWell Administrator",
      role: "ADMIN",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "demo@nuxwell.local" },
    update: {},
    create: {
      email: "demo@nuxwell.local",
      fullName: "Demo Member",
      role: "MEMBER",
    },
  });

  const gym = await prisma.facility.upsert({
    where: { slug: "wellness-center-gym" },
    update: {},
    create: {
      slug: "wellness-center-gym",
      name: "Wellness Center Gym",
      type: "GYM",
      location: "Ground Floor, Tower A",
      capacity: 40,
    },
  });

  const yogaStudio = await prisma.facility.upsert({
    where: { slug: "sunrise-yoga-studio" },
    update: {},
    create: {
      slug: "sunrise-yoga-studio",
      name: "Sunrise Yoga Studio",
      type: "YOGA_STUDIO",
      location: "Level 2, West Wing",
      capacity: 25,
    },
  });

  const pool = await prisma.facility.upsert({
    where: { slug: "hydrotherapy-pool" },
    update: {},
    create: {
      slug: "hydrotherapy-pool",
      name: "Hydrotherapy Pool",
      type: "POOL",
      location: "Level 1, Spa Zone",
      capacity: 16,
    },
  });

  const services = [
    {
      slug: "open-gym-access",
      facilityId: gym.id,
      name: "Open Gym Access",
      description: "Self-guided access to the main gym floor and cardio equipment.",
      durationMinutes: 60,
      priceCents: 800,
    },
    {
      slug: "personal-training-session",
      facilityId: gym.id,
      name: "Personal Training Session",
      description: "60-minute 1:1 session with a certified trainer.",
      durationMinutes: 60,
      priceCents: 4500,
    },
    {
      slug: "morning-yoga-flow",
      facilityId: yogaStudio.id,
      name: "Morning Yoga Flow",
      description: "Energetic vinyasa class suitable for all levels.",
      durationMinutes: 60,
      priceCents: 1200,
    },
    {
      slug: "evening-yin-yoga",
      facilityId: yogaStudio.id,
      name: "Evening Yin Yoga",
      description: "Slow, restorative practice with long-held poses.",
      durationMinutes: 75,
      priceCents: 1200,
    },
    {
      slug: "lap-swimming",
      facilityId: pool.id,
      name: "Lane Swimming",
      description: "Quiet lane swimming session in the hydrotherapy pool.",
      durationMinutes: 45,
      priceCents: 600,
    },
    {
      slug: "aqua-aerobics",
      facilityId: pool.id,
      name: "Aqua Aerobics",
      description: "Low-impact group workout in the water.",
      durationMinutes: 45,
      priceCents: 1400,
    },
  ];

  const seededServices = services.map((service) =>
    prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    }),
  );

  const [openGym, , morningYoga] = await Promise.all(seededServices);
  const plans = [
    {
      slug: "essential-monthly",
      name: "Essential",
      description: "Core access for everyday wellness.",
      priceCents: 2900,
      billingCycle: "MONTHLY",
      benefits: ["Open gym access", "1 group class per week", "Pool access"],
    },
    {
      slug: "premium-monthly",
      name: "Premium",
      description: "Full access including classes and personal training discounts.",
      priceCents: 4900,
      billingCycle: "MONTHLY",
      benefits: [
        "Everything in Essential",
        "Unlimited group classes",
        "10% off personal training",
      ],
    },
    {
      slug: "annual-saver",
      name: "Annual Saver",
      description: "Pay annually and save two months.",
      priceCents: 29000,
      billingCycle: "ANNUAL",
      benefits: [
        "Everything in Premium",
        "Two months free",
        "One fitness assessment",
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }

  // Sample bookings: refreshed on every seed run so they stay relative to "now".
  await prisma.booking.deleteMany({ where: { notes: "seed-sample" } });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 1);
  dayAfter.setHours(9, 0, 0, 0);

  const twoDaysAfter = new Date();
  twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
  twoDaysAfter.setHours(18, 0, 0, 0);

  await prisma.booking.create({
    data: {
      userId: member.id,
      facilityId: gym.id,
      serviceId: openGym.id,
      startsAt: dayAfter,
      endsAt: new Date(dayAfter.getTime() + openGym.durationMinutes * 60_000),
      status: "CONFIRMED",
      notes: "seed-sample",
    },
  });

  await prisma.booking.create({
    data: {
      userId: member.id,
      facilityId: yogaStudio.id,
      serviceId: morningYoga.id,
      startsAt: twoDaysAfter,
      endsAt: new Date(
        twoDaysAfter.getTime() + morningYoga.durationMinutes * 60_000,
      ),
      status: "PENDING",
      notes: "seed-sample",
    },
  });

  console.log(
    `Seeded ${await prisma.user.count()} users, ${await prisma.facility.count()} facilities, ` +
      `${await prisma.service.count()} services, ${await prisma.membershipPlan.count()} membership plans, ` +
      `${await prisma.booking.count()} bookings.`,
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
