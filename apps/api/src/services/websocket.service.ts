import Pusher from "pusher";

let pusher: Pusher;

/**
 * Initializes Pusher with environment variables.
 * In a serverless environment, this is called on demand.
 */
export const initSocket = () => {
  if (!pusher) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusher;
};

export const getIO = () => {
  if (!pusher) {
    initSocket();
  }
  return pusher;
};

/**
 * Broadcasts an alert to a specific project channel using Pusher.
 */
export const broadcastAlert = async (projectId: string, alert: any) => {
  const p = getIO();
  try {
    await p.trigger(`project_${projectId}`, "newAlert", alert);
    console.log(`📡 Pusher alert broadcasted for project ${projectId}`);
  } catch (error) {
    console.error("❌ Pusher broadcast failed:", error);
  }
};
