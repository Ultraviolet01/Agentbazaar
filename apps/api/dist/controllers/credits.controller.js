"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = exports.getBalance = void 0;
const database_1 = require("@agentbazaar/database");
const prisma = new database_1.PrismaClient();
const creditsService = new database_1.CreditsService(prisma);
const getBalance = async (req, res) => {
    try {
        const userId = req.userId;
        const stats = await creditsService.getStats(userId);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch balance" });
    }
};
exports.getBalance = getBalance;
const getHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const history = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
};
exports.getHistory = getHistory;
