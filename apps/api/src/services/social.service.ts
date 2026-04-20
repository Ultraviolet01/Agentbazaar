/**
 * Simulated Social Activity API for Twitter/X spikes
 */
export class SimulatedSocialService {
  static async getProjectActivity(handle: string) {
    // Simulated data with potential spikes
    const isSpike = Math.random() > 0.85;
    const baseVolume = 10 + Math.floor(Math.random() * 50);
    const spikeFactor = isSpike ? (2 + Math.random() * 5) : 1;

    return {
      platform: "Twitter/X",
      handle: handle || "agent_bazaar",
      metrics: {
        mentions: Math.floor(baseVolume * spikeFactor),
        sentiment: 0.6 + (Math.random() * 0.4), // 0.6 to 1.0
        activeDiscussions: Math.floor((baseVolume / 5) * spikeFactor),
        isSpike,
        spikeFactor: isSpike ? spikeFactor.toFixed(2) : null,
        timestamp: new Date().toISOString()
      }
    };
  }
}
