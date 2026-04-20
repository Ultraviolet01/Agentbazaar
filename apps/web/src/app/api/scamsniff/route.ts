import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { 
  CreditsService, 
  StorageService, 
  SCAMSNIFF_SYSTEM_PROMPT, 
  verifyToken 
} from '@agentbazaar/database';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize shared services
const storageService = new StorageService();
const creditsService = new CreditsService(prisma);

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;

    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (authError: any) {
      return NextResponse.json({ error: `Unauthorized: ${authError.message}` }, { status: 401 });
    }

    // 2. Parse Request Body
    const { url, title, elements, projectId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 });
    }

    // 3. Credit Deduction (1 CRD)
    try {
      await creditsService.deductCredits(userId, 1, `ScamSniff Analysis: ${url}`);
    } catch (creditError: any) {
      return NextResponse.json({ error: creditError.message }, { status: 402 });
    }

    // 4. Heuristic AI Analysis via Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      system: SCAMSNIFF_SYSTEM_PROMPT,
      messages: [{ 
        role: "user", 
        content: `Target URL: ${url}\nTitle: ${title}\nMetadata: ${JSON.stringify(elements)}` 
      }],
    });

    let analysis;
    try {
      const textContent = response.content[0].type === 'text' ? response.content[0].text : "{}";
      analysis = JSON.parse(textContent);
    } catch (parseError) {
      console.warn("⚠️ ScamSniff: Failed to parse AI output. Using safe fallback.", parseError);
      analysis = {
        riskScore: 50,
        verdict: "SUSPICIOUS",
        reasoning: "Automated analysis encountered a parsing error. Heuristic signals were mixed.",
        detections: ["INTERNAL_PARSING_ERROR"]
      };
    }

    // 5. Upload Artifact to 0G Storage
    const uploadResult = await storageService.uploadArtifact({
      ...analysis,
      url,
      timestamp: new Date()
    }, {
      agent: "SCAMSNIFF",
      url,
      projectId,
      source: "NEXTJS_API"
    });

    // 6. Persistence (AgentRun & ProjectMemory)
    await prisma.$transaction(async (tx) => {
      await tx.agentRun.create({
        data: {
          userId,
          projectId: projectId || null,
          agentType: "SCAMSNIFF",
          inputData: JSON.stringify({ url, title, elements }),
          outputData: JSON.stringify(analysis),
          creditsUsed: 1,
          status: "COMPLETED"
        }
      });

      if (projectId) {
        await tx.projectMemory.create({
          data: {
            projectId,
            sourceAgent: "SCAMSNIFF",
            memoryType: "SCAN_RESULT",
            content: { riskScore: analysis.riskScore, verdict: analysis.verdict, url },
            storageCid: uploadResult.cid ?? ""
          }
        });
      }
    });

    return NextResponse.json({
      ...analysis,
      cid: uploadResult.cid,
      txHash: uploadResult.txHash
    });

  } catch (error: any) {
    console.error('Scan failed:', error);
    return NextResponse.json(
      { error: 'Scan failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
