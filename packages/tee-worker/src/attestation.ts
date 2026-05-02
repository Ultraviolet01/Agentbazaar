/**
 * TEE Worker — Attestation Module
 * 
 * Generates cryptographic proofs that agent execution
 * happened inside a genuine TEE enclave.
 */

import crypto from 'node:crypto';

export interface AttestationProof {
  // Whether this is a real TEE attestation or a dev stub
  isRealTEE: boolean;
  // The attestation quote (hex-encoded)
  quote: string;
  // Timestamp of attestation
  timestamp: number;
  // Hash of the data that was attested
  dataHash: string;
  // TEE provider info
  provider: string;
}

/**
 * Generate a TEE attestation proof for an agent run.
 * 
 * On real TEE hardware (Phala Cloud), this generates a TDX quote.
 * On dev/simulator, it generates a signed hash stub.
 */
export async function generateAttestation(
  agentId: string,
  inputHash: string,
  outputHash: string
): Promise<AttestationProof> {
  const reportData = JSON.stringify({
    agentId,
    inputHash,
    outputHash,
    timestamp: Date.now(),
  });
  
  const dataHash = crypto.createHash('sha256').update(reportData).digest('hex');
  
  // Try real TEE attestation via dstack
  try {
    const { TappdClient } = await import('@phala/dstack-sdk');
    const client = new TappdClient();
    
    // Generate a TDX quote
    const quoteData = await client.tdxQuote(reportData);
    const quote = quoteData.quote;
    
    return {
      isRealTEE: true,
      quote: typeof quote === 'string' ? quote : JSON.stringify(quote),
      timestamp: Date.now(),
      dataHash,
      provider: 'phala-dstack-tdx',
    };
  } catch (error) {
    // Dev mode: generate a signed hash as a stub
    console.warn('[Attestation] dstack not available, generating dev stub');
    
    const stubQuote = crypto
      .createHash('sha256')
      .update(`dev-attestation:${reportData}`)
      .digest('hex');
    
    return {
      isRealTEE: false,
      quote: stubQuote,
      timestamp: Date.now(),
      dataHash,
      provider: 'dev-simulator',
    };
  }
}

/**
 * Verify an attestation proof (basic check)
 */
export function verifyAttestationBasic(proof: AttestationProof): boolean {
  // Basic validity checks
  if (!proof.quote || !proof.dataHash || !proof.timestamp) return false;
  
  // Check timestamp is within 1 hour
  const oneHour = 60 * 60 * 1000;
  if (Date.now() - proof.timestamp > oneHour) return false;
  
  return true;
}
