require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  const user = await prisma.user.findUnique({
    where: { email: 'agent@realestate-crm.com' },
    select: { email: true, password: true }
  });
  console.log('User:', user.email);
  console.log('Has password:', user ? 'yes' : 'no');
  console.log('Password exists:', user.password ? 'yes' : 'no');
  console.log('Password length:', user.password?.length || 0);
  process.exit(0);
})();
