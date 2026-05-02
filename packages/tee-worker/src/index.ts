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

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeKeys, getPublicKey } from './crypto';
import { executeAgentRun, AgentRunRequest } from './agent-runner';
import { generateAttestation, verifyAttestationBasic } from './attestation';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4100', 10);
const API_KEY = process.env.TEE_WORKER_API_KEY || 'dev-key';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Internal auth middleware — only AgentBazaar backend can call this
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
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
    const publicKey = getPublicKey();
    res.json({
      publicKey,
      algorithm: 'RSA-OAEP',
      keySize: 2048,
      format: 'PEM-SPKI',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Execute an agent run (authenticated — only backend)
app.post('/run-agent', authMiddleware, async (req, res) => {
  try {
    const request: AgentRunRequest = req.body;
    
    // Validate required fields
    if (!request.agentId || !request.input?.prompt) {
      return res.status(400).json({ error: 'Missing required fields: agentId, input.prompt' });
    }
    
    if (!request.encryptedCredentials) {
      return res.status(400).json({ error: 'Missing encryptedCredentials' });
    }
    
    console.log(`[TEE Worker] Running agent ${request.agentSlug} (${request.modelProvider})`);
    
    const result = await executeAgentRun(request);
    
    console.log(`[TEE Worker] Agent ${request.agentSlug} completed in ${result.metadata.executionTime}ms`);
    
    res.json(result);
  } catch (error: any) {
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
    const proof = await generateAttestation('system', 'health-check', 'attestation-request');
    res.json({
      attestation: proof,
      valid: verifyAttestationBasic(proof),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Startup ---

async function start() {
  console.log('[TEE Worker] Initializing cryptographic keys...');
  await initializeKeys();
  
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
