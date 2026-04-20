import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { StorageService, AgentType } from '@agentbazaar/database';
import { jwtVerify } from 'jose';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { input, contentType, tone, quality, projectId } = await req.json();

    if (!input || !contentType || !tone) {
      return NextResponse.json({ error: 'Input, ContentType, and Tone are required' }, { status: 400 });
    }

    const creditsUsed = quality === 'premium' ? 5 : 2;

    // Check if user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user || user.credits < creditsUsed) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Generate content with Claude
    const model = quality === 'premium' ? 'claude-opus-4-6' : 'claude-sonnet-4-6';
    let content = '';
    let generatedModel = model;

    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are ThreadSmith, an AI content synthesizer for Web3 projects. Create a ${contentType} with a ${tone} tone: ${input}`
        }]
      });
      content = message.content[0].type === 'text' ? message.content[0].text : '';
    } catch (aiError: any) {
      console.error('AI error, using fallback:', aiError.message);
      const fallbackModel = 'claude-3-5-sonnet-20241022';
      const message = await anthropic.messages.create({
        model: fallbackModel,
        max_tokens: 2000,
        messages: [{ role: 'user', content: `Create a ${contentType} for: ${input}` }]
      });
      content = message.content[0].type === 'text' ? message.content[0].text : '';
      generatedModel = `${fallbackModel} (fallback)`;
    }

    // Deduct credits and create transaction
    await prisma.$transaction([
      // Deduct credits
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditsUsed } }
      }),
      
      // Record transaction
      prisma.transaction.create({
        data: {
          userId,
          amount: -creditsUsed,
          type: 'agent_run',
          status: 'completed',
          description: `ThreadSmith Generation (${quality})`
        }
      }),

      // Create Agent Run record
      prisma.agentRun.create({
        data: {
          userId,
          projectId: projectId || null,
          agentType: AgentType.THREADSMITH,
          creditsUsed,
          status: 'COMPLETED',
          inputData: JSON.stringify({ input, contentType, tone, quality }),
          outputData: JSON.stringify({ content, model: generatedModel })
        }
      })
    ]);

    // Background: Upload to 0G Storage (non-blocking)
    try {
      const storage = new StorageService();
      storage.uploadArtifact({
        content,
        model: generatedModel,
        quality,
        contentType,
        tone
      }, {
        agent: 'threadsmith',
        userId
      }).catch(e => console.error('0G Storage fallback error:', e));
    } catch (e) {}

    return NextResponse.json({ 
      content,
      model: generatedModel,
      creditsUsed 
    });
  } catch (error: any) {
    console.error('ThreadSmith error:', error);
    return NextResponse.json(
      { error: 'Generation failed', details: error.message },
      { status: 500 }
    );
  }
}
