import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { StorageService } from '@agentbazaar/database';

export async function POST(req: NextRequest) {
  try {
    const { verdict, context } = await req.json();

    if (!verdict) {
      return NextResponse.json({ error: 'Verdict is required' }, { status: 400 });
    }

    // Initialize 0G Storage
    const storage = new StorageService();
    
    // Upload to decentralized storage
    const storageResult = await storage.uploadArtifact({
      verdict,
      analysisType: 'sovereign_override',
      ...context
    }, {
      agent: 'scamsniff',
      url: context?.url || 'unknown',
      domain: context?.domain || 'unknown'
    });

    // Resolve user (fallback to first user for demo)
    const user = await prisma.user.findFirst();

    // Log the archival event
    const report = await prisma.agentRun.create({
      data: {
        userId: user?.id || 'system',
        agentType: 'SCAMSNIFF',
        creditsUsed: 0, // Archival is currently a value-added service
        status: 'completed',
        inputData: JSON.stringify(context),
        outputData: JSON.stringify({
          storageCid: storageResult?.cid,
          storageTxHash: storageResult?.txHash
        })
      }
    });

    return NextResponse.json({
      success: true,
      storageCid: storageResult?.cid,
      storageTxHash: storageResult?.txHash,
      reportId: report.id
    });

  } catch (error: any) {
    console.error('0G Archival Proxy Error:', error);
    return NextResponse.json({ error: 'Archival Failed', details: error.message }, { status: 500 });
  }
}
