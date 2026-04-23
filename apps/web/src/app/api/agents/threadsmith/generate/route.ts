import { NextResponse } from "next/server";
import { PrismaClient, AgentType, CreditsService, StorageService, THREADSMITH_SYSTEM_PROMPT } from "@agentbazaar/database";
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const storageService = new StorageService();
const creditsService = new CreditsService(prisma);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; email: string };
  } catch (error) {
    console.error("JWT Verify Error:", error);
    return null;
  }
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ 
      error: "Unauthorized", 
      debug: { 
        hasToken: !!cookies().get("auth_token"),
        hasSecret: !!process.env.JWT_SECRET 
      } 
    }, { status: 401 });
  }

  try {
    const { projectId, contentType, tone, quality, useMemory, input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Input context is required" }, { status: 400 });
    }

    // Diagnostic check
    const diagnostics = {
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      hasDbUrl: !!process.env.AGENTBAZAAR_DB_URL,
      hasStorageKey: !!process.env.OG_PRIVATE_KEY,
    };

    // 1. Credit Calculation (Premium: 5 CRD, Standard: 2 CRD)
    const creditsUsed = quality === 'premium' ? 5 : 2;

    // Check balance first
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { credits: true }
    });

    if (!user || user.credits < creditsUsed) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        required: creditsUsed, 
        current: user?.credits || 0 
      }, { status: 402 });
    }


    // 2. Context Gathering
    let context = input || "";
    if (useMemory && projectId) {
      const memories = await prisma.projectMemory.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 10
      });
      context += "\n\nProject History:\n" + memories.map((m: any) => `${m.memoryType}: ${JSON.stringify(m.content)}`).join("\n");
    }

    // 3. AI Generation
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI configuration missing (API Key)" }, { status: 500 });
    }

    console.log(`[Diagnostic] API Key Prefix: ${apiKey.substring(0, 12)}... Length: ${apiKey.length}`);
    console.log(`[Diagnostic] Model Tier: ${quality}`);

    let generatedContent = "";
    const modelsToTry = [
      "claude-3-5-sonnet-latest",
      "claude-3-5-sonnet-20240620",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
      "claude-3-sonnet-20240229"
    ];

    let lastError: any = null;

    // Try RAW FETCH to bypass potential SDK issues
    console.log("[Diagnostic] Attempting RAW FETCH with model: claude-3-5-sonnet-20240620");
    try {
      const rawResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1500,
          system: THREADSMITH_SYSTEM_PROMPT,
          messages: [{ 
            role: "user", 
            content: `ContentType: ${contentType}\nTone: ${tone}\nContext: ${context}` 
          }]
        })
      });

      if (rawResponse.ok) {
        const rawData = await rawResponse.json();
        generatedContent = rawData.content[0].text;
        console.log("[Diagnostic] RAW FETCH Success!");
      } else {
        const errorText = await rawResponse.text();
        console.error(`[Diagnostic] RAW FETCH Failed: ${rawResponse.status} ${errorText}`);
        lastError = { message: `Raw Anthropic Error: ${errorText}`, status: rawResponse.status, raw: errorText };
        throw new Error(errorText);
      }
    } catch (fetchError: any) {
      console.error("[Diagnostic] Falling back to SDK after fetch fail:", fetchError.message);
      const rawErrorText = lastError?.raw || fetchError.message;
      
      for (const model of modelsToTry) {
        if (generatedContent) break;
        
        try {
          const response = await anthropic.messages.create({
            model: model,
            max_tokens: 1500,
            system: THREADSMITH_SYSTEM_PROMPT,
            messages: [{ 
              role: "user", 
              content: `ContentType: ${contentType}\nTone: ${tone}\nContext: ${context}` 
            }],
          });
          
          generatedContent = response.content[0].type === 'text' ? response.content[0].text : "";
        } catch (aiError: any) {
          lastError = aiError;
        }
      }
    }

    if (!generatedContent && lastError) {
      return NextResponse.json({ 
        error: `AI Engine Exhausted: ${lastError.message || "Unknown AI error"}`,
        details: lastError.status ? `Status ${lastError.status}` : "No status code",
        debug: {
          keyPrefix: apiKey ? `${apiKey.substring(0, 12)}...` : "missing",
          keyLength: apiKey?.length || 0,
          attemptedModels: modelsToTry,
          rawError: lastError?.raw || lastError?.message || "No raw details"
        },
        suggestion: "Verify that the API Key prefix/length matches your dashboard and that you have access to Claude 3 models."
      }, { status: 500 });
    }

    if (!generatedContent) {
      throw new Error("Empty response from AI engine");
    }

    // 4. Deduct credits (Move here to ensure deduction only on success)
    await creditsService.deductCredits(authUser.id, creditsUsed, `ThreadSmith Generation: ${contentType}`);

    // 5. Upload to 0G Storage
    let artifactCid = "";
    try {
      const uploadResult = await storageService.uploadArtifact({
        content: generatedContent,
        contentType,
        tone,
        timestamp: new Date()
      }, {
        agent: "THREADSMITH",
        projectId: projectId || "independent",
        userId: authUser.id
      });
      artifactCid = uploadResult.cid as string;
    } catch (storageError: any) {
      console.warn("Storage upload failed, continuing without CID", storageError);
      // We don't fail the whole request if storage fails
    }

    // 5. Persistence
    let run;
    try {
      run = await prisma.agentRun.create({
        data: {
          userId: authUser.id,
          projectId: projectId || null,
          agentType: AgentType.THREADSMITH,
          inputData: { contentType, tone, quality, input, useMemory },
          outputData: { content: generatedContent },
          creditsUsed,
          status: "COMPLETED",
          artifactCid
        }
      });
    } catch (dbError) {
      console.error("Failed to persist agent run", dbError);
      // Still return the content to the user
      return NextResponse.json({ 
        content: generatedContent, 
        warning: "Persistence failed" 
      });
    }

    // 6. Project Memory
    if (projectId) {
      await prisma.projectMemory.create({
        data: {
          projectId,
          sourceAgent: "THREADSMITH",
          memoryType: "CONTENT_GENERATION",
          content: { contentType, tone, excerpt: generatedContent.substring(0, 200) },
          storageCid: artifactCid
        }
      });
    }

    return NextResponse.json({ 
      content: generatedContent, 
      cid: artifactCid, 
      runId: run.id 
    });

  } catch (error: any) {
    console.error("ThreadSmith API Error:", error);
    return NextResponse.json({ error: error.message || "Execution failed" }, { status: 500 });
  }
}
