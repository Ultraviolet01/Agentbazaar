"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monitoring_engine_1 = require("../services/monitoring.engine");
const router = (0, express_1.Router)();
/**
 * Endpoint to trigger all active monitors.
 * Protected by CRON_SECRET to ensure only Vercel can call it.
 */
router.get("/monitor", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const result = await monitoring_engine_1.MonitoringEngine.triggerAllActive();
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
