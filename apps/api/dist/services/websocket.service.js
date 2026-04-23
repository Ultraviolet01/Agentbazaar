"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastAlert = exports.getIO = exports.initSocket = void 0;
const pusher_1 = __importDefault(require("pusher"));
let pusher;
/**
 * Initializes Pusher with environment variables.
 * In a serverless environment, this is called on demand.
 */
const initSocket = () => {
    if (!pusher) {
        pusher = new pusher_1.default({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.PUSHER_CLUSTER,
            useTLS: true,
        });
    }
    return pusher;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!pusher) {
        (0, exports.initSocket)();
    }
    return pusher;
};
exports.getIO = getIO;
/**
 * Broadcasts an alert to a specific project channel using Pusher.
 */
const broadcastAlert = async (projectId, alert) => {
    const p = (0, exports.getIO)();
    try {
        await p.trigger(`project_${projectId}`, "newAlert", alert);
        console.log(`📡 Pusher alert broadcasted for project ${projectId}`);
    }
    catch (error) {
        console.error("❌ Pusher broadcast failed:", error);
    }
};
exports.broadcastAlert = broadcastAlert;
