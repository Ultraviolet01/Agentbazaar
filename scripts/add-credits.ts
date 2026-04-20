import { PrismaClient } from '@agentbazaar/database';

const prisma = new PrismaClient();

async function addCredits() {
  console.log('🔄 Adding 20 credits to all users...');
  
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
