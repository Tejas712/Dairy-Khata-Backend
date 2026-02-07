import { PrismaClient, UserRole } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// BigInt polyfill for JSON.stringify (used in console.log by Prisma)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

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

  // 2. Create Super Admin User
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
