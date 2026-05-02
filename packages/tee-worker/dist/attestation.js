"use strict";
/**
 * TEE Worker — Attestation Module
 *
 * Generates cryptographic proofs that agent execution
 * happened inside a genuine TEE enclave.
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
exports.generateAttestation = generateAttestation;
exports.verifyAttestationBasic = verifyAttestationBasic;
const node_crypto_1 = __importDefault(require("node:crypto"));
/**
 * Generate a TEE attestation proof for an agent run.
 *
 * On real TEE hardware (Phala Cloud), this generates a TDX quote.
 * On dev/simulator, it generates a signed hash stub.
 */
async function generateAttestation(agentId, inputHash, outputHash) {
    const reportData = JSON.stringify({
        agentId,
        inputHash,
        outputHash,
        timestamp: Date.now(),
    });
    const dataHash = node_crypto_1.default.createHash('sha256').update(reportData).digest('hex');
    // Try real TEE attestation via dstack
    try {
        const { TappdClient } = await Promise.resolve().then(() => __importStar(require('@phala/dstack-sdk')));
        const client = new TappdClient();
        // Generate a TDX quote
        const quoteData = await client.tdxQuote(reportData);
        const quote = quoteData.quote;
        return {
            isRealTEE: true,
            quote: typeof quote === 'string' ? quote : JSON.stringify(quote),
            timestamp: Date.now(),
            dataHash,
            provider: 'phala-dstack-tdx',
        };
    }
    catch (error) {
        // Dev mode: generate a signed hash as a stub
        console.warn('[Attestation] dstack not available, generating dev stub');
        const stubQuote = node_crypto_1.default
            .createHash('sha256')
            .update(`dev-attestation:${reportData}`)
            .digest('hex');
        return {
            isRealTEE: false,
            quote: stubQuote,
            timestamp: Date.now(),
            dataHash,
            provider: 'dev-simulator',
        };
    }
}
/**
 * Verify an attestation proof (basic check)
 */
function verifyAttestationBasic(proof) {
    // Basic validity checks
    if (!proof.quote || !proof.dataHash || !proof.timestamp)
        return false;
    // Check timestamp is within 1 hour
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - proof.timestamp > oneHour)
        return false;
    return true;
}
//# sourceMappingURL=attestation.js.map