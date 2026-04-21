// /**
//  * web_app_clean/frontend/src/store/systemStore.js
//  *
//  * [FIX]: Khắc phục lỗi mất ảnh tĩnh do xóa scanFrame quá sớm và sai đường dẫn image_url.
//  * [OPTIMIZE]: Chống lag toàn trang bằng cách TÁCH scanFrame ra khỏi state bị re-render.
//  */

// import { create } from "zustand";
// import { devtools } from "zustand/middleware";

// // [VŨ KHÍ CHỐNG LAG] Biến cục bộ nằm ngoài Zustand State.
// // Nó lưu Base64 nhưng KHÔNG kích hoạt React Re-render.
// let rawScanFrame = null;
// const frameListeners = new Set(); // Danh sách các component (CameraFeed) muốn nghe lén frame

// const useSystemStore = create(
//   devtools(
//     (set, get) => ({
//       doorStatus: "locked",
//       alarmActive: false,
//       cameraSnapshot: null,
//       cameraActive: true,
//       latestEvent: null,
//       recentEvents: [],
//       wsConnected: false,
//       alertCount: 0,

//       isScanning: false,
//       scanState: "IDLE",

//       setDoorStatus: (s) => set({ doorStatus: s }),
//       setAlarmActive: (a) =>
//         set({ alarmActive: a, doorStatus: a ? "alarm" : "locked" }),
//       setCameraSnapshot: (u) => set({ cameraSnapshot: u }),
//       setWsConnected: (c) => set({ wsConnected: c }),
//       resetAlertCount: () => set({ alertCount: 0 }),
//       setIsScanning: (v) => set({ isScanning: v }),

//       // [HÀM MỚI] Cho phép Component Camera đăng ký nhận Frame trực tiếp, không qua React State
//       subscribeToFrame: (callback) => {
//         frameListeners.add(callback);
//         return () => frameListeners.delete(callback); // Hàm hủy đăng ký
//       },
      
//       // Hàm tiện ích lấy frame cuối cùng làm ảnh tĩnh
//       getLastFrame: () => rawScanFrame,

//       handleEvent: (msg) => {
//         const { event, data, timestamp } = msg;

//         // ── XỬ LÝ RIÊNG CHO FRAME VIDEO (Chống Lag Siêu Tốc) ──
//         if (event === "scan_frame") {
//           if (data && data.frame_b64) {
//             rawScanFrame = `data:image/jpeg;base64,${data.frame_b64}`;
            
//             // Chỉ cập nhật trạng thái chữ "Đang lấy nét", "Đang quét" nếu nó thay đổi (để giảm lag)
//             if (get().scanState !== data.scan_state) {
//                 set({ scanState: data.scan_state || "SCANNING" });
//             }

//             // Trực tiếp gọi hàm của CameraFeed để nó tự vẽ ảnh (Direct DOM Manipulation)
//             frameListeners.forEach(listener => listener(rawScanFrame));
//           }
//           return; // Thoát ngay, không chạy tiếp xuống dưới
//         }

//         // ── XỬ LÝ LỊCH SỬ SỰ KIỆN ──
//         // ✅ ĐÃ SỬA: Lấy đúng đường dẫn image_url nằm trong payload do Backend trả về
//         const imgUrl = data?.image_url || data?.payload?.image_url || null;

//         const entry = {
//           event,
//           data,
//           timestamp,
//           id: Date.now(),
//           image_url: imgUrl,
//         };

//         if (event !== "face_scan_start" && event !== "face_scan_end") {
//           set((s) => ({
//             latestEvent: entry,
//             recentEvents: [entry, ...s.recentEvents].slice(0, 50),
//           }));
//         }

//         switch (event) {
//           case "door_opened":
//             set({ doorStatus: "open" });
//             break;
//           case "door_closed":
//           case "door_locked":
//             set({ doorStatus: "locked" });
//             break;

//           case "alarm_triggered":
//             set({
//               alarmActive: true,
//               doorStatus: "alarm",
//               alertCount: get().alertCount + 1,
//             });
//             break;
//           case "alarm_stopped":
//             set({ alarmActive: false, doorStatus: "locked" });
//             break;

//           // ── LOGIC CHUYỂN ĐỔI CAMERA ──
//           case "face_scan_start":
//             rawScanFrame = null; // Xóa frame cũ của lần quét trước
//             set({ isScanning: true, scanState: data?.state || "WATCH" });
//             break;

//           case "face_scan_end":
//             // ✅ ĐÃ SỬA: KHÔNG gán rawScanFrame = null ở đây nữa, giữ lại để làm ảnh Instant Snap!
//             set({ isScanning: false, scanState: "IDLE" });
//             break;

//           case "face_recognized":
//           case "face_unknown":
//             set({ isScanning: false, scanState: "IDLE" });

//             // Lấy ảnh Cloudinary (nếu mạng nhanh có ngay), hoặc lấy ảnh Video vừa đóng băng
//             const newSnapshot = imgUrl || rawScanFrame;
//             if (newSnapshot) {
//               set({ cameraSnapshot: newSnapshot });
//             }
//             if (event === "face_unknown") {
//               set({ alertCount: get().alertCount + 1 });
//             }
//             break;

//           case "cloud_upload_ok":
//             // Đã upload xong -> Tráo ảnh tĩnh mờ bằng ảnh Cloudinary nét
//             if (imgUrl) {
//               set({ cameraSnapshot: imgUrl });
//             }
//             break;

//           case "motion_detected":
//           case "door_forced":
//             set({ alertCount: get().alertCount + 1 });
//             if (imgUrl) set({ cameraSnapshot: imgUrl });
//             break;

//           case "system_online":
//             set({ cameraActive: true });
//             break;
//           case "system_offline":
//             set({ cameraActive: false, isScanning: false });
//             break;

//           default:
//             break;
//         }
//       },
//     }),
//     { name: "SystemStore" },
//   ),
// );

// export default useSystemStore;


/**
 * web_app_clean/frontend/src/store/systemStore.js
 *
 * [FIX]: Đọc chính xác tên từ payload.name. Bổ sung bắt sự kiện "access" để cập nhật Camera.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

let rawScanFrame = null;
const frameListeners = new Set();

const useSystemStore = create(
  devtools(
    (set, get) => ({
      doorStatus: "locked",
      alarmActive: false,
      cameraSnapshot: null,
      cameraActive: true,
      latestEvent: null,
      recentEvents: [],
      wsConnected: false,
      alertCount: 0,

      isScanning: false,
      scanState: "IDLE",

      setDoorStatus: (s) => set({ doorStatus: s }),
      setAlarmActive: (a) =>
        set({ alarmActive: a, doorStatus: a ? "alarm" : "locked" }),
      setCameraSnapshot: (u) => set({ cameraSnapshot: u }),
      setWsConnected: (c) => set({ wsConnected: c }),
      resetAlertCount: () => set({ alertCount: 0 }),
      setIsScanning: (v) => set({ isScanning: v }),

      subscribeToFrame: (callback) => {
        frameListeners.add(callback);
        return () => frameListeners.delete(callback);
      },
      
      getLastFrame: () => rawScanFrame,

      handleEvent: (msg) => {
        const { event, data, timestamp } = msg;

        if (event === "scan_frame") {
          if (data && data.frame_b64) {
            rawScanFrame = `data:image/jpeg;base64,${data.frame_b64}`;
            if (get().scanState !== data.scan_state) {
                set({ scanState: data.scan_state || "SCANNING" });
            }
            frameListeners.forEach(listener => listener(rawScanFrame));
          }
          return; 
        }

        const imgUrl = data?.image_url || data?.payload?.image_url || null;
        
        // ✅ ĐÃ FIX: Móc chính xác cái tên từ trong cái túi payload ra
        const personName = data?.payload?.name || data?.name || "Khách lạ";

        const entry = {
          event,
          data,
          timestamp,
          id: Date.now(),
          image_url: imgUrl,
          person_name: personName, // Lưu vào đây để CameraFeed đọc được
        };

        if (event !== "face_scan_start" && event !== "face_scan_end") {
          set((s) => ({
            latestEvent: entry,
            recentEvents: [entry, ...s.recentEvents].slice(0, 50),
          }));
        }

        switch (event) {
          case "door_opened":
            set({ doorStatus: "open" });
            break;
          case "door_closed":
          case "door_locked":
            set({ doorStatus: "locked" });
            break;

          case "alarm_triggered":
            set({
              alarmActive: true,
              doorStatus: "alarm",
              alertCount: get().alertCount + 1,
            });
            break;
          case "alarm_stopped":
            set({ alarmActive: false, doorStatus: "locked" });
            break;

          case "face_scan_start":
            rawScanFrame = null; 
            set({ isScanning: true, scanState: data?.state || "WATCH" });
            break;

          case "face_scan_end":
            set({ isScanning: false, scanState: "IDLE" });
            break;

          // ✅ ĐÃ FIX: Hỗ trợ xử lý sự kiện "access" để nó cập nhật ảnh và tên lên Camera
          case "access":
          case "face_recognized":
          case "face_unknown":
            set({ isScanning: false, scanState: "IDLE" });

            const newSnapshot = imgUrl || rawScanFrame;
            if (newSnapshot) {
              set({ cameraSnapshot: newSnapshot });
            }
            
            // Nếu quét xịt, tăng bộ đếm cảnh báo
            const isFail = event === "face_unknown" || (event === "access" && data?.payload?.success === false);
            if (isFail) {
              set({ alertCount: get().alertCount + 1 });
            }
            break;

          case "cloud_upload_ok":
            if (imgUrl) {
              set({ cameraSnapshot: imgUrl });
            }
            break;

          case "motion_detected":
          case "door_forced":
            set({ alertCount: get().alertCount + 1 });
            if (imgUrl) set({ cameraSnapshot: imgUrl });
            break;

          case "system_online":
            set({ cameraActive: true });
            break;
          case "system_offline":
            set({ cameraActive: false, isScanning: false });
            break;

          default:
            break;
        }
      },
    }),
    { name: "SystemStore" },
  ),
);

export default useSystemStore;