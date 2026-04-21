/**
 * api/apiClient.js
 *
 * Mục đích: Axios instance đã được cấu hình sẵn để gọi Backend FastAPI.
 *
 * THIẾT KẾ:
 *   - baseURL = "/api"  → URL tương đối, Vite proxy sẽ tự forward tới
 *     http://192.168.137.1:8000/api/* trong môi trường dev.
 *   - Tự động đính kèm JWT Bearer token từ localStorage vào mọi request.
 *   - Redirect sang /login nếu server trả về 401.
 *
 * LƯU Ý:
 *   - KHÔNG hard-code IP backend ở đây. Mọi cấu hình host đều nằm trong
 *     vite.config.js (dev) hoặc nginx.conf (production).
 */

import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // tương đối → đi qua Vite proxy → 192.168.137.1:8000
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// Gắn JWT vào mọi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý 401 → redirect login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ── Resident API helpers ───────────────────────────────────────────────────────

/**
 * enrollResidentFaceFromDashboard
 *
 * Gọi endpoint POST /residents/{residentId}/enroll-face-from-dashboard.
 * Gửi mảng ảnh Base64 chụp từ webcam trình duyệt lên Backend để xử lý
 * face encoding, upload ảnh đại diện và cập nhật DB.
 *
 * @param {number|string} residentId  - ID của cư dân cần đăng ký khuôn mặt.
 * @param {{ images: string[] }} imageData
 *   - images: Mảng chuỗi Base64 Data URL (dạng "data:image/jpeg;base64,...").
 * @returns {Promise<object>} ResidentResponse từ server.
 *
 * Ví dụ:
 *   const resident = await enrollResidentFaceFromDashboard(42, {
 *     images: ["data:image/jpeg;base64,/9j/...", ...]
 *   });
 */
export const enrollResidentFaceFromDashboard = (residentId, imageData) =>
  apiClient
    .post(`/residents/${residentId}/enroll-face-from-dashboard`, imageData)
    .then((r) => r.data);

export default apiClient;
