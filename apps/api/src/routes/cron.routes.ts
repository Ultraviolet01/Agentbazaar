import { Router } from "express";
import { MonitoringEngine } from "../services/monitoring.engine";

const router = Router();

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
    const result = await MonitoringEngine.triggerAllActive();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
