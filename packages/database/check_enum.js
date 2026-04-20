require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEnum() {
  try {
    const result = await prisma.$queryRaw`SELECT enum_range(NULL::"AgentType")`;
    console.log('AgentType Enum values in DB:', result);
  } catch (e) {
    console.error('Error checking enum:', e);
  }
}

checkEnum().catch(console.error).finally(() => prisma.$disconnect());
