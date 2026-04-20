import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@agentbazaar/database';
import { jwtVerify } from 'jose';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const LOG_FILE = 'C:\\tmp\\test_deposit.log';

const logToFile = (msg: string) => {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logMsg);
    console.log(msg);
  } catch (err) {
    console.error('Logging to file failed:', err);
  }
};

const OG_TOKEN_CONTRACT = '0x4b948d64de1f71fcd12fb586f4c776421a35b3ee';
const TREASURY_ADDRESS = '0xd6C48a201B275A21966Aef9D6C1bc087e754D848';
const OG_TO_CRD_RATE = 10;

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

const QUICKNODE_RPC = process.env.NEXT_PUBLIC_QUICKNODE_RPC || 'https://misty-nameless-tent.bsc.quiknode.pro/9b83e8e679030d373648ffc22a70d9ea02f0c119/';
const ALCHEMY_RPC = 'https://bnb-mainnet.g.alchemy.com/v2/mfb45eIigBdoZ-pjBXoH7';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Success' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    
    logToFile(`[TEST-DEPOSIT] Process starting for userId: ${userId}`);

    // Verify user exists to prevent FK violation
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      logToFile(`[TEST-DEPOSIT] User NOT FOUND in database: ${userId}`);
      return NextResponse.json({ 
        error: `User not found in database (ID: ${userId}). Please log out and log back in.` 
      }, { status: 404 });
    }

    // Use server wallet to perform a real deposit test
    const provider = new ethers.JsonRpcProvider(QUICKNODE_RPC || ALCHEMY_RPC);
    const serverWallet = new ethers.Wallet(process.env.OG_PRIVATE_KEY!, provider);

    const ogAmount = '0.05';
    const amountInWei = ethers.parseEther(ogAmount);
    const crdAmount = parseFloat(ogAmount) * OG_TO_CRD_RATE;

    const tokenContract = new ethers.Contract(OG_TOKEN_CONTRACT, ERC20_ABI, serverWallet);

    logToFile(`[TEST-DEPOSIT] Initiating transfer of ${ogAmount} OG from ${serverWallet.address} to ${TREASURY_ADDRESS}`);

    // Check balance first
    const balance = await tokenContract.balanceOf(serverWallet.address);
    if (balance < amountInWei) {
      return NextResponse.json({ 
        error: `Insufficient OG balance in server wallet (${serverWallet.address}). Required: ${ogAmount}, Found: ${ethers.formatEther(balance)}` 
      }, { status: 400 });
    }

    // Perform real transfer
    const tx = await tokenContract.transfer(TREASURY_ADDRESS, amountInWei);
    logToFile(`[TEST-DEPOSIT] Transaction sent: ${tx.hash}`);

    // Wait for 1 confirmation
    const receipt = await tx.wait();
    logToFile(`[TEST-DEPOSIT] Transaction confirmed in block ${receipt.blockNumber}`);

    // Update database
    logToFile(`[TEST-DEPOSIT] Creating transaction record for user ${userId}`);
    await prisma.transaction.create({
      data: {
        userId,
        amount: crdAmount,
        type: 'deposit',
        status: 'completed',
        description: `Real Test Deposit (0.05 OG) via QuickNode - TX: ${tx.hash}`
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: crdAmount
        }
      }
    });

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      credits: updatedUser.credits,
      blockNumber: receipt.blockNumber
    });

  } catch (error: any) {
    logToFile(`[TEST-DEPOSIT] ERROR: ${error.message || 'Unknown error'}`);
    return NextResponse.json(
      { error: error.message || 'Failed to process test deposit' },
      { status: 500 }
    );
  }
}
