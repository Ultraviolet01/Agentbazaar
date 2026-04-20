import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { jwtVerify } from 'jose';
import { AgentType } from '@agentbazaar/database';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Success' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await req.json();
    const { 
      monitoringType, 
      notificationEmail,
      projectUrl,
      monitorSocial,
      monitorWebsite,
      monitorSentiment,
      checkFrequency,
      contractAddress,
      tokenSymbol,
      currentFDV,
      targetFDV,
      newsTopics,
      newsFrequency,
      projectId
    } = body;

    // Calculate setup cost
    let setupCost = 0;
    if (monitoringType === 'project') setupCost = 10;
    else if (monitoringType === 'token_milestone') setupCost = 5;
    else if (monitoringType === 'crypto_news') setupCost = 3;

    // Atomic transaction: Deduct credits, Record Transaction, Create Monitor, Create AgentRun
    const { monitor } = await prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({ where: { id: userId } });
      if (!u || u.credits < setupCost) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // 1. Deduct credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: setupCost } }
      });

      // 2. Record Transaction
      await tx.transaction.create({
        data: {
          userId,
          amount: -setupCost,
          type: 'agent_run',
          status: 'completed',
          description: `LaunchWatch Setup: ${monitoringType}`
        }
      });

      // 3. Create MonitoringJob
      const m = await tx.monitoringJob.create({
        data: {
          userId,
          type: monitoringType,
          email: notificationEmail || u.email,
          status: 'active',
          setupCost,
          projectUrl: projectUrl || null,
          monitorSocial: monitorSocial || false,
          monitorWebsite: monitorWebsite || false,
          monitorSentiment: monitorSentiment || false,
          checkFrequency: checkFrequency || null,
          contractAddress: contractAddress || null,
          tokenSymbol: tokenSymbol || null,
          currentFDV: currentFDV ? parseFloat(currentFDV) : null,
          targetFDV: targetFDV ? parseFloat(targetFDV) : null,
          newsTopics: JSON.stringify(newsTopics || []),
          newsFrequency: newsFrequency || null,
          nextCheck: new Date(Date.now() + 2 * 60 * 60 * 1000),
          totalChecks: 0
        }
      });

      // 4. Create AgentRun record
      await tx.agentRun.create({
        data: {
          userId,
          projectId: projectId || null,
          agentType: AgentType.LAUNCHWATCH,
          creditsUsed: setupCost,
          status: 'COMPLETED',
          inputData: JSON.stringify(body),
          outputData: JSON.stringify({ monitorId: m.id })
        }
      });

      return { monitor: m };
    });

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(monitor).catch(() => {});

    return NextResponse.json({
      success: true,
      monitor: {
        id: monitor.id,
        type: monitor.type,
        email: monitor.email
      }
    });

  } catch (error: any) {
    console.error('LaunchWatch setup error:', error);
    return NextResponse.json(
      { error: error.message === 'INSUFFICIENT_CREDITS' ? 'Insufficient credits' : 'Failed to setup monitoring' },
      { status: error.message === 'INSUFFICIENT_CREDITS' ? 402 : 500 }
    );
  }
}

async function sendConfirmationEmail(monitor: any) {
  await sendEmail({
    to: monitor.email,
    subject: `LaunchWatch: ${monitor.type} monitoring activated`,
    html: `<p>Your monitoring for ${monitor.type} is now active.</p>`
  });
}
