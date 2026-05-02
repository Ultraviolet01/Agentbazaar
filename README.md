# AgentBazaar: The Autonomous Agent Marketplace

AgentBazaar is the premier marketplace for **TEE-verified autonomous agents** powered by the **0G Network**. It provides a decentralized ecosystem where developers can deploy, monetize, and scale AI agents, while users can discover and run powerful agents with verifiable memory and hardware-secured privacy.

## Components
- **Web App (`apps/web`)**: The Marketplace storefront, deployment pipeline, and user dashboard.
- **API (`apps/api`)**: Core marketplace engine with 0G Storage integration and agent orchestration.
- **Extension (`apps/extension`)**: Browser integration for real-time agent interactions (e.g., ScamSniff).
- **Database (`packages/database`)**: Shared registry for agent metadata and marketplace transactions.
- **Types (`packages/types`)**: Unified domain models for the marketplace ecosystem.

## Tech Stack
- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js 14, TailwindCSS, Shadcn/ui
- **Security & Privacy (TEE)**: 
  - **Hardware-Level Security**: API keys and sensitive logic are executed within a Phala TEE for absolute privacy.
  - **On-Chain Encryption**: Local RSA-OAEP encryption ensures your credentials never leave your browser in plaintext.
  - **Architectural Choice (Phala TEE vs 0G TEE)**: While AgentBazaar leverages 0G for decentralized memory and data availability, we explicitly chose **Phala Network** for our Trusted Execution Environment. 0G's TEE is optimized for "Sealed Inference" using built-in LLMs, which restricts model flexibility. Phala operates as a general-purpose confidential cloud (`dstack`), allowing developers to deploy arbitrary logic, utilize *any* LLM (OpenAI, Anthropic, etc.), and securely inject *any* third-party API key (ElevenLabs, RapidAPI, Resend) required for complex autonomous actions.
- **Blockchain Infrastructure**:
  - **0G Chain**: High-performance settlement layer for marketplace payments and governance.
  - **0G Storage**: Decentralized memory and artifact storage for all marketplace agents.
  - **0G DA**: Real-time data availability for agent verification proofs.

## Marketplace Features
- **Discovery**: Browse a curated registry of agents across categories like Security, Analytics, and Automation.
- **Monetization**: Set custom "Price Per Run" for your agents and earn OG tokens directly.
- **TEE-Verified Trust**: Every agent runs in a secure environment, protecting both the developer's secrets and the user's data.
- **Decentralized Intelligence**: Agents utilize 0G Storage for permanent, verifiable memory that persists across runs.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup
1. Clone the marketplace repository.
2. Install dependencies: `pnpm install`
3. Setup environment variables: `cp .env.example .env`
4. Start the infrastructure: `docker-compose up -d`
5. Initialize the registry: `pnpm db:push`
6. Launch the marketplace: `pnpm dev`

## Recent Marketplace Updates
- **Deployment Pipeline**: Streamlined the flow for community developers to list new agents.
- **Credential Security**: Integrated full RSA encryption for secure marketplace API key management.
- **UI Refresh**: Modernized the marketplace storefront and "My Console" management interface.
- **Category Expansion**: Added support for diverse agent categories including "Others" for custom use cases.

## Infrastructure & Payments
- **0G Mainnet**: The marketplace operates natively on the 0G Chain.
- **Credit System**: 1:10 conversion from OG tokens to Marketplace Credits (CRD).
- **Security**: Signature-based authentication for all marketplace transactions and agent deployments.

Ensure you provide valid 0G RPC and Indexer endpoints in your `.env` to enable these features.
