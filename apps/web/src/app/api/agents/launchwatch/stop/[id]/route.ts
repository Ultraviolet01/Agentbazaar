import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update the monitoring job status to stopped
    await prisma.monitoringJob.update({
      where: { id },
      data: { status: 'stopped' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('LaunchWatch stop error:', error);
    return NextResponse.json(
      { error: 'Failed to stop monitoring' },
      { status: 500 }
    );
  }
}
