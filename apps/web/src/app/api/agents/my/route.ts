import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'at_super-secret-key');

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Fetch deployed agents for this user
    const agents = await prisma.deployedAgent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        category: true,
        icon: true,
        color: true,
        createdAt: true,
      }
    });

    return NextResponse.json(agents);
  } catch (error: any) {
    console.error('Fetch my agents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents', details: error.message },
      { status: 500 }
    );
  }
}
