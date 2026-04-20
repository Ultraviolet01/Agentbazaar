import { PrismaClient } from "@prisma/client";

export class CreditsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Atomic deduction of credits for agent runs or other usage
   */
  async deductCredits(userId: string, amount: number, description: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Get the user to check balance
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new Error("User not found");
      }

      if (user.credits < amount) {
        throw new Error(`Insufficient credits. Required: ${amount} CRD, Available: ${user.credits} CRD`);
      }

      // Deduct Credits from User record
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: amount }
        }
      });

      // Create Transaction Record
      return await tx.transaction.create({
        data: {
          userId,
          amount,
          type: "AGENT_RUN",
          status: "COMPLETED",
          description
        }
      });
    });
  }

  /**
   * Adding credits for purchases (Stripe success)
   */
  async addCredits(userId: string, amount: number, description: string, txHash?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Update User Credit Balance
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: amount }
        }
      });

      // Create Transaction Record
      return await tx.transaction.create({
        data: {
          userId,
          amount,
          type: "CREDIT_PURCHASE",
          status: "COMPLETED",
          description
        }
      });
    });
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? { balance: user.credits } : null;
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const transactionsCount = await this.prisma.transaction.count({ where: { userId } });
    
    return {
      balance: user?.credits || 0,
      totalSpent: 0, // aggregate from transactions if needed
      totalEarned: 0,
      transactionsCount
    };
  }
}
