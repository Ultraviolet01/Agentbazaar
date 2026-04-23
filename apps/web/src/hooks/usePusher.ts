import { useEffect } from 'react';
import Pusher from 'pusher-js';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY!;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

export const usePusher = (channelName: string, eventName: string, onEvent: (data: any) => void) => {
  useEffect(() => {
    if (!pusherKey) return;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe(channelName);
    channel.bind(eventName, (data: any) => {
      onEvent(data);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [channelName, eventName, onEvent]);
};
