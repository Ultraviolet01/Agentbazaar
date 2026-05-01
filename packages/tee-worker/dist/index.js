"use strict";
/**
 * TEE Worker — Express Server
 *
 * A secure microservice that runs inside a TEE (Phala Cloud).
 * Handles credential decryption and agent execution.
 *
 * Endpoints:
 * - GET  /health         → Health check
 * - GET  /public-key     → RSA public key for client encryption
 * - POST /run-agent      → Execute agent with encrypted credentials
 * - GET  /attestation    → Generate TEE attestation proof
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = require("./crypto");
const agent_runner_1 = require("./agent-runner");
const attestation_1 = require("./attestation");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '4100', 10);
const API_KEY = process.env.TEE_WORKER_API_KEY || 'dev-key';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Internal auth middleware — only AgentBazaar backend can call this
function authMiddleware(req, res, next) {
    const key = req.headers['x-tee-api-key'];
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
// --- Routes ---
// Health check (public)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'agentbazaar-tee-worker',
        timestamp: new Date().toISOString(),
    });
});
// Get RSA public key (public — needed by clients for encryption)
app.get('/public-key', (req, res) => {
    try {
        const publicKey = (0, crypto_1.getPublicKey)();
        res.json({
            publicKey,
            algorithm: 'RSA-OAEP',
            keySize: 2048,
            format: 'PEM-SPKI',
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Execute an agent run (authenticated — only backend)
app.post('/run-agent', authMiddleware, async (req, res) => {
    try {
        const request = req.body;
        // Validate required fields
        if (!request.agentId || !request.input?.prompt) {
            return res.status(400).json({ error: 'Missing required fields: agentId, input.prompt' });
        }
        if (!request.encryptedCredentials) {
            return res.status(400).json({ error: 'Missing encryptedCredentials' });
        }
        console.log(`[TEE Worker] Running agent ${request.agentSlug} (${request.modelProvider})`);
        const result = await (0, agent_runner_1.executeAgentRun)(request);
        console.log(`[TEE Worker] Agent ${request.agentSlug} completed in ${result.metadata.executionTime}ms`);
        res.json(result);
    }
    catch (error) {
        console.error('[TEE Worker] Agent run error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// Generate attestation proof (authenticated)
app.get('/attestation', authMiddleware, async (req, res) => {
    try {
        const proof = await (0, attestation_1.generateAttestation)('system', 'health-check', 'attestation-request');
        res.json({
            attestation: proof,
            valid: (0, attestation_1.verifyAttestationBasic)(proof),
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Startup ---
async function start() {
    console.log('[TEE Worker] Initializing cryptographic keys...');
    await (0, crypto_1.initializeKeys)();
    app.listen(PORT, () => {
        console.log(`[TEE Worker] 🔐 Running on port ${PORT}`);
        console.log(`[TEE Worker] Public key available at GET /public-key`);
        console.log(`[TEE Worker] Agent execution at POST /run-agent`);
    });
}
start().catch((error) => {
    console.error('[TEE Worker] Failed to start:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map