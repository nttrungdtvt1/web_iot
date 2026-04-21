/**
 * vite.config.js
 *
 * CẤU HÌNH TỐI ƯU HÓA:
 * - basicSsl(): Bật HTTPS để cho phép trình duyệt truy cập Webcam cục bộ.
 * - loadEnv(): Tự động load IP động (hoặc mDNS) từ file .env.
 * - proxy: Điều hướng API và WebSocket vào Backend, điều hướng luồng Video vào Pi.
 */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  // Tải các biến môi trường từ file .env (nếu có) ở thư mục frontend
  const env = loadEnv(mode, process.cwd(), "");

  // Lấy IP/Hostname của Pi. Mặc định dùng IP cũ, nhưng khuyến khích
  // điền VITE_PI_IP=raspberrypi.local trong file .env để tự động hóa hoàn toàn.
  const piHost = env.VITE_PI_IP || "192.168.137.2";

  return {
    plugins: [
      react(),
      basicSsl(), // Bật HTTPS tự ký (Self-signed)
    ],

    server: {
      host: "0.0.0.0", // Lắng nghe trên mọi IP LAN (để điện thoại quét được)
      port: 5173,
      https: true, // Bắt buộc đi kèm basicSsl

      proxy: {
        // ── 1. REST API (Nói chuyện với FastAPI Backend trên PC) ──────────────
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },

        // ── 2. WEBSOCKET (Nhận sự kiện Real-time từ Backend) ──────────────────
        "/ws": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          ws: true,
        },

        // ── 3. CAMERA STREAM (Lấy luồng MJPEG trực tiếp từ Raspberry Pi) ──────
        // Tính năng này giải quyết 100% lỗi Mixed Content (HTTPS -> HTTP)
        "/stream": {
          target: `http://${piHost}:5000`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/stream/, ""), // Cắt tiền tố /stream trước khi gửi xuống Pi
        },
      },
    },
  };
});