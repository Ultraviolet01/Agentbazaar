import { Request, Response } from "express";
import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

export const listAlerts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const alerts = await prisma.launchWatchAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await prisma.launchWatchAlert.update({
      where: { id },
      data: { read: true }
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: "Failed to mark alert as read" });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    // In a real app, this would update a user preferences table or column
    res.json({ message: "Alert preferences updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update preferences" });
  }
};
