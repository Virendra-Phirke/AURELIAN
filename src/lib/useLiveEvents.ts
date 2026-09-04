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

    let consecutiveErrors = 0;

    function connect() {
      if (isDisposed) return;
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          consecutiveErrors = 0;
        };

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
            consecutiveErrors++;
            // If the endpoint is unavailable (e.g. preview server or offline), don't spam reconnects
            if (consecutiveErrors > 3) return;
            const delay = Math.min(3000 * Math.pow(2, consecutiveErrors - 1), 30000);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
      } catch {}
    }

    const initialTimer = setTimeout(connect, 3500);

    return () => {
      isDisposed = true;
      clearTimeout(initialTimer);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);
}
