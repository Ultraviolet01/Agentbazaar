import { Indexer, MemData } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class StorageService {
  private indexer: Indexer;
  private signer: ethers.BaseWallet;
  private rpcUrl: string;

  constructor(
    rpcUrl: string = process.env.OG_RPC_URL || 'https://evmrpc-mainnet-1.0g.ai',
    indexerUrl: string = process.env.OG_INDEXER_URL || 'https://indexer-storage-mainnet-standard.0g.ai',
    privateKey: string = process.env.OG_PRIVATE_KEY || ''
  ) {
    this.rpcUrl = rpcUrl;
    const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    
    const isValidKey = privateKey && /^(0x)?[0-9a-fA-F]{64}$/.test(privateKey);

    if (isValidKey) {
      this.signer = new ethers.Wallet(privateKey, provider);
    } else {
      console.warn("Using read-only random signer due to missing or invalid OG_PRIVATE_KEY");
      this.signer = ethers.Wallet.createRandom(provider);
    }
    this.indexer = new Indexer(indexerUrl);
  }

  /**
   * Upload an artifact (JSON/Buffer) to 0G Storage
   */
  async uploadArtifact(data: any, metadata: any = {}) {
    try {
      const payload = {
        ...data,
        _metadata: {
          ...metadata,
          uploadedAt: new Date(),
          network: '0G Mainnet'
        }
      };

      const buffer = Buffer.from(JSON.stringify(payload));
      const file = new MemData(buffer);
      const [tree, treeErr] = await file.merkleTree();
      
      if (treeErr || !tree) {
        throw new Error(`Failed to generate Merkle Tree: ${treeErr}`);
      }

      const [txHash, uploadErr] = await this.indexer.upload(file, this.rpcUrl, this.signer as any);

      if (uploadErr !== null) {
        throw new Error(`Upload failed: ${uploadErr}`);
      }

      return {
        cid: tree.rootHash(),
        txHash,
        size: file.size(),
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error("0G Storage Artifact Upload Error:", error);
      throw error;
    }
  }

  /**
   * Retrieve an artifact from 0G Storage by CID
   */
  async retrieveArtifact(cid: string) {
    const tempFilePath = path.join(os.tmpdir(), `0g-download-${cid}.json`);
    try {
      // Download from 0G network to temp file
      const err = await this.indexer.download(cid, tempFilePath, true);
      if (err) throw new Error(`Download failed: ${err}`);
      
      const fileContent = await fs.readFile(tempFilePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error("0G Storage Artifact Retrieval Error:", error);
      throw error;
    } finally {
      // Cleanup temp file
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }
}
