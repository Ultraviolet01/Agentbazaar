export declare class MonitoringEngine {
    private static jobs;
    /**
     * Initializes all active monitoring configurations on startup
     */
    static init(): Promise<void>;
    /**
     * Schedules or updates a monitoring job for a specific project
     */
    static scheduleMonitoring(projectId: string): Promise<void>;
    /**
     * Core execution loop for a monitoring check
     */
    private static performMonitoringCheck;
    private static calculateNextRun;
    static stopMonitoring(projectId: string): void;
}
//# sourceMappingURL=monitoring.engine.d.ts.map