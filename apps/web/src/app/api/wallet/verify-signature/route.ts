import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature } = await req.json();

    // Validate inputs
    if (!address || !message || !signature) {
      return NextResponse.json(
        { verified: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the signature
    const recoveredAddress = verifyMessage(message, signature);

    // Check if recovered address matches the provided address
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    if (verified) {
      console.log('✓ Signature verified for address:', address);
      
      return NextResponse.json({
        verified: true,
        recoveredAddress,
        message: 'Wallet ownership verified'
      });
    } else {
      console.log('✗ Signature verification failed');
      console.log('Expected:', address);
      console.log('Recovered:', recoveredAddress);
      
      return NextResponse.json({
        verified: false,
        error: 'Signature does not match address'
      });
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return NextResponse.json(
      { verified: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
