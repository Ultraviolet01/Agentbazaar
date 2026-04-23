import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@agentbazaar/database";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: lowerEmail,
        username,
        passwordHash,
        emailVerified: true, // Auto-verify
        credits: 20.0
      }
    });

    // Create Transaction record for signup bonus
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: 20.0,
        type: "CREDIT",
        status: "COMPLETED",
        description: "Signup Bonus"
      }
    });

    return NextResponse.json({ message: "Registration successful. You can now log in." }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
