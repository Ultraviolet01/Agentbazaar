import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

/**
 * POST /api/agents/run
 * 
 * Execute a deployed custom agent.
 * 1. Validates the user and deducts credits
 * 2. Fetches the agent's encrypted credentials
 * 3. Forwards to the TEE worker for secure execution
 * 4. Returns the result with TEE attestation
 */

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const TEE_WORKER_URL = process.env.TEE_WORKER_URL || 'http://localhost:4100';
const TEE_WORKER_API_KEY = process.env.TEE_WORKER_API_KEY || 'dev-key';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;

    const body = await req.json();
    const { agentSlug, input } = body;

    if (!agentSlug || !input?.prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: agentSlug, input.prompt' },
        { status: 400 }
      );
    }

    // 2. Find the deployed agent
    const agent = await prisma.deployedAgent.findUnique({
      where: { slug: agentSlug },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agent.status !== 'live' && agent.status !== 'approved') {
      return NextResponse.json(
        { error: `Agent is not available (status: ${agent.status})` },
        { status: 403 }
      );
    }

    // 3. Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user || user.credits < agent.pricePerRun) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: agent.pricePerRun,
          current: user?.credits || 0,
        },
        { status: 402 }
      );
    }

    // 4. Forward to TEE worker
    const teeResponse = await fetch(`${TEE_WORKER_URL}/run-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tee-api-key': TEE_WORKER_API_KEY,
      },
      body: JSON.stringify({
        agentId: agent.id,
        agentSlug: agent.slug,
        teeCredentialId: agent.teeCredentialId,
        encryptedCredentials: agent.credentialMetadata, // Stored encrypted bundle
        modelProvider: agent.modelProvider,
        modelName: agent.modelName,
        apiEndpoint: agent.apiEndpoint,
        input,
      }),
    });

    if (!teeResponse.ok) {
      const error = await teeResponse.json();
      throw new Error(error.error || 'TEE execution failed');
    }

    const result = await teeResponse.json();

    // 5. Deduct credits from user, credit the agent creator
    const creatorShare = agent.pricePerRun * 0.9; // 90% to creator
    const platformFee = agent.pricePerRun * 0.1; // 10% platform fee

    await prisma.$transaction([
      // Deduct from runner
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: agent.pricePerRun } },
      }),
      // Credit the creator
      prisma.user.update({
        where: { id: agent.userId },
        data: { credits: { increment: creatorShare } },
      }),
      // Update agent analytics
      prisma.deployedAgent.update({
        where: { id: agent.id },
        data: {
          totalRuns: { increment: 1 },
          totalRevenue: { increment: agent.pricePerRun },
          totalApiCost: { increment: result.metadata?.estimatedCost || 0 },
        },
      }),
      // Record the agent run
      prisma.agentRun.create({
        data: {
          userId,
          agentType: agent.slug,
          deployedAgentId: agent.id,
          creditsUsed: agent.pricePerRun,
          inputData: input,
          outputData: {
            content: result.output,
            attestation: result.attestation,
            metadata: result.metadata,
          },
          status: 'COMPLETED',
        },
      }),
    ]);

    // 6. Return result
    return NextResponse.json({
      success: true,
      output: result.output,
      metadata: {
        ...result.metadata,
        creditsUsed: agent.pricePerRun,
        creatorEarned: creatorShare,
      },
      attestation: result.attestation,
    });
  } catch (error: any) {
    console.error('[Agent Run] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Agent execution failed' },
      { status: 500 }
    );
  }
}
