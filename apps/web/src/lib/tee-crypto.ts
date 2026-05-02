/**
 * TEE Crypto Utilities
 * 
 * Browser-safe encryption for agent credentials.
 * Uses RSA-OAEP + AES-256-GCM hybrid encryption:
 * 1. Generate random AES-256 key
 * 2. Encrypt credentials with AES-256-GCM
 * 3. Encrypt the AES key with RSA-OAEP (TEE's public key)
 * 4. Bundle everything together
 * 
 * Only the TEE worker (holding the RSA private key) can decrypt.
 */

export interface EncryptedCredentialBundle {
  // AES key encrypted with RSA public key (base64)
  encryptedKey: string;
  // Credentials encrypted with AES-256-GCM (base64)
  encryptedData: string;
  // AES-GCM initialization vector (base64)
  iv: string;
  // AES-GCM auth tag is included in encryptedData (WebCrypto appends it)
  // Algorithm metadata
  algorithm: 'RSA-OAEP+AES-256-GCM';
  // Timestamp for freshness
  timestamp: number;
}

export interface AgentCredentials {
  provider: string; // 'openai', 'anthropic', 'custom'
  apiKey: string;
  orgId?: string;
  baseUrl?: string;
  model?: string;
  // Additional provider-specific fields
  [key: string]: string | undefined;
}

/**
 * Import a PEM-encoded RSA public key for use with Web Crypto API
 */
async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  // Strip PEM header/footer and decode
  const pemBody = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  
  return crypto.subtle.importKey(
    'spki',
    binaryKey.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

/**
 * Generate a random AES-256-GCM key
 */
async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable (we need to encrypt it with RSA)
    ['encrypt']
  );
}

/**
 * Encrypt credentials with the TEE worker's public key.
 * 
 * This runs entirely in the browser. The plaintext credentials
 * are NEVER sent to the server.
 * 
 * @param publicKeyPem - PEM-encoded RSA public key from TEE worker
 * @param credentials - The API credentials to encrypt
 * @returns Encrypted bundle that only the TEE can decrypt
 */
export async function encryptCredentials(
  publicKeyPem: string,
  credentials: AgentCredentials
): Promise<EncryptedCredentialBundle> {
  // 1. Import the TEE's RSA public key
  const rsaPublicKey = await importPublicKey(publicKeyPem);
  
  // 2. Generate a random AES-256 key
  const aesKey = await generateAESKey();
  
  // 3. Encrypt the credentials with AES-256-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const credentialsBytes = new TextEncoder().encode(JSON.stringify(credentials));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    credentialsBytes
  );
  
  // 4. Export the AES key and encrypt it with RSA-OAEP
  const rawAESKey = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPublicKey,
    rawAESKey
  );
  
  // 5. Bundle everything as base64
  return {
    encryptedKey: arrayBufferToBase64(encryptedKey),
    encryptedData: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv.buffer),
    algorithm: 'RSA-OAEP+AES-256-GCM',
    timestamp: Date.now(),
  };
}

/**
 * Validate that an encrypted bundle has the expected structure
 */
export function validateEncryptedBundle(bundle: unknown): bundle is EncryptedCredentialBundle {
  if (!bundle || typeof bundle !== 'object') return false;
  const b = bundle as Record<string, unknown>;
  return (
    typeof b.encryptedKey === 'string' &&
    typeof b.encryptedData === 'string' &&
    typeof b.iv === 'string' &&
    b.algorithm === 'RSA-OAEP+AES-256-GCM' &&
    typeof b.timestamp === 'number'
  );
}

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
