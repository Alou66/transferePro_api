import dotenv from "dotenv";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME;
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PHONE = process.env.ADMIN_PHONE;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const requiredEnvVars = [
  { key: "ADMIN_FIRST_NAME", value: ADMIN_FIRST_NAME },
  { key: "ADMIN_LAST_NAME", value: ADMIN_LAST_NAME },
  { key: "ADMIN_EMAIL", value: ADMIN_EMAIL },
  { key: "ADMIN_PHONE", value: ADMIN_PHONE },
  { key: "ADMIN_PASSWORD", value: ADMIN_PASSWORD },
];

for (const envVar of requiredEnvVars) {
  if (!envVar.value || envVar.value.trim() === "") {
    console.error(`Missing required environment variable: ${envVar.key}`);
    process.exit(1);
  }
}

const cities = [
  { name: "Dakar" },
  { name: "Ziguinchor" },
  { name: "Diountou" },
];

async function seedCities() {
  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: {
        name: city.name,
        isActive: true,
      },
    });
    console.log(`City ensured: ${city.name}`);
  }
}

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD!, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL! },
    update: {},
    create: {
      firstName: ADMIN_FIRST_NAME!,
      lastName: ADMIN_LAST_NAME!,
      email: ADMIN_EMAIL!,
      phone: ADMIN_PHONE!,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Admin ensured: ${admin.email}`);
}

async function main() {
  console.log("Starting seed...");

  await seedCities();
  await seedAdmin();

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
