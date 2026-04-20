import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { 
  CreditsService, 
  verifyToken 
} from '@agentbazaar/database';

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
    const { 
      projectId,
      projectUrl,
      frequency = 'DAILY', 
      emailEnabled = false, 
      alertTypes,
      severityThreshold = 'MEDIUM'
    } = await req.json();

    if (!projectId && !projectUrl) {
      return NextResponse.json({ error: 'ProjectId or ProjectUrl is required' }, { status: 400 });
    }

    let targetProjectId = projectId;

    // 2.1 Fallback: Find project by URL if projectId is missing
    if (!targetProjectId && projectUrl) {
      const project = await prisma.project.findFirst({
        where: { websiteUrl: projectUrl, userId }
      });
      if (project) {
        targetProjectId = project.id;
      } else {
        return NextResponse.json({ error: 'Project not found for the provided URL. Please create the project first.' }, { status: 404 });
      }
    }

    // 3. Credit Deduction (10 CRD for setup)
    try {
      await creditsService.deductCredits(userId, 10, `LaunchWatch Setup: Project ${targetProjectId}`);
    } catch (creditError: any) {
      return NextResponse.json({ error: creditError.message }, { status: 402 });
    }

    // 4. Update Monitoring Configuration
    const result = await prisma.launchWatchConfig.upsert({
      where: { projectId: targetProjectId },
      update: { 
        frequency, 
        emailEnabled, 
        alertTypes,
        active: true,
        lastRunAt: null
      },
      create: { 
        projectId: targetProjectId,
        frequency,
        emailEnabled,
        alertTypes,
        active: true
      }
    });

    // NOTE: In a production environment, you would trigger a webhook or message queue
    // to notify the persistent monitoring engine (Express API) to reload its jobs.
    // For now, it will pick up the new config on next restart.

    return NextResponse.json({ 
      success: true, 
      message: "LaunchWatch monitor successfully established",
      configId: result.id
    });

  } catch (error: any) {
    console.error('LaunchWatch Setup failed:', error);
    return NextResponse.json(
      { error: 'Setup failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
