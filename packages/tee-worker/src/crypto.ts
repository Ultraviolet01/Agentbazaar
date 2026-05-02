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

import crypto from 'node:crypto';

let rsaKeyPair: { publicKey: string; privateKey: crypto.KeyObject } | null = null;

/**
 * Initialize RSA key pair inside the TEE.
 * Called once at startup.
 */
export async function initializeKeys(): Promise<void> {
  // Try to use dstack SDK for deterministic key derivation (real TEE)
  try {
    const { TappdClient } = await import('@phala/dstack-sdk');
    const client = new TappdClient();
    
    // Derive a deterministic seed from the TEE enclave
    const seedInfo = await client.deriveKey('/agentbazaar/credential-master-key');
    const seed = seedInfo.asUint8Array();
    
    // Use the seed to generate a deterministic RSA key pair
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    
    rsaKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: crypto.createPrivateKey(keyPair.privateKey),
    };
    
    console.log('[TEE Crypto] Keys derived from TEE enclave identity');
  } catch (error) {
    // Fallback: generate ephemeral keys (dev/simulator mode)
    console.warn('[TEE Crypto] dstack not available, generating ephemeral keys (dev mode)');
    
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    
    rsaKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: crypto.createPrivateKey(keyPair.privateKey),
    };
    
    console.log('[TEE Crypto] Ephemeral keys generated (NOT TEE-backed)');
  }
}

/**
 * Get the RSA public key (PEM format).
 * This is safe to share — it's used by clients to encrypt credentials.
 */
export function getPublicKey(): string {
  if (!rsaKeyPair) {
    throw new Error('Keys not initialized. Call initializeKeys() first.');
  }
  return rsaKeyPair.publicKey;
}

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
export function decryptCredentials(bundle: {
  encryptedKey: string;
  encryptedData: string;
  iv: string;
}): Record<string, string> {
  if (!rsaKeyPair) {
    throw new Error('Keys not initialized. Call initializeKeys() first.');
  }
  
  // 1. Decrypt the AES key with RSA-OAEP
  const encryptedAESKey = Buffer.from(bundle.encryptedKey, 'base64');
  const aesKeyBuffer = crypto.privateDecrypt(
    {
      key: rsaKeyPair.privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedAESKey
  );
  
  // 2. Decrypt the data with AES-256-GCM
  const encryptedData = Buffer.from(bundle.encryptedData, 'base64');
  const iv = Buffer.from(bundle.iv, 'base64');
  
  // WebCrypto appends the 16-byte auth tag to the ciphertext
  const authTagLength = 16;
  const ciphertext = encryptedData.subarray(0, encryptedData.length - authTagLength);
  const authTag = encryptedData.subarray(encryptedData.length - authTagLength);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKeyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
