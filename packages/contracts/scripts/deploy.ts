import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment of AgentBazaarRegistry to 0G Mainnet...");

  // Get the default deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying from account: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} 0G`);

  if (balance === 0n) {
    throw new Error("❌ Insufficient balance to deploy on 0G Mainnet. Please ensure your deployer address has 0G tokens.");
  }

  // Deploy the contract
  const AgentBazaarRegistry = await ethers.getContractFactory("AgentBazaarRegistry");
  const registry = await AgentBazaarRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`\n✅ AgentBazaarRegistry deployed to: ${address}`);
  console.log(`🔗 View on Explorer: https://chainscan.0g.ai/address/${address}`);

  console.log("\nNext steps:");
  console.log("1. Run verification:");
  console.log(`   npx hardhat verify --network mainnet ${address}`);
  console.log("2. Update your .env file with:");
  console.log(`   OG_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
