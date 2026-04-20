import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import routes from "./routes";
import { initSocket } from "./services/websocket.service";
import { MonitoringEngine } from "./services/monitoring.engine";

import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT) || 3005;

// Initialize Monitoring Engine
MonitoringEngine.init();

// Initialize WebSockets
initSocket(httpServer);

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later." }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cookieParser());
app.use(limiter);
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
  credentials: true
}));

// Use express.json() for all routes EXCEPT Stripe webhooks
app.use((req, res, next) => {
  if (req.originalUrl === "/webhooks/stripe") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Main Routes
app.use("/", routes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date(), service: "AgentBazaar API" });
});

// ... listen ...

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`✅ AgentBazaar API with LaunchWatch is LIVE`);
  console.log(`📡 URL: http://localhost:${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`🕰️ Started at: ${new Date().toISOString()}`);
});
