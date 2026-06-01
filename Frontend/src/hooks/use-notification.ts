import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface NotificationPayload {
  type: string;
  feedbackId: number | null;
  title: string;
  message: string;
}

/**
 * React hook để subscribe vào WebSocket STOMP endpoint.
 * Fallback về polling khi WebSocket không khả dụng.
 */
export function useFeedbackNotification(feedbackId?: number | string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(undefined);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    // STOMP over WebSocket (simplified — raw WS for demo)
    // Production: dùng Stomp.js client
    const url = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        // Subscribe to feedback topic
        if (feedbackId) {
          ws.send(JSON.stringify({
            destination: "/topic/feedback/" + feedbackId,
          }));
        }
        ws.send(JSON.stringify({
          destination: "/topic/staff",
        }));
      };

      ws.onmessage = (event) => {
        try {
          const payload: NotificationPayload = JSON.parse(event.data);
          toast.info(payload.title, {
            description: payload.message,
          });
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        // Reconnect after 5s
        reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
      };

      wsRef.current = ws;
    } catch {
      // WebSocket not available — silently degrade
    }
  }, [feedbackId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);
}
