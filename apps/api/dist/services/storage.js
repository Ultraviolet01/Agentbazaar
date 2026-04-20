"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
const ethers_1 = require("ethers");
class StorageService {
    constructor() {
        this.rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-mainnet-1.0g.ai';
        const indexerUrl = process.env.OG_INDEXER_URL || 'https://indexer-storage-mainnet-standard.0g.ai';
        const privateKey = process.env.OG_PRIVATE_KEY || '';
        if (!privateKey) {
            console.warn("OG_PRIVATE_KEY not found in environment. 0G Storage operations will fail.");
        }
        const provider = new ethers_1.ethers.JsonRpcProvider(this.rpcUrl);
        this.signer = new ethers_1.ethers.Wallet(privateKey || ethers_1.ethers.ZeroAddress, provider);
        this.indexer = new _0g_ts_sdk_1.Indexer(indexerUrl);
    }
    /**
     * Upload an artifact (JSON/Buffer) to 0G Storage
     */
    async uploadArtifact(data, metadata = {}) {
        try {
            // Add metadata to the data object
            const payload = {
                ...data,
                _metadata: {
                    ...metadata,
                    uploadedAt: new Date(),
                    network: '0G Mainnet'
                }
            };
            // Convert data to file
            const file = new _0g_ts_sdk_1.ZgFile(Buffer.from(JSON.stringify(payload)));
            // Upload to 0G network
            const [tree, err] = await file.merkleTree();
            if (err)
                throw new Error(`Failed to generate Merkle Tree: ${err}`);
            const [txHash, uploadErr] = await this.indexer.upload(file, 0, this.signer);
            await file.close();
            if (uploadErr !== null) {
                throw new Error(`Upload failed: ${uploadErr}`);
            }
            return {
                cid: tree.rootHash(),
                txHash,
                size: file.size(),
                uploadedAt: new Date()
            };
        }
        catch (error) {
            console.error("0G Storage Artifact Upload Error:", error);
            throw error;
        }
    }
    /**
     * Retrieve an artifact from 0G Storage by CID
     */
    async retrieveArtifact(cid) {
        try {
            // Download from 0G network
            const data = await this.indexer.download(cid);
            if (!data)
                throw new Error("Artifact not found or failed to download");
            return JSON.parse(data.toString());
        }
        catch (error) {
            console.error("0G Storage Artifact Retrieval Error:", error);
            throw error;
        }
    }
    /**
     * Simple data upload (for backwards compatibility)
     */
    async uploadData(filePath) {
        try {
            const file = await _0g_ts_sdk_1.ZgFile.fromFilePath(filePath);
            const [tx, err] = await this.indexer.upload(file, 0, this.signer);
            await file.close();
            if (err !== null)
                throw new Error(`Upload failed: ${err}`);
            return tx;
        }
        catch (error) {
            console.error("0G Storage Data Upload Error:", error);
            throw error;
        }
    }
}
exports.StorageService = StorageService;
