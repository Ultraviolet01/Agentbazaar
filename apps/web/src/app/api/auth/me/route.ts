import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export async function GET(req: NextRequest) {
  try {
    const token = cookies().get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as { id: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        username: true,
        credits: true,
        onboardingCompleted: true,
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

    const totalSpent = user.agentRuns.reduce((sum, run) => sum + run.creditsUsed, 0);

    return NextResponse.json({
      user: {
        ...user,
        agentRuns: undefined,
        totalSpent
      }
    });
  } catch (error) {
    console.error("Auth verify error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
