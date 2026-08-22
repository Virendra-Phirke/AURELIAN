import { useEffect, useRef } from 'react';

type EventCallback = (payload?: any) => void;

/**
 * High-performance real-time Server-Sent Events (SSE) hook.
 * Replaces heavy database polling with instant server push triggers.
 * Database is queried ONLY when an admin actually adds/modifies a service or setting.
 */
export function useLiveEvents(listeners: Record<string, EventCallback>) {
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data?.event && listenersRef.current[data.event]) {
              listenersRef.current[data.event](data.payload);
            }
          } catch {}
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch {}
    }

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);
}
