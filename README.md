# AgentBazaar

A hybrid AI agent platform with specialized products powered by the OG Network.

## Components
- **Web App (`apps/web`)**: Next.js 14 Dashboard and Marketplace.
- **API (`apps/api`)**: Express backend with Prisma ORM and 0G Storage integration.
- **Extension (`apps/extension`)**: Chrome Extension scaffold for ScamSniff.
- **Database (`packages/database`)**: Shared Prisma schema and PostgreSQL configuration.
- **Types (`packages/types`)**: Shared TypeScript domain models.

## Tech Stack
- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js, TailwindCSS, Shadcn/ui, Zustand, Tanstack Query
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Blockchain**: @0glabs/0g-ts-sdk (0G Storage)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the database:
   ```bash
   docker-compose up -d
   ```
5. Run database migrations:
   ```bash
   pnpm db:push
   ```
6. Start development servers:
   ```bash
   pnpm dev
   ```

## Recent Updates
- **Seamless Onboarding**: Removed email verification requirements for immediate user access.
- **Priority RPC**: Configured QuickNode as the primary BSC RPC provider for high-performance wallet interactions.
- **Unified Auth**: Synchronized session management across Express and Next.js layers using `accessToken`.

## 0G Network & Wallet Infrastructure
- **Blockchain interactions**: Uses QuickNode as the primary RPC for BSC Mainnet (`apps/web/src/app/wallet/page.tsx`).
- **Decentralized Storage**: Integrated with 0G Storage via `@0glabs/0g-ts-sdk` (`apps/api/src/services/storage.ts`).
- **Token Deposits**: Supports OG token deposits on BSC with real-time credit (CRD) conversion.

Ensure you provide valid RPC and Indexer endpoints in your `.env` to enable these features.
