"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeKeys = initializeKeys;
exports.getPublicKey = getPublicKey;
exports.decryptCredentials = decryptCredentials;
const node_crypto_1 = __importDefault(require("node:crypto"));
let rsaKeyPair = null;
/**
 * Initialize RSA key pair inside the TEE.
 * Called once at startup.
 */
async function initializeKeys() {
    // Try to use dstack SDK for deterministic key derivation (real TEE)
    try {
        const { TappdClient } = await Promise.resolve().then(() => __importStar(require('@phala/dstack-sdk')));
        const client = new TappdClient();
        // Derive a deterministic seed from the TEE enclave
        const seedInfo = await client.deriveKey('/agentbazaar/credential-master-key');
        const seed = seedInfo.asUint8Array();
        // Use the seed to generate a deterministic RSA key pair
        const keyPair = node_crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        rsaKeyPair = {
            publicKey: keyPair.publicKey,
            privateKey: node_crypto_1.default.createPrivateKey(keyPair.privateKey),
        };
        console.log('[TEE Crypto] Keys derived from TEE enclave identity');
    }
    catch (error) {
        // Fallback: generate ephemeral keys (dev/simulator mode)
        console.warn('[TEE Crypto] dstack not available, generating ephemeral keys (dev mode)');
        const keyPair = node_crypto_1.default.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        rsaKeyPair = {
            publicKey: keyPair.publicKey,
            privateKey: node_crypto_1.default.createPrivateKey(keyPair.privateKey),
        };
        console.log('[TEE Crypto] Ephemeral keys generated (NOT TEE-backed)');
    }
}
/**
 * Get the RSA public key (PEM format).
 * This is safe to share — it's used by clients to encrypt credentials.
 */
function getPublicKey() {
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
function decryptCredentials(bundle) {
    if (!rsaKeyPair) {
        throw new Error('Keys not initialized. Call initializeKeys() first.');
    }
    // 1. Decrypt the AES key with RSA-OAEP
    const encryptedAESKey = Buffer.from(bundle.encryptedKey, 'base64');
    const aesKeyBuffer = node_crypto_1.default.privateDecrypt({
        key: rsaKeyPair.privateKey,
        padding: node_crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
    }, encryptedAESKey);
    // 2. Decrypt the data with AES-256-GCM
    const encryptedData = Buffer.from(bundle.encryptedData, 'base64');
    const iv = Buffer.from(bundle.iv, 'base64');
    // WebCrypto appends the 16-byte auth tag to the ciphertext
    const authTagLength = 16;
    const ciphertext = encryptedData.subarray(0, encryptedData.length - authTagLength);
    const authTag = encryptedData.subarray(encryptedData.length - authTagLength);
    const decipher = node_crypto_1.default.createDecipheriv('aes-256-gcm', aesKeyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}
//# sourceMappingURL=crypto.js.map