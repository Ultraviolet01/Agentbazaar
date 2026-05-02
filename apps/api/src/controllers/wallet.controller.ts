import { Request, Response } from "express";
import { PrismaClient } from "@agentbazaar/database";
import { verifyMessage } from "ethers";

const prisma = new PrismaClient();

export const connectWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { walletAddress } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress }
    });

    res.json({ message: "Wallet connected", walletAddress: user.walletAddress });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to connect wallet" });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        walletAddress: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      credits: user.credits,
      walletAddress: user.walletAddress
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get status" });
  }
};

export const verifySignature = async (req: Request, res: Response) => {
  try {
    const { address, message, signature } = req.body;

    if (!address || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize line endings to prevent mismatches between Windows/Unix
    const normalizedMessage = message.replace(/\r\n/g, "\n");

    const recoveredAddress = verifyMessage(normalizedMessage, signature);
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    console.log(`Signature verification for ${address}: ${verified} (Recovered: ${recoveredAddress})`);

    res.json({ verified });
  } catch (error) {
    console.error("Signature verification error:", error);
    res.status(500).json({ error: "Failed to verify signature", verified: false });
  }
};

export const deposit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { ogAmount, crdAmount, txHash, walletAddress } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if transaction already exists
    const existingTx = await prisma.transaction.findFirst({
      where: { txHash }
    });

    if (existingTx) {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    // Update user credits and record transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const newTx = await tx.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount: crdAmount,
          description: `Deposit of ${ogAmount} OG tokens. Wallet: ${walletAddress}, TX: ${txHash}`,
          txHash,
          status: "COMPLETED"
        }
      });

      // Update user credits
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: crdAmount
          }
        }
      });

      return newTx;
    });

    res.json({ success: true, transaction: result });
  } catch (error: any) {
    console.error("Deposit error:", error);
    res.status(500).json({ error: error.message || "Failed to process deposit" });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    const mappedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      subtype: tx.type === "DEPOSIT" ? "ON-CHAIN" : "",
      description: tx.description,
      amount: tx.amount,
      status: tx.status,
      date: tx.createdAt.toISOString().split("T")[0]
    }));

    res.json({ transactions: mappedTransactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};
