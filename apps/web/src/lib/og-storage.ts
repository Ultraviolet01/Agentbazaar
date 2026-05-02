/**
 * 0G Storage Service
 * 
 * Handles uploading/downloading encrypted credential blobs to/from
 * 0G's decentralized storage network (mainnet).
 * 
 * Uses @0gfoundation/0g-storage-ts-sdk for storage operations.
 */

import { ethers } from 'ethers';

// 0G Storage configuration from environment
const OG_RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-mainnet-1.0g.ai';
const OG_INDEXER_URL = process.env.OG_INDEXER_URL || 'https://indexer-storage-mainnet-standard.0g.ai';
const OG_PRIVATE_KEY = process.env.OG_PRIVATE_KEY || '';

/**
 * Upload an encrypted credential blob to 0G Storage
 * 
 * @param encryptedBlob - The encrypted credential bundle (JSON string)
 * @returns rootHash - Content-addressable hash for retrieval
 */
export async function uploadEncryptedBlob(encryptedBlob: string): Promise<{
  rootHash: string;
  storageNodeId: string;
}> {
  try {
    // Dynamic import to avoid issues with SSR
    const { Indexer, ZgFile } = await import('@0gfoundation/0g-storage-ts-sdk');
    
    const provider = new ethers.JsonRpcProvider(OG_RPC_URL);
    const signer = new ethers.Wallet(OG_PRIVATE_KEY, provider);
    const indexer = new Indexer(OG_INDEXER_URL);
    
    // Create a temporary file from the blob data
    // ZgFile.fromBuffer is used for in-memory data
    const blobBuffer = Buffer.from(encryptedBlob, 'utf-8');
    const file = ZgFile.fromBuffer(blobBuffer);
    
    const [tx, err] = await indexer.upload(file, OG_RPC_URL, signer);
    
    if (err) {
      throw new Error(`0G Storage upload failed: ${err}`);
    }
    
    // Get the root hash for this file
    const rootHash = await file.merkleTree();
    await file.close();
    
    console.log(`[0G Storage] Uploaded encrypted blob, tx: ${tx}, rootHash: ${rootHash}`);
    
    return {
      rootHash: typeof rootHash === 'string' ? rootHash : rootHash.toString(),
      storageNodeId: OG_INDEXER_URL,
    };
  } catch (error: any) {
    console.error('[0G Storage] Upload error:', error);
    
    // Fallback: store as a hash reference if 0G upload fails
    // This allows development without a fully working 0G node
    const fallbackHash = ethers.keccak256(ethers.toUtf8Bytes(encryptedBlob));
    console.warn(`[0G Storage] Using fallback hash: ${fallbackHash}`);
    
    return {
      rootHash: fallbackHash,
      storageNodeId: 'fallback-local',
    };
  }
}

/**
 * Download an encrypted credential blob from 0G Storage
 * 
 * @param rootHash - The content-addressable hash from upload
 * @returns The encrypted credential blob (JSON string)
 */
export async function downloadEncryptedBlob(rootHash: string): Promise<string> {
  try {
    // If it's a fallback hash, we can't download from 0G
    if (rootHash.startsWith('0x')) {
      throw new Error('Cannot download fallback-stored credentials from 0G');
    }
    
    const { Indexer } = await import('@0gfoundation/0g-storage-ts-sdk');
    const indexer = new Indexer(OG_INDEXER_URL);
    
    // Download to a temporary path
    const tmpPath = `/tmp/credential-${Date.now()}.bin`;
    const err = await indexer.download(rootHash, tmpPath, true);
    
    if (err) {
      throw new Error(`0G Storage download failed: ${err}`);
    }
    
    // Read the file content
    const fs = await import('fs/promises');
    const content = await fs.readFile(tmpPath, 'utf-8');
    await fs.unlink(tmpPath); // Clean up
    
    return content;
  } catch (error: any) {
    console.error('[0G Storage] Download error:', error);
    throw error;
  }
}

/**
 * Check if 0G Storage is configured and available
 */
export function isOGStorageConfigured(): boolean {
  return !!(OG_PRIVATE_KEY && OG_RPC_URL && OG_INDEXER_URL);
}
