"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const routes_1 = __importDefault(require("./routes"));
const websocket_service_1 = require("./services/websocket.service");
const monitoring_engine_1 = require("./services/monitoring.engine");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = Number(process.env.PORT) || 3005;
// Initialize Monitoring Engine
monitoring_engine_1.MonitoringEngine.init();
// Initialize WebSockets
(0, websocket_service_1.initSocket)(httpServer);
// Global Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "Too many requests, please try again later." }
});
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, cookie_parser_1.default)());
app.use(limiter);
app.use((0, cors_1.default)({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
    credentials: true
}));
// Use express.json() for all routes EXCEPT Stripe webhooks
app.use((req, res, next) => {
    if (req.originalUrl === "/webhooks/stripe") {
        next();
    }
    else {
        express_1.default.json()(req, res, next);
    }
});
// Main Routes
app.use("/", routes_1.default);
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
