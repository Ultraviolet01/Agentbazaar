import { NextResponse } from 'next/server';

/**
 * GET /api/tee/public-key
 * 
 * Returns the TEE worker's RSA public key.
 * Clients use this to encrypt credentials before submission.
 */

const TEE_WORKER_URL = process.env.TEE_WORKER_URL || 'http://localhost:4100';

// Cache the public key for 5 minutes
let cachedKey: { key: string; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    // Check cache
    if (cachedKey && Date.now() - cachedKey.fetchedAt < CACHE_TTL) {
      return NextResponse.json({ publicKey: cachedKey.key });
    }

    // Fetch from TEE worker
    const response = await fetch(`${TEE_WORKER_URL}/public-key`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`TEE worker returned ${response.status}`);
    }

    const data = await response.json();
    
    // Cache it
    cachedKey = { key: data.publicKey, fetchedAt: Date.now() };

    return NextResponse.json({
      publicKey: data.publicKey,
      algorithm: data.algorithm,
      keySize: data.keySize,
    });
  } catch (error: any) {
    console.error('[TEE Public Key] Error:', error.message);
    return NextResponse.json(
      { error: 'TEE worker unavailable', details: error.message },
      { status: 503 }
    );
  }
}
