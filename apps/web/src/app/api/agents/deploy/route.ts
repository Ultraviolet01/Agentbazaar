import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { uploadEncryptedBlob } from '@/lib/og-storage';

/**
 * POST /api/agents/deploy
 * 
 * Deploy a new custom agent with TEE-encrypted credentials.
 * 
 * Flow:
 * 1. Validate authentication and input
 * 2. Upload encrypted credentials to 0G Storage
 * 3. Create DeployedAgent record (stores hash, NOT plaintext keys)
 */

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const body = await req.json();
    const {
      name,
      description,
      longDescription,
      category,
      tags,
      apiEndpoint,
      webhookUrl,
      modelProvider,
      modelName,
      pricePerRun,
      setupFee,
      icon,
      color,
      readme,
      inputSchema,
      outputSchema,
      examples,
      // NEW: Encrypted credentials
      encryptedCredentials,
      credentialSchema,
    } = body;

    // Validate required fields
    if (!name || !description || !category || !pricePerRun) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existing = await prisma.deployedAgent.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An agent with this name already exists' },
        { status: 400 }
      );
    }

    // Upload encrypted credentials to 0G Storage
    let teeCredentialId: string | null = null;
    let storageNodeId: string | null = null;
    let hasCredentials = false;

    if (encryptedCredentials) {
      try {
        const result = await uploadEncryptedBlob(JSON.stringify(encryptedCredentials));
        teeCredentialId = result.rootHash;
        storageNodeId = result.storageNodeId;
        hasCredentials = true;
        console.log(`[Deploy] Encrypted credentials stored at: ${teeCredentialId}`);
      } catch (storageError: any) {
        console.error('[Deploy] Failed to upload credentials to 0G:', storageError);
        // Continue with inline storage as fallback
        teeCredentialId = `inline-${Date.now()}`;
        storageNodeId = 'inline';
        hasCredentials = true;
      }
    }

    // Create deployed agent
    const agent = await prisma.deployedAgent.create({
      data: {
        userId,
        name,
        slug,
        description,
        longDescription: longDescription || description,
        category,
        tags: tags || [],
        apiEndpoint: apiEndpoint || null,
        webhookUrl: webhookUrl || null,
        modelProvider: modelProvider || 'custom',
        modelName: modelName || null,
        pricePerRun,
        setupFee: setupFee || 0,
        icon: icon || '🤖',
        color: color || '#f97316',
        readme: readme || '',
        inputSchema: inputSchema || {},
        outputSchema: outputSchema || {},
        examples: examples || [],
        capabilities: ['text'],
        status: 'pending',
        screenshots: [],
        coverImage: null,
        
        // TEE Credentials
        requiresCredentials: hasCredentials,
        credentialSchema: credentialSchema || null,
        teeCredentialId,
        storageNodeId,
        credentialStatus: hasCredentials ? 'active' : 'pending',
        credentialMetadata: encryptedCredentials || null, // Store the encrypted bundle for TEE worker
      }
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        status: agent.status,
        hasCredentials,
        teeCredentialId,
      }
    });
  } catch (error: any) {
    console.error('Agent deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy agent' },
      { status: 500 }
    );
  }
}
