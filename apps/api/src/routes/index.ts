import express, { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as creditsController from "../controllers/credits.controller";
import * as projectsController from "../controllers/projects.controller";
import * as agentsController from "../controllers/agents.controller";
import * as walletController from "../controllers/wallet.controller";
import * as alertsController from "../controllers/alerts.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router: Router = Router();

// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/verify", authController.verify);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.post("/auth/logout", authMiddleware, authController.logout);
router.post("/auth/onboarding/complete", authMiddleware, authController.completeOnboarding);
router.get("/auth/me", authMiddleware, authController.me);

// Credits Routes
router.get("/credits/balance", authMiddleware, creditsController.getBalance);
router.get("/credits/history", authMiddleware, creditsController.getHistory);

// Projects Routes
router.get("/projects", authMiddleware, projectsController.getProjects);
router.post("/projects", authMiddleware, projectsController.createProject);
router.put("/projects/:id", authMiddleware, projectsController.updateProject);
router.delete("/projects/:id", authMiddleware, projectsController.deleteProject);
router.get("/projects/:id/memory", authMiddleware, projectsController.getProjectMemory);

// Agents Routes
router.post("/agents/scamsniff/run", authMiddleware, agentsController.runScamSniff);
router.post("/agents/threadsmith/run", authMiddleware, agentsController.runThreadSmith);
router.post("/agents/launchwatch/setup", authMiddleware, agentsController.setupLaunchWatch);

// Wallet Routes
router.post("/wallet/connect", authMiddleware, walletController.connectWallet);
router.get("/wallet/status", authMiddleware, walletController.getStatus);
router.get("/wallet/transactions", authMiddleware, walletController.getTransactions);
router.post("/wallet/verify-signature", walletController.verifySignature);
router.post("/wallet/deposit", authMiddleware, walletController.deposit);

// Alerts Routes
router.get("/alerts/list", authMiddleware, alertsController.listAlerts);
router.patch("/alerts/:id/mark-read", authMiddleware, alertsController.markRead);
router.post("/alerts/preferences", authMiddleware, alertsController.updatePreferences);

export default router;
