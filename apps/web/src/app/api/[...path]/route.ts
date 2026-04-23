import { NextRequest, NextResponse } from "next/server";
import app from "../../../../../api/src/index"; // Path to apps/api/src/index
import { IncomingMessage, ServerResponse } from "http";

// Helper to bridge Next.js Request/Response to Express
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req);
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req);
}

async function handle(req: NextRequest) {
  // Since we are using Next.js 14+, we can try to use the Express app directly if it's compatible
  // or use a helper like 'serverless-http' or 'next-connect'.
  // However, the simplest way is to ensure the Express app is exported correctly and use a bridge.
  
  // For this specific case, I'll use a standard Next.js proxy-like behavior 
  // or a direct import if the Express app is exported as a handler.
  
  // Actually, 'apps/api/src/index.ts' exports the expressApp.
  // We can use it with a library, but I don't want to add new dependencies if possible.
  
  // Wait, I'll check if I can just use the Express app by calling it.
  // But Next.js App Router expects a NextResponse.
  
  // I'll use a simpler approach: I'll move the API logic to a single file that can be used by both 
  // OR I'll just fix the Vercel routing properly.
  
  // Re-thinking: The problem is that Vercel is not "seeing" the root 'api' folder.
  // I'll try to put the 'api' folder INSIDE 'apps/web' if it's the root project.
  
  return NextResponse.json({ error: "Legacy Route Placeholder - Not Found" }, { status: 404 });
}
