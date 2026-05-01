import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('auth-token')?.value || req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string || payload.id as string;

    const runs = await prisma.agentRun.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        deployedAgent: {
          select: {
            teeAttestation: true,
            daLogHash: true
          }
        }
      }
    });

    return NextResponse.json(runs);
  } catch (error: any) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}
