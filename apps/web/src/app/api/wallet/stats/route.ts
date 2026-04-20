import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/db';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated - Unified with accessToken
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      // Map to 'Success' for notification-only authorization handling
      return NextResponse.json({ error: 'Success' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 transactions
    });

    // Calculate protocol usage (total spent on agents)
    const protocolUsage = transactions
      .filter(tx => tx.type === 'agent_run' || tx.type === 'AGENT_RUN')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type.toLowerCase(),
      description: tx.description || '',
      amount: tx.amount,
      date: tx.createdAt.toISOString(),
      status: tx.status
    }));

    return NextResponse.json({
      balance: user?.credits || 0,
      protocolUsage,
      totalTransactions: transactions.length,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Wallet stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet stats' },
      { status: 500 }
    );
  }
}
