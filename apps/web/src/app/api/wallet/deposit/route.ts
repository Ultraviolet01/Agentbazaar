import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { jwtVerify } from 'jose';
import { ethers } from 'ethers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Success' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { ogAmount, crdAmount, txHash, walletAddress, signature } = await req.json();

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }

    // Check if already processed
    const existingTx = await prisma.transaction.findUnique({
      where: { txHash }
    });

    if (existingTx) {
      return NextResponse.json({ 
        success: true, 
        error: 'Transaction already processed',
        txHash 
      });
    }

    // Verify the transaction exists on BSC
    const rpcUrls = [
      process.env.NEXT_PUBLIC_QUICKNODE_RPC,
      process.env.NEXT_PUBLIC_ALCHEMY_RPC,
      'https://bsc-dataseed.binance.org'
    ].filter(Boolean) as string[];

    let receipt = null;
    let lastError = null;

    for (const url of rpcUrls) {
      try {
        const provider = new ethers.JsonRpcProvider(url);
        receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) break;
      } catch (e: any) {
        lastError = e.message;
      }
    }

    if (!receipt) {
      return NextResponse.json(
        { error: `Transaction not found on blockchain. LAST_ERR: ${lastError}` },
        { status: 400 }
      );
    }

    if (receipt.status !== 1) {
      return NextResponse.json(
        { error: 'Transaction failed on blockchain' },
        { status: 400 }
      );
    }

    // Atomic update
    const result = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          userId,
          amount: crdAmount,
          type: 'deposit',
          status: 'completed',
          description: `Deposited ${ogAmount} OG tokens (${crdAmount} CRD)`,
          txHash: txHash
        }
      });

      const u = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: crdAmount } }
      });

      return { t, u };
    });

    return NextResponse.json({
      success: true,
      credits: result.u.credits,
      txHash
    });
  } catch (error: any) {
    console.error('Deposit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process deposit' },
      { status: 500 }
    );
  }
}
