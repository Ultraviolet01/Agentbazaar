export declare class StorageService {
    private indexer;
    private signer;
    private rpcUrl;
    constructor();
    /**
     * Upload an artifact (JSON/Buffer) to 0G Storage
     */
    uploadArtifact(data: any, metadata?: any): Promise<{
        cid: string | null;
        txHash: string;
        size: number;
        uploadedAt: Date;
    }>;
    /**
     * Retrieve an artifact from 0G Storage by CID
     */
    retrieveArtifact(cid: string): Promise<any>;
    /**
     * Simple data upload (for backwards compatibility)
     */
    uploadData(filePath: string): Promise<string>;
}
//# sourceMappingURL=storage.d.ts.map