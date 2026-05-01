import { config } from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { Indexer, MemData } from '@0glabs/0g-ts-sdk';

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

  async uploadArtifact(data: any, metadata: any = {}) {
    const payload = { ...data, _metadata: { ...metadata, uploadedAt: new Date(), network: '0G Mainnet' } };
    const buffer = Buffer.from(JSON.stringify(payload));
    const file = new MemData(buffer);
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr || !tree) throw new Error(`Failed to generate Merkle Tree: ${treeErr}`);
    const [txHash, uploadErr] = await this.indexer.upload(file, this.rpcUrl, this.signer as any);
    if (uploadErr !== null) throw new Error(`Upload failed: ${uploadErr}`);
    return { cid: tree.rootHash(), txHash, size: file.size(), uploadedAt: new Date() };
  }
}

// Load .env from root
config({ path: path.join(process.cwd(), '.env') });

async function testStorage() {
  console.log('--- AgentBazaar 0G Storage Anchoring Test ---\n');

  const rpcUrl = process.env.OG_RPC_URL;
  const indexerUrl = process.env.OG_INDEXER_URL;

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Indexer: ${indexerUrl}\n`);

  try {
    const storage = new StorageService();
    
    console.log('Testing 0G Storage Upload (Small Metadata)...');
    const testData = { test: 'Deployment Verification', timestamp: new Date().toISOString() };
    const result = await storage.uploadArtifact(testData, { type: 'test' });
    
    console.log('✅ Upload Successful!');
    console.log(`   CID (Root Hash): ${result.cid}`);
    console.log(`   Transaction: ${result.txHash}`);
    
    console.log('\n🎉 0G Storage Anchoring is working correctly!');
  } catch (err: any) {
    console.error('\n❌ 0G Storage test failed:', err.message || err);
    process.exit(1);
  }
}

testStorage();
