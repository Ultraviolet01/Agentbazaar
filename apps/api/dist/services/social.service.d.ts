/**
 * Simulated Social Activity API for Twitter/X spikes
 */
export declare class SimulatedSocialService {
    static getProjectActivity(handle: string): Promise<{
        platform: string;
        handle: string;
        metrics: {
            mentions: number;
            sentiment: number;
            activeDiscussions: number;
            isSpike: boolean;
            spikeFactor: string | null;
            timestamp: string;
        };
    }>;
}
//# sourceMappingURL=social.service.d.ts.map