"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsService = void 0;
const database_1 = require("@agentbazaar/database");
const prisma = new database_1.PrismaClient();
class CreditsService {
    /**
     * Atomic deduction of credits for agent runs or other usage
     */
    static async deductCredits(userId, amount, description) {
        return await prisma.$transaction(async (tx) => {
            const credits = await tx.credit.findUnique({ where: { userId } });
            if (!credits || credits.balance.toNumber() < amount) {
                throw new Error(`Insufficient credits. Required: ${amount} CRD, Available: ${credits?.balance || 0} CRD`);
            }
            // Deduct Credits
            await tx.credit.update({
                where: { userId },
                data: {
                    balance: { decrement: amount },
                    totalSpent: { increment: amount }
                }
            });
            // Create Transaction Record
            return await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    type: "AGENT_RUN",
                    description
                }
            });
        });
    }
    /**
     * Adding credits for purchases (Stripe success)
     */
    static async addCredits(userId, amount, description, txHash) {
        return await prisma.$transaction(async (tx) => {
            // Create Transaction Record
            const t = await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    type: "CREDIT_PURCHASE",
                    onChainHash: txHash,
                    description
                }
            });
            // Update Credit Balance
            await tx.credit.update({
                where: { userId },
                data: {
                    balance: { increment: amount },
                    totalEarned: { increment: amount }
                }
            });
            return t;
        });
    }
    static async getBalance(userId) {
        return await prisma.credit.findUnique({ where: { userId } });
    }
    static async getStats(userId) {
        const credits = await prisma.credit.findUnique({ where: { userId } });
        const transactionsCount = await prisma.transaction.count({ where: { userId } });
        return {
            balance: credits?.balance || 0,
            totalSpent: credits?.totalSpent || 0,
            totalEarned: credits?.totalEarned || 0,
            transactionsCount
        };
    }
}
exports.CreditsService = CreditsService;
