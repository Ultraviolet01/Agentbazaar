require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function addCredits() {
  const url = process.env.DATABASE_URL;
  console.log('🔄 Connecting to Database...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    const result = await prisma.user.updateMany({
      data: {
        credits: {
          increment: 20
        }
      }
    });
    
    console.log(`✅ Successfully added 20 credits to ${result.count} users.`);
  } catch (error) {
    console.error('❌ Failed to add credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCredits();
