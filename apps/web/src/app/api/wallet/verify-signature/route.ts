import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";

export async function POST(req: Request) {
  try {
    const { address, message, signature } = await req.body.json();

    if (!address || !message || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const recoveredAddress = verifyMessage(message, signature);
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    return NextResponse.json({ verified });
  } catch (error: any) {
    console.error("Signature verification error:", error);
    return NextResponse.json({ error: "Failed to verify signature", verified: false }, { status: 500 });
  }
}
