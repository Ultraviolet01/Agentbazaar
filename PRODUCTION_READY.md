# AgentBazaar Production Readiness Guide

This document provides a comprehensive guide for deploying AgentBazaar to a production environment on the 0G Network Mainnet.

## 1. Deployment Architecture

AgentBazaar consists of three primary components:
- **Web Application**: Next.js frontend (SSG/SSR).
- **API Backend**: Express.js server (Node.js).
- **Database**: Prisma + PostgreSQL (Supabase/RDS).
- **Infrastructure**: 0G Storage (Mainnet) and BSC (Mainnet).

## 2. Environment Variable Verification Checklist

Ensure the following variables are correctly configured in your production environment.

### [Base Configuration]
- [ ] `NODE_ENV`: Set to `production`.
- [ ] `PORT`: API server port (default `3001` or `3005`).
- [ ] `JWT_SECRET`: Secure 32+ character random string.
- [ ] `ANTHROPIC_API_KEY`: Valid Claude 3.5 Sonnet API key.
- [ ] `RESEND_API_KEY`: Production Resend key for email alerts.

### [0G Network Configuration (Mainnet)]
- [ ] `OG_RPC_URL`: `https://evmrpc-mainnet-1.0g.ai`
- [ ] `OG_INDEXER_URL`: `https://indexer-storage-mainnet-standard.0g.ai`
- [ ] `OG_PRIVATE_KEY`: Valid Mainnet private key with OG tokens for storage fees.
- [ ] `OG_NETWORK`: `mainnet`

### [BSC / QuickNode Integration]
- [ ] `NEXT_PUBLIC_QUICKNODE_RPC`: Prioritized QuickNode BSC endpoint for 0G token balance and deposit verification.
- [ ] `NEXT_PUBLIC_ALCHEMY_RPC`: Secondary/Failover BSC endpoint.
- [ ] `OG_TOKEN_CONTRACT`: `0x4b948d64de1f71fcd12fb586f4c776421a35b3ee` (BSC Mainnet).

> [!IMPORTANT]
> **Token Distinction**:
> - **BSC OG Tokens**: Used for platform credits (CRD). Users deposit these via the Web UI.
> - **Native 0G Tokens**: Needed for smart contract gas on the 0G Network. These must be acquired via a bridge (e.g., from BSC to Aristotle Mainnet) to deploy or verify contracts on-chain.

### [URLs & Auth]
- [ ] `NEXT_PUBLIC_API_URL`: Public API endpoint (e.g., `https://api.agentbazaar.ai`).
- [ ] `NEXT_PUBLIC_APP_URL`: Public Web App URL (e.g., `https://agentbazaar.ai`).

## 3. Deployment Workflow

### Step 1: Database Migration
Push the schema and generate the client:
```bash
pnpm --filter database push
pnpm --filter database generate
```

### Step 2: Build Workspace
Build the entire workspace to ensure health:
```bash
pnpm build
```

### Step 3: API Backend Deployment
Run the API using a process manager (PM2 recommended):
```bash
cd apps/api
pnpm start
```

### Step 4: Web Application Deployment
Deploy to a static hosting provider or VPS:
```bash
cd apps/web
pnpm build
pnpm start
```

## 4. Verification Plan (Pre-Launch)

### [Build & Workspace Health]
- [ ] **pnpm build**: Success across all packages.
- [ ] **UI Audit**: Verified 0 "Test" or "Beta" labels in production-facing components.

### [Functional Verification]
- [ ] **0G Storage Anchoring**: Verify that `StorageService` successfully connects to the Mainnet Indexer.
- [ ] **BSC Wallet Interaction**: Confirm transactions use the QuickNode RPC endpoint.
- [ ] **Credit Verification**: Run a ScamSniff analysis and verify credits are deducted.
- [ ] **Memory Persistence**: Verify 0G Storage CIDs are recorded in PostgreSQL `ProjectMemory` table.

---
*Generated for AgentBazaar Mainnet Operations*
