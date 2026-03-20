// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     // ✅ MỞ RỘNG: Cho phép các thiết bị khác trong mạng LAN truy cập vào giao diện Web
//     host: "0.0.0.0",
//     proxy: {
//       // Chuyển hướng các cuộc gọi API sang FastAPI
//       "/api": {
//         target: "http://127.0.0.1:8000", // ✅ Sử dụng IP rõ ràng thay cho localhost
//         changeOrigin: true,
//         secure: false,
//         // Hỗ trợ debug: Xem các request bị lỗi trên Terminal của Vite
//         configure: (proxy, _options) => {
//           proxy.on("error", (err, _req, _res) => {
//             console.log("proxy error", err);
//           });
//         },
//       },
//       // Chuyển hướng kết nối WebSocket
//       "/ws": {
//         target: "ws://127.0.0.1:8000", // ✅ Sử dụng IP rõ ràng
//         ws: true,
//         changeOrigin: true,
//       },
//     },
//   },
//   build: {
//     outDir: "dist",
//     sourcemap: false,
//     rollupOptions: {
//       output: {
//         // Chia nhỏ chunk để tối ưu bộ nhớ đệm (Caching)
//         manualChunks: {
//           vendor: ["react", "react-dom", "react-router-dom"],
//           charts: ["recharts"],
//           query: ["@tanstack/react-query"],
//         },
//       },
//     },
//   },
// });

/**
 * vite.config.js
 *
 * Mục đích: Cấu hình Vite Dev Server cho Frontend (React).
 *
 * VẤN ĐỀ CŨ:
 *   - Không có proxy nào được cấu hình → tất cả request /api/* và WebSocket /ws/*
 *     sẽ bị trình duyệt block bởi CORS hoặc gửi nhầm sang chính port 5173.
 *   - WebSocket ws://... không được upgrade → lỗi 1006.
 *
 * GIẢI PHÁP:
 *   - Proxy /api  → http://192.168.137.1:8000  (Backend FastAPI trên Windows PC)
 *   - Proxy /ws   → ws://192.168.137.1:8000    (WebSocket cũng đến FastAPI)
 *   - Khi build production, Nginx sẽ đảm nhận vai trò này (xem nginx.conf).
 *
 * KIẾN TRÚC MẠNG:
 *   Windows PC (Server): IP 192.168.137.1
 *     - Frontend Vite: port 5173
 *     - Backend FastAPI: port 8000
 *   Raspberry Pi 4 (Hardware): IP 192.168.137.2
 *     - Local API Server: port 5000
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    // Bind ra tất cả interfaces để Pi cũng có thể truy cập trang web nếu cần
    host: "0.0.0.0",
    port: 5173,

    proxy: {
      // ── REST API ──────────────────────────────────────────────────────────
      // Mọi request /api/* từ React sẽ được forward tới FastAPI backend
      "/api": {
        target: "http://192.168.137.1:8000",
        changeOrigin: true,
        // KHÔNG rewrite path — FastAPI mount router với prefix /api
      },

      // ── WebSocket ─────────────────────────────────────────────────────────
      // Kết nối ws://192.168.137.1:5173/ws/dashboard sẽ được proxy sang
      // ws://192.168.137.1:8000/ws/dashboard → giải quyết lỗi WS 1006
      "/ws": {
        target: "http://192.168.137.1:8000",
        changeOrigin: true,
        ws: true, // ← BẮT BUỘC để upgrade connection sang WebSocket
      },
    },
  },
});
