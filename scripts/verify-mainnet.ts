import { config } from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';

// Load .env from root
config({ path: path.join(__dirname, '../.env') });

async function verifyMainnetConfig() {
  console.log('--- AgentBazaar 0G Mainnet Migration Verification ---\n');
  
  const rpcUrl = process.env.OG_RPC_URL;
  const indexerUrl = process.env.OG_INDEXER_URL;
  const network = process.env.OG_NETWORK;

  const checks = [
    {
      name: 'Network Name',
      pass: network === 'mainnet',
      expected: 'mainnet',
      actual: network
    },
    {
      name: 'RPC Endpoint (Mainnet)',
      pass: rpcUrl?.includes('mainnet-1.0g.ai'),
      expected: 'https://evmrpc-mainnet-1.0g.ai',
      actual: rpcUrl
    },
    {
      name: 'Indexer Endpoint (Mainnet)',
      pass: indexerUrl?.includes('indexer-storage-mainnet-standard.0g.ai'),
      expected: 'https://indexer-storage-mainnet-standard.0g.ai',
      actual: indexerUrl
    }
  ];

  let anyFailed = false;

  for (const check of checks) {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}:`);
    console.log(`   Actual:   ${check.actual}`);
    console.log(`   Expected: ${check.expected}\n`);
    if (!check.pass) anyFailed = true;
  }

  if (rpcUrl) {
    try {
      console.log('Testing RPC Connectivity...');
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const network = await provider.getNetwork();
      console.log(`✅ Connected! Chain ID from provider: ${network.chainId}`);
      if (network.chainId !== BigInt(16600)) {
        console.log(`❌ Chain ID mismatch from provider! Expected 16600, got ${network.chainId}`);
        anyFailed = true;
      }
    } catch (err) {
      console.log(`❌ Failed to connect to RPC: ${err}`);
      anyFailed = true;
    }
  }

  if (anyFailed) {
    console.log('\n⚠️  Verification failed. Please check your configuration.');
    process.exit(1);
  } else {
    console.log('\n🎉 All checks passed! The migration to 0G Mainnet is configured correctly.');
  }
}

verifyMainnetConfig();
