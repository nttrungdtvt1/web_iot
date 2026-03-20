// /**
//  * hooks/useWebSocket.js
//  * WebSocket hook for /ws/dashboard.
//  * Tự động nhận diện host/port để tận dụng tối đa Vite Proxy.
//  */

// import { useEffect, useRef, useCallback } from "react";
// import useSystemStore from "../store/systemStore";

// // ✅ ĐÃ SỬA LỖI: Dùng window.location.host (bao gồm cả IP và Port của Frontend: 5173)
// // Việc này giúp WebSocket đi qua Vite Proxy, giải quyết triệt để lỗi 1006.
// // Thay toàn bộ hàm getSocketUrl cũ bằng đoạn này:
// const getSocketUrl = () => {
//   // Lấy cả IP VÀ CỔNG hiện tại của trình duyệt (ví dụ: 192.168.137.1:5173)
//   const host = window.location.host;
//   const protocol = window.location.protocol === "https:" ? "wss" : "ws";
//   // Đường dẫn tương đối, Vite sẽ tự proxy ngầm sang cổng 8000
//   return `${protocol}://${host}/ws/dashboard`;
// };

// const RECONNECT_DELAY_MS = 3000;
// const MAX_RECONNECT_ATTEMPTS = 10;
// const PING_INTERVAL_MS = 30000;

// export function useWebSocket() {
//   const wsRef = useRef(null);
//   const reconnectTimer = useRef(null);
//   const pingTimer = useRef(null);
//   const reconnectAttempts = useRef(0);
//   const manualClose = useRef(false);

//   const { handleEvent, setWsConnected } = useSystemStore();

//   const getToken = () => localStorage.getItem("access_token");

//   const sendPing = useCallback(() => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ type: "ping" }));
//     }
//   }, []);

//   const connect = useCallback(() => {
//     const token = getToken();
//     if (!token) {
//       console.warn("[WS] No token available — skipping connection");
//       return;
//     }

//     const baseUrl = getSocketUrl();
//     const url = `${baseUrl}?token=${encodeURIComponent(token)}`;

//     console.info("[WS] Connecting to", baseUrl);

//     const ws = new WebSocket(url);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       console.info("[WS] Connected successfully!");
//       setWsConnected(true);
//       reconnectAttempts.current = 0;

//       if (pingTimer.current) clearInterval(pingTimer.current);
//       pingTimer.current = setInterval(sendPing, PING_INTERVAL_MS);
//     };

//     ws.onmessage = (event) => {
//       try {
//         const message = JSON.parse(event.data);
//         if (message.event === "pong" || message.type === "pong") return;

//         handleEvent(message);
//       } catch (err) {
//         console.error("[WS] Failed to parse message:", err);
//       }
//     };

//     ws.onerror = (err) => {
//       console.error("[WS] WebSocket Error:", err);
//     };

//     ws.onclose = (event) => {
//       console.info(`[WS] Closed (code: ${event.code})`);
//       setWsConnected(false);
//       clearInterval(pingTimer.current);

//       if (!manualClose.current) {
//         scheduleReconnect();
//       }
//     };
//   }, [handleEvent, setWsConnected, sendPing]);

//   const scheduleReconnect = useCallback(() => {
//     if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
//       console.warn("[WS] Max reconnect attempts reached. Please refresh page.");
//       return;
//     }

//     const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts.current);
//     reconnectAttempts.current += 1;

//     console.info(`[WS] Reconnecting in ${Math.round(delay / 1000)}s...`);
//     reconnectTimer.current = setTimeout(connect, delay);
//   }, [connect]);

//   const disconnect = useCallback(() => {
//     manualClose.current = true;
//     clearTimeout(reconnectTimer.current);
//     clearInterval(pingTimer.current);
//     wsRef.current?.close();
//   }, []);

//   useEffect(() => {
//     manualClose.current = false;
//     connect();

//     return () => {
//       disconnect();
//     };
//   }, [connect, disconnect]);

//   return { disconnect, reconnect: connect };
// }

/**
 * hooks/useWebSocket.js
 *
 * Mục đích: Hook WebSocket cho dashboard — kết nối /ws/dashboard, tự động
 *           reconnect, xác thực JWT, gửi heartbeat ping.
 *
 * VẤN ĐỀ CŨ (gây lỗi WS 1006):
 *   - Kết nối thẳng ws://192.168.137.1:8000/ws/dashboard → browser chặn CORS
 *     vì origin khác (5173 ≠ 8000) và FastAPI không upgrade được WebSocket
 *     qua proxy thủ công.
 *
 * GIẢI PHÁP:
 *   - Dùng window.location.host (= "192.168.137.1:5173") để tạo URL.
 *   - Vite proxy (cấu hình trong vite.config.js) sẽ tự upgrade
 *     ws://192.168.137.1:5173/ws/... → ws://192.168.137.1:8000/ws/...
 *   - Không còn cross-origin, không còn lỗi 1006.
 *
 * KIẾN TRÚC:
 *   Browser → ws://192.168.137.1:5173/ws/dashboard?token=...
 *           ↓ Vite Proxy (ws: true)
 *   FastAPI → ws://192.168.137.1:8000/ws/dashboard?token=...
 */

import { useEffect, useRef, useCallback } from "react";
import useSystemStore from "../store/systemStore";

/**
 * Tạo WebSocket URL dựa trên host hiện tại của trình duyệt.
 * Kết hợp với proxy trong vite.config.js → không còn CORS / lỗi 1006.
 */
const getSocketUrl = () => {
  // window.location.host = "192.168.137.1:5173"  (bao gồm cả port Vite)
  const host = window.location.host;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  // Vite sẽ proxy /ws → backend:8000 (xem vite.config.js)
  return `${protocol}://${host}/ws/dashboard`;
};

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS = 30000;

export function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const manualClose = useRef(false);

  const { handleEvent, setWsConnected } = useSystemStore();

  const getToken = () => localStorage.getItem("access_token");

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "ping" }));
    }
  }, []);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) {
      console.warn("[WS] No token — skipping connection");
      return;
    }

    const baseUrl = getSocketUrl();
    const url = `${baseUrl}?token=${encodeURIComponent(token)}`;
    console.info("[WS] Connecting to", baseUrl);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.info("[WS] Connected!");
      setWsConnected(true);
      reconnectAttempts.current = 0;

      if (pingTimer.current) clearInterval(pingTimer.current);
      pingTimer.current = setInterval(sendPing, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.event === "pong" || message.type === "pong") return;
        handleEvent(message);
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    ws.onclose = (event) => {
      console.info(`[WS] Closed (code: ${event.code})`);
      setWsConnected(false);
      clearInterval(pingTimer.current);
      if (!manualClose.current) scheduleReconnect();
    };
  }, [handleEvent, setWsConnected, sendPing]); // eslint-disable-line

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("[WS] Max reconnect attempts reached. Please refresh.");
      return;
    }
    const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts.current);
    reconnectAttempts.current += 1;
    console.info(`[WS] Reconnecting in ${Math.round(delay / 1000)}s…`);
    reconnectTimer.current = setTimeout(connect, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    manualClose.current = true;
    clearTimeout(reconnectTimer.current);
    clearInterval(pingTimer.current);
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    manualClose.current = false;
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, reconnect: connect };
}
