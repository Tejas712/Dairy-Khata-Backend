import { PrismaClient, Status, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Company
  const company = await prisma.company.upsert({
    where: { companyCode: 'DK001' },
    update: {},
    create: {
      name: 'Dairy Khata',
      companyCode: 'DK001',
      ownerName: 'Super Admin',
      mobile: '9999999999',
      address: 'System Default',
    },
  });

  console.log(`Company created/found: ${company.name} (${String(company.id)})`);

  // 2. Seed default FREE subscription plan
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'FREE' },
  });

  if (!freePlan) {
    await prisma.subscriptionPlan.create({
      data: {
        name: 'FREE',
        price: 0,
        durationDays: 30,
        maxCustomers: 10,
        maxAdmins: 1,
        description: 'Default free plan',
        status: Status.ACTIVE,
      },
    });
    console.log('FREE plan created');
  } else {
    console.log('FREE plan already exists');
  }

  // 3. Create Super Admin User
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: {
      companyId_mobile: {
        companyId: company.id,
        mobile: '9999999999',
      },
    },
    update: {},
    create: {
      companyId: company.id,
      name: 'Super Admin',
      mobile: '9999999999',
      email: 'admin@dairykhata.com',
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      customerCode: 'SUP1',
    },
  });

  console.log(`Super Admin created/found: ${superAdmin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
