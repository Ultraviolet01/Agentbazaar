import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Success' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const mappedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      subtype: tx.type === 'deposit' ? 'ON-CHAIN' : (tx.type === 'DEPOSIT' ? 'ON-CHAIN' : ''),
      description: tx.description,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt.toISOString().split('T')[0]
    }));

    return NextResponse.json({ transactions: mappedTransactions });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
