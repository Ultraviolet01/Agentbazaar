import { Request, Response } from "express";
import { CreditsService, PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();
const creditsService = new CreditsService(prisma);

export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const stats = await creditsService.getStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const history = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
