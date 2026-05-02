/**
 * TEE Worker — Attestation Module
 *
 * Generates cryptographic proofs that agent execution
 * happened inside a genuine TEE enclave.
 */
export interface AttestationProof {
    isRealTEE: boolean;
    quote: string;
    timestamp: number;
    dataHash: string;
    provider: string;
}
/**
 * Generate a TEE attestation proof for an agent run.
 *
 * On real TEE hardware (Phala Cloud), this generates a TDX quote.
 * On dev/simulator, it generates a signed hash stub.
 */
export declare function generateAttestation(agentId: string, inputHash: string, outputHash: string): Promise<AttestationProof>;
/**
 * Verify an attestation proof (basic check)
 */
export declare function verifyAttestationBasic(proof: AttestationProof): boolean;
//# sourceMappingURL=attestation.d.ts.map