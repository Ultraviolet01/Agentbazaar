const { ethers } = require("ethers");

(async () => {
  const rpcUrl = "https://misty-nameless-tent.bsc.quiknode.pro/9b83e8e679030d373648ffc22a70d9ea02f0c119/";
  console.log(`Connecting to RPC: ${rpcUrl}`);
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNum = await provider.getBlockNumber();
    console.log(`Current Block Number: ${blockNum}`);
  } catch (error) {
    console.error("Failed to fetch block number:", error);
  }
})();
