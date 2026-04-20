import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Success' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = 'pNInz6obpgUEG0dfLSmR'; // Adam

    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY is not defined');
      return NextResponse.json({ error: 'TTS Service Unavailable' }, { status: 500 });
    }

    // Deduct 1 credit for voice synthesis
    try {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } }
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: -1,
            type: 'agent_run',
            status: 'completed',
            description: 'ScamSniff Voice Synthesis'
          }
        })
      ]);
    } catch (e: any) {
      return NextResponse.json({ error: 'Insufficient credits or billing error' }, { status: 402 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: response.status });
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();

    // Return the audio as a stream
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('Voice proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
