/**
 * TEE Worker — Crypto Module
 *
 * Handles RSA key generation and credential decryption.
 * The RSA private key is generated inside the TEE at startup
 * and NEVER exported or written to disk.
 *
 * When running on Phala Cloud (real TEE), keys are derived
 * deterministically from the enclave identity via dstack SDK.
 * When running locally (simulator/dev), keys are generated in memory.
 */
/**
 * Initialize RSA key pair inside the TEE.
 * Called once at startup.
 */
export declare function initializeKeys(): Promise<void>;
/**
 * Get the RSA public key (PEM format).
 * This is safe to share — it's used by clients to encrypt credentials.
 */
export declare function getPublicKey(): string;
/**
 * Decrypt an encrypted credential bundle.
 *
 * Steps:
 * 1. Decrypt the AES key using RSA-OAEP private key
 * 2. Decrypt the credentials using AES-256-GCM
 *
 * @param bundle - The encrypted bundle from the client
 * @returns Decrypted credentials as a parsed object
 */
export declare function decryptCredentials(bundle: {
    encryptedKey: string;
    encryptedData: string;
    iv: string;
}): Record<string, string>;
//# sourceMappingURL=crypto.d.ts.map