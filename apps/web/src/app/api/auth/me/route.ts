// /src/app/api/auth/me/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@agentbazaar/database';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        username: true,
        credits: true,
        agentRuns: {
          select: {
            creditsUsed: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const totalSpent = user.agentRuns.reduce((sum: number, run: any) => sum + run.creditsUsed, 0);

    return NextResponse.json({ 
      user: {
        ...user,
        agentRuns: undefined,
        totalSpent
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
