// import React, { useState, useEffect } from "react";
// import {
//   Camera,
//   Radio,
//   Image as ImageIcon,
//   RefreshCw,
//   AlertCircle,
// } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import useSystemStore from "../store/systemStore.js";

// const CameraFeed = ({ className = "" }) => {
//   const PI_IP = import.meta.env.VITE_PI_IP || window.location.hostname;
//   const LIVE_STREAM_URL = `http://192.168.137.2:5000/video_feed`;

//   const { latestEvent, cameraActive } = useSystemStore();

//   const [viewMode, setViewMode] = useState("live");
//   const [isImgLoading, setIsImgLoading] = useState(true);
//   const [hasError, setHasError] = useState(false);
//   const [refreshKey, setRefreshKey] = useState(0);

//   // VÁ LỖI SỐ 1: State giữ chặt ảnh Snapshot để không bị mất
//   const [savedSnap, setSavedSnap] = useState(null);
//   const [savedSnapTime, setSavedSnapTime] = useState(null);

//   useEffect(() => {
//     if (latestEvent?.image_url) {
//       setSavedSnap(latestEvent.image_url);
//       setSavedSnapTime(latestEvent.timestamp);
//     }
//   }, [latestEvent]);

//   const lastSnapTimeFormatted = savedSnapTime
//     ? formatDistanceToNow(new Date(savedSnapTime), { addSuffix: true })
//     : null;

//   const handleToggleMode = (mode) => {
//     setIsImgLoading(true);
//     setHasError(false);
//     setViewMode(mode);
//   };

//   const handleManualRefresh = () => {
//     setIsImgLoading(true);
//     setHasError(false);
//     setRefreshKey((prev) => prev + 1);
//   };

//   if (!cameraActive) {
//     return (
//       <div
//         className={`flex flex-col items-center justify-center h-72 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-200 ${className}`}
//       >
//         <Camera size={40} className="text-stone-300 mb-2" />
//         <p className="text-stone-500 font-bold text-sm">
//           CAMERA SYSTEM OFFLINE
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className={`bg-white p-5 rounded-2xl shadow-sm border border-stone-100 ${className}`}
//     >
//       <div className="flex items-center justify-between mb-5">
//         <div className="flex items-center gap-2">
//           <div className="p-2 bg-stone-50 rounded-xl">
//             <Camera size={18} className="text-stone-500" />
//           </div>
//           <h2 className="font-bold text-stone-800 text-sm tracking-tight uppercase">
//             Mắt thần
//           </h2>
//         </div>

//         <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/50">
//           <button
//             onClick={() => handleToggleMode("live")}
//             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
//               viewMode === "live"
//                 ? "bg-white text-red-600 shadow-sm"
//                 : "text-stone-400 hover:text-stone-600"
//             }`}
//           >
//             <Radio
//               size={12}
//               className={viewMode === "live" ? "animate-pulse" : ""}
//             />
//             TRỰC TIẾP
//           </button>
//           <button
//             onClick={() => handleToggleMode("snap")}
//             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
//               viewMode === "snap"
//                 ? "bg-white text-stone-800 shadow-sm"
//                 : "text-stone-400 hover:text-stone-600"
//             }`}
//           >
//             <ImageIcon size={12} />
//             SNAPSHOT
//           </button>
//         </div>
//       </div>

//       <div className="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-inner group">
//         {viewMode === "live" ? (
//           <img
//             key={`live-${refreshKey}`}
//             src={LIVE_STREAM_URL}
//             alt="Live stream from Pi"
//             className={`w-full h-full object-cover transition-opacity duration-500 ${isImgLoading ? "opacity-0" : "opacity-100"}`}
//             onLoad={() => setIsImgLoading(false)}
//             onError={() => {
//               setIsImgLoading(false);
//               setHasError(true);
//             }}
//           />
//         ) : savedSnap && !hasError ? (
//           <img
//             src={savedSnap}
//             alt="Cloud snapshot"
//             className={`w-full h-full object-cover transition-opacity duration-500 ${isImgLoading ? "opacity-0" : "opacity-100"}`}
//             onLoad={() => setIsImgLoading(false)}
//             onError={() => {
//               setIsImgLoading(false);
//               setHasError(true);
//             }}
//           />
//         ) : (
//           <div className="flex flex-col items-center justify-center h-full gap-2 bg-stone-50 text-stone-400">
//             <ImageIcon size={40} strokeWidth={1.5} />
//             <p className="text-[11px] font-medium italic">
//               Chưa có dữ liệu ảnh snapshot
//             </p>
//           </div>
//         )}

//         {isImgLoading && !hasError && (viewMode === "live" || savedSnap) && (
//           <div className="absolute inset-0 bg-stone-50 flex flex-col items-center justify-center gap-2">
//             <RefreshCw size={24} className="text-stone-300 animate-spin" />
//             <span className="text-[10px] font-bold text-stone-300 tracking-widest uppercase">
//               Đang tải...
//             </span>
//           </div>
//         )}

//         {hasError && (
//           <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-6 text-center">
//             <AlertCircle size={30} className="text-red-300 mb-2" />
//             <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
//               Lỗi kết nối
//             </p>
//             <button
//               onClick={handleManualRefresh}
//               className="mt-3 px-4 py-1.5 bg-white border border-red-100 rounded-lg text-[10px] font-bold text-red-500 shadow-sm"
//             >
//               THỬ LẠI
//             </button>
//           </div>
//         )}

//         {!isImgLoading && !hasError && (
//           <div className="absolute top-4 right-4 z-20">
//             {viewMode === "live" ? (
//               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md border border-white/20">
//                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
//                 <span className="text-[9px] font-black text-white tracking-widest">
//                   LIVE
//                 </span>
//               </div>
//             ) : (
//               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/80 backdrop-blur-md rounded-md border border-white/10">
//                 <span className="text-[9px] font-black text-white tracking-widest uppercase">
//                   Ảnh lưu trữ
//                 </span>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="mt-4 flex items-center justify-between">
//         <div className="flex flex-col gap-0.5">
//           <span className="text-[11px] font-bold text-stone-700">
//             {viewMode === "live"
//               ? "Nguồn: Raspberry Pi 4"
//               : latestEvent?.type || "Nguồn: Cloud Storage"}
//           </span>
//           <span className="text-[10px] text-stone-400 font-medium italic">
//             {viewMode === "live"
//               ? `Đường truyền trực tiếp MJPEG`
//               : lastSnapTimeFormatted
//                 ? `Chụp cách đây ${lastSnapTimeFormatted}`
//                 : "Đang chờ sự kiện đầu tiên..."}
//           </span>
//         </div>

//         <button
//           onClick={handleManualRefresh}
//           className="p-2 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-stone-600 transition-colors"
//         >
//           <RefreshCw size={14} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default CameraFeed;

/**
 * components/CameraFeed.jsx
 *
 * Mục đích: Hiển thị video trực tiếp (MJPEG) từ Raspberry Pi và ảnh snapshot
 *           từ Cloudinary khi có sự kiện bảo mật.
 *
 * VẤN ĐỀ CŨ:
 *   - URL live stream bị hard-code thành "http://192.168.137.112:5000/video_feed"
 *     (IP sai, không khớp mạng thực tế 192.168.137.2).
 *
 * GIẢI PHÁP:
 *   - Dùng biến môi trường VITE_PI_IP (định nghĩa trong frontend/.env)
 *     để tạo URL động: http://${VITE_PI_IP}:5000/video_feed
 *   - Nếu VITE_PI_IP không được set, fallback về 192.168.137.2.
 *
 * LƯU Ý QUAN TRỌNG:
 *   - Live Stream kết nối trực tiếp tới Pi (KHÔNG qua Vite proxy hay FastAPI)
 *     vì đây là MJPEG stream từ aiohttp server (port 5000) trên Pi.
 *   - Snapshot là ảnh Cloudinary URL → load từ CDN internet.
 */

import React, { useState, useEffect } from "react";
import {
  Camera,
  Radio,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSystemStore from "../store/systemStore.js";

// ── Lấy IP của Pi từ biến môi trường (frontend/.env) ──────────────────────
const PI_IP = import.meta.env.VITE_PI_IP || "192.168.137.2";
const LIVE_STREAM_URL = `http://${PI_IP}:5000/video_feed`;

const CameraFeed = ({ className = "" }) => {
  const { latestEvent, cameraActive } = useSystemStore();

  const [viewMode, setViewMode] = useState("live");
  const [isImgLoading, setIsImgLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedSnap, setSavedSnap] = useState(null);
  const [savedSnapTime, setSavedSnapTime] = useState(null);

  useEffect(() => {
    if (latestEvent?.image_url) {
      setSavedSnap(latestEvent.image_url);
      setSavedSnapTime(latestEvent.timestamp);
    }
  }, [latestEvent]);

  const lastSnapTimeFormatted = savedSnapTime
    ? formatDistanceToNow(new Date(savedSnapTime), { addSuffix: true })
    : null;

  const handleToggleMode = (mode) => {
    setIsImgLoading(true);
    setHasError(false);
    setViewMode(mode);
  };

  const handleManualRefresh = () => {
    setIsImgLoading(true);
    setHasError(false);
    setRefreshKey((prev) => prev + 1);
  };

  if (!cameraActive) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-72 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-200 ${className}`}
      >
        <Camera size={40} className="text-stone-300 mb-2" />
        <p className="text-stone-500 font-bold text-sm">
          CAMERA SYSTEM OFFLINE
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-5 rounded-2xl shadow-sm border border-stone-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-stone-50 rounded-xl">
            <Camera size={18} className="text-stone-500" />
          </div>
          <h2 className="font-bold text-stone-800 text-sm tracking-tight uppercase">
            Mắt thần
          </h2>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/50">
          <button
            onClick={() => handleToggleMode("live")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              viewMode === "live"
                ? "bg-white text-red-600 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Radio
              size={12}
              className={viewMode === "live" ? "animate-pulse" : ""}
            />
            TRỰC TIẾP
          </button>
          <button
            onClick={() => handleToggleMode("snap")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              viewMode === "snap"
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <ImageIcon size={12} />
            SNAPSHOT
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-inner group">
        {viewMode === "live" ? (
          <img
            key={`live-${refreshKey}`}
            src={LIVE_STREAM_URL}
            alt="Live stream from Pi"
            className={`w-full h-full object-cover transition-opacity duration-500 ${isImgLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImgLoading(false)}
            onError={() => {
              setIsImgLoading(false);
              setHasError(true);
            }}
          />
        ) : savedSnap && !hasError ? (
          <img
            src={savedSnap}
            alt="Cloud snapshot"
            className={`w-full h-full object-cover transition-opacity duration-500 ${isImgLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setIsImgLoading(false)}
            onError={() => {
              setIsImgLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 bg-stone-50 text-stone-400">
            <ImageIcon size={40} strokeWidth={1.5} />
            <p className="text-[11px] font-medium italic">
              Chưa có dữ liệu ảnh snapshot
            </p>
          </div>
        )}

        {isImgLoading && !hasError && (viewMode === "live" || savedSnap) && (
          <div className="absolute inset-0 bg-stone-50 flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="text-stone-300 animate-spin" />
            <span className="text-[10px] font-bold text-stone-300 tracking-widest uppercase">
              Đang tải...
            </span>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={30} className="text-red-300 mb-2" />
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
              Lỗi kết nối
            </p>
            <button
              onClick={handleManualRefresh}
              className="mt-3 px-4 py-1.5 bg-white border border-red-100 rounded-lg text-[10px] font-bold text-red-500 shadow-sm"
            >
              THỬ LẠI
            </button>
          </div>
        )}

        {!isImgLoading && !hasError && (
          <div className="absolute top-4 right-4 z-20">
            {viewMode === "live" ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-md border border-white/20">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-white tracking-widest">
                  LIVE
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/80 backdrop-blur-md rounded-md border border-white/10">
                <span className="text-[9px] font-black text-white tracking-widest uppercase">
                  Ảnh lưu trữ
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold text-stone-700">
            {viewMode === "live"
              ? `Nguồn: Pi (${PI_IP}:5000)`
              : latestEvent?.type || "Nguồn: Cloud Storage"}
          </span>
          <span className="text-[10px] text-stone-400 font-medium italic">
            {viewMode === "live"
              ? "Đường truyền trực tiếp MJPEG"
              : lastSnapTimeFormatted
                ? `Chụp cách đây ${lastSnapTimeFormatted}`
                : "Đang chờ sự kiện đầu tiên..."}
          </span>
        </div>
        <button
          onClick={handleManualRefresh}
          className="p-2 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-stone-600 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
};

export default CameraFeed;
