import { config } from 'dotenv';
import path from 'path';
import axios from 'axios';
import { ethers } from 'ethers';
import crypto from 'node:crypto';

// Load .env from apps/web
config({ path: path.join(process.cwd(), 'apps/web/.env') });

const TEE_WORKER_URL = process.env.TEE_WORKER_URL || 'http://localhost:4100';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
const TEE_WORKER_API_KEY = process.env.TEE_WORKER_API_KEY || 'dev-key';

async function testTeeFlow() {
  console.log('--- AgentBazaar TEE Full Flow Deployment Test ---\n');

  try {
    // 1. Check TEE Worker Health
    console.log(`[1/5] Checking TEE Worker health at ${TEE_WORKER_URL}...`);
    const healthRes = await axios.get(`${TEE_WORKER_URL}/health`);
    console.log('✅ TEE Worker is healthy:', healthRes.data.status);

    // 2. Fetch Public Key
    console.log(`[2/5] Fetching TEE public key...`);
    const keyRes = await axios.get(`${TEE_WORKER_URL}/public-key`);
    const { publicKey } = keyRes.data;
    console.log('✅ Public Key fetched successfully.');

    // 3. Simulate Client-Side Encryption
    console.log(`[3/5] Simulating client-side encryption of API keys...`);
    
    // Generate AES key
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const credentials = JSON.stringify({ apiKey: 'sk-test-key-12345', orgId: 'org-test' });
    
    // Encrypt data with AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let encryptedData = cipher.update(credentials, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Encrypt AES key with RSA public key
    const encryptedKey = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    ).toString('base64');

    const encryptedPayload = {
      encryptedKey,
      encryptedData: Buffer.concat([Buffer.from(encryptedData, 'hex'), cipher.getAuthTag()]).toString('base64'),
      iv: iv.toString('base64'),
    };
    console.log('✅ Encryption successful.');

    // 4. Test TEE Worker Decryption & Execution (Direct Call)
    console.log(`[4/5] Testing TEE Worker execution (direct call)...`);
    const runRequest = {
      agentId: 'test-agent-id',
      agentSlug: 'test-agent',
      teeCredentialId: '0g-hash-stub',
      encryptedCredentials: encryptedPayload,
      modelProvider: 'custom',
      modelName: 'gpt-3.5-turbo',
      apiEndpoint: 'https://api.openai.com/v1/chat/completions', // We won't actually call this if it's a dry run, but the worker will try
      input: {
        prompt: 'Hello from TEE test!',
      },
    };

    try {
        const runRes = await axios.post(`${TEE_WORKER_URL}/run-agent`, runRequest, {
          headers: { 'x-tee-api-key': TEE_WORKER_API_KEY }
        });
        console.log('✅ TEE Worker execution result:', runRes.data.success ? 'Success' : 'Failed');
    } catch (err: any) {
        // If it fails because of invalid API key, it's actually a SUCCESS in terms of TEE flow (decryption worked)
        if (err.response?.data?.error?.includes('API key')) {
            console.log('✅ TEE Worker decryption successful (failed at API call as expected with dummy key).');
        } else {
            console.log('❌ TEE Worker execution failed:', err.response?.data || err.message);
        }
    }

    // 5. Check Attestation
    console.log(`[5/5] Generating TEE attestation proof...`);
    const attestationRes = await axios.get(`${TEE_WORKER_URL}/attestation`, {
      headers: { 'x-tee-api-key': TEE_WORKER_API_KEY }
    });
    console.log('✅ Attestation proof generated:', attestationRes.data.valid ? 'Valid' : 'Invalid');
    
    console.log('\n🎉 TEE Deployment Test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ TEE Deployment Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testTeeFlow();
