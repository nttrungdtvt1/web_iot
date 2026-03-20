// /**
//  * api/apiClient.js
//  * Configured Axios instance with JWT interceptor.
//  * Automatically attaches Bearer token to all requests.
//  * Redirects to /login on 401 Unauthorized.
//  */

// import axios from "axios";

// const BASE_URL = "/api";

// const apiClient = axios.create({
//   baseURL: BASE_URL,
//   timeout: 30000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // ─── Request interceptor: attach JWT ─────────────────────────────────────────
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("access_token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error),
// );

// // ─── Response interceptor: handle auth errors ────────────────────────────────
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Token expired or invalid — clear storage and redirect to login
//       localStorage.removeItem("access_token");
//       localStorage.removeItem("user");
//       if (window.location.pathname !== "/login") {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   },
// );

// export default apiClient;

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
  timeout: 30000,
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

export default apiClient;
