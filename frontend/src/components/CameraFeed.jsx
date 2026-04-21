// // /**
// //  * components/CameraFeed.jsx
// //  *
// //  * BẢN CHUẨN HOÀN THIỆN: CHẾ ĐỘ AUTO 100%
// //  *
// //  * MỤC ĐÍCH: Tối ưu UI/UX, loại bỏ nút gạt thủ công.
// //  * CƠ CHẾ HOẠT ĐỘNG:
// //  * - Trạng thái 1 (Video): Khi Pi quét mặt (isScanning = true) -> Hiện khung hình Base64 liên tục.
// //  * - Trạng thái 2 (Ảnh): Khi Pi nghỉ (isScanning = false) và có ảnh -> Hiện ảnh người gần nhất.
// //  * - Trạng thái 3 (Chờ): Khi Pi nghỉ và chưa có ảnh -> Hiện thông báo "Camera đang ngủ".
// //  */

// // import { useState, useEffect } from "react";
// // import { formatDistanceToNow } from "date-fns";
// // import { vi } from "date-fns/locale";
// // import useSystemStore from "../store/systemStore.js";

// // export default function CameraFeed({ className = "" }) {
// //   // Lấy dữ liệu từ Global Store của ứng dụng
// //   const {
// //     cameraSnapshot,
// //     latestEvent,
// //     isScanning,
// //     scanFrame,
// //     scanState,
// //     cameraActive,
// //   } = useSystemStore();

// //   // State giữ khung hình Base64 được cập nhật từ WebSocket
// //   const [displayFrame, setDisplayFrame] = useState(null);

// //   // Mượt mà hóa luồng cập nhật: Chỉ render frame khi hệ thống đang ở chế độ Scan
// //   useEffect(() => {
// //     if (scanFrame) setDisplayFrame(scanFrame);
// //     if (!isScanning) setDisplayFrame(null);
// //   }, [scanFrame, isScanning]);

// //   // Format lại thời gian và tên hiển thị cho đẹp
// //   const snapTime = latestEvent?.timestamp
// //     ? formatDistanceToNow(new Date(latestEvent.timestamp), {
// //         addSuffix: true,
// //         locale: vi,
// //       })
// //     : "—";

// //   const latestName =
// //     latestEvent?.data?.name || latestEvent?.person_name || "Khách lạ";

// //   // Từ điển nhãn trạng thái quét
// //   const SCAN_LABELS = {
// //     WATCH: "Phát hiện người...",
// //     STABILIZE: "Đang lấy nét...",
// //     SCAN: "Đang nhận diện",
// //   };
// //   const scanLabel = SCAN_LABELS[scanState] || "Đang nhận diện";

// //   // =====================================================================
// //   // LOGIC ĐIỀU HƯỚNG HIỂN THỊ (AUTO 100%)
// //   // =====================================================================
// //   const showVideo = isScanning && displayFrame;
// //   const showLoadingVideo = isScanning && !displayFrame;
// //   const showSnapshot = !isScanning && cameraSnapshot;
// //   const showIdle = !isScanning && !cameraSnapshot;

// //   // =====================================================================
// //   // RENDER UI: KHI MẤT KẾT NỐI VỚI RASPBERRY PI
// //   // =====================================================================
// //   if (!cameraActive) {
// //     return (
// //       <div
// //         className={className}
// //         style={{
// //           display: "flex",
// //           flexDirection: "column",
// //           alignItems: "center",
// //           justifyContent: "center",
// //           height: 240,
// //           borderRadius: 10,
// //           background: "var(--surface-2)",
// //           border: "2px dashed var(--border)",
// //         }}
// //       >
// //         <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</span>
// //         <p
// //           style={{
// //             color: "var(--text-3)",
// //             fontWeight: 600,
// //             fontSize: "0.85rem",
// //           }}
// //         >
// //           CAMERA OFFLINE
// //         </p>
// //       </div>
// //     );
// //   }

// //   // =====================================================================
// //   // RENDER UI: TRẠNG THÁI HOẠT ĐỘNG BÌNH THƯỜNG
// //   // =====================================================================
// //   return (
// //     <div
// //       className={`card ${className}`}
// //       style={{
// //         padding: "1.2rem",
// //         display: "flex",
// //         flexDirection: "column",
// //         gap: "1rem",
// //         height: "100%",
// //       }}
// //     >
// //       {/* ── HEADER CỦA CAMERA ── */}
// //       <div
// //         style={{
// //           display: "flex",
// //           justifyContent: "space-between",
// //           alignItems: "center",
// //         }}
// //       >
// //         <p
// //           className="card-title"
// //           style={{
// //             margin: 0,
// //             display: "flex",
// //             alignItems: "center",
// //             gap: "6px",
// //           }}
// //         >
// //           <svg
// //             width="18"
// //             height="18"
// //             viewBox="0 0 24 24"
// //             fill="none"
// //             stroke="currentColor"
// //             strokeWidth="2"
// //           >
// //             <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
// //             <circle cx="12" cy="13" r="4" />
// //           </svg>
// //           Camera
// //         </p>

// //         {/* Nhãn báo hiệu trạng thái (Thay cho các nút bấm thủ công) */}
// //         <div style={{ display: "flex", alignItems: "center" }}>
// //           {isScanning ? (
// //             <span
// //               style={{
// //                 padding: "4px 10px",
// //                 fontSize: "0.75rem",
// //                 borderRadius: 6,
// //                 background: "rgba(220,38,38,0.1)",
// //                 color: "#dc2626",
// //                 fontWeight: 600,
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: 6,
// //                 border: "1px solid rgba(220,38,38,0.3)",
// //               }}
// //             >
// //               <span
// //                 style={{
// //                   width: 6,
// //                   height: 6,
// //                   borderRadius: "50%",
// //                   background: "#dc2626",
// //                   animation: "pulseDot 1.5s infinite",
// //                 }}
// //               />
// //               Trực tiếp
// //             </span>
// //           ) : (
// //             <span
// //               style={{
// //                 padding: "4px 10px",
// //                 fontSize: "0.75rem",
// //                 borderRadius: 6,
// //                 background: "var(--surface-2)",
// //                 color: "var(--text-3)",
// //                 fontWeight: 500,
// //                 border: "1px solid var(--border)",
// //               }}
// //             >
// //               Chế độ Tự động
// //             </span>
// //           )}
// //         </div>
// //       </div>

// //       {/* ── KHUNG HIỂN THỊ CHÍNH (THAY ĐỔI THEO TRẠNG THÁI) ── */}
// //       <div
// //         style={{
// //           background: "var(--surface-2)",
// //           border: "1px solid var(--border)",
// //           borderRadius: 12,
// //           aspectRatio: "4/3",
// //           display: "flex",
// //           flexDirection: "column",
// //           alignItems: "center",
// //           justifyContent: "center",
// //           overflow: "hidden",
// //           position: "relative",
// //         }}
// //       >
// //         {/* TRẠNG THÁI 1: HIỆN VIDEO TRỰC TIẾP (KHI RASPBERRY PI ĐANG QUÉT MẶT) */}
// //         {showVideo && (
// //           <>
// //             <img
// //               src={displayFrame}
// //               alt="Live scan frame"
// //               style={{
// //                 width: "100%",
// //                 height: "100%",
// //                 objectFit: "cover",
// //                 display: "block",
// //               }}
// //             />

// //             {/* Chữ báo hiệu trạng thái quét */}
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 top: "1rem",
// //                 left: "1rem",
// //                 background: "rgba(0,0,0,0.6)",
// //                 color: "#fff",
// //                 fontSize: "0.75rem",
// //                 fontWeight: 600,
// //                 padding: "0.3rem 0.7rem",
// //                 borderRadius: 8,
// //                 backdropFilter: "blur(4px)",
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: "6px",
// //                 boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
// //               }}
// //             >
// //               <svg
// //                 width="14"
// //                 height="14"
// //                 viewBox="0 0 24 24"
// //                 fill="none"
// //                 stroke="#4ade80"
// //                 strokeWidth="2.5"
// //               >
// //                 <path d="M5 13l4 4L19 7" />
// //               </svg>
// //               {scanLabel}
// //             </div>

// //             {/* Khung viền đỏ nhấp nháy báo hiệu đang quét */}
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 inset: 0,
// //                 border: "2px solid rgba(220, 38, 38, 0.4)",
// //                 borderRadius: 12,
// //                 animation: "pulseBorder 1.5s infinite pointer-events-none",
// //               }}
// //             />
// //           </>
// //         )}

// //         {/* TRẠNG THÁI 1.1: CHỜ FRAME WEBSOCKET ĐẦU TIÊN */}
// //         {showLoadingVideo && (
// //           <div
// //             style={{
// //               display: "flex",
// //               flexDirection: "column",
// //               alignItems: "center",
// //               gap: "0.75rem",
// //             }}
// //           >
// //             <div
// //               style={{
// //                 width: 36,
// //                 height: 36,
// //                 border: "3px solid var(--border)",
// //                 borderTopColor: "var(--green)",
// //                 borderRadius: "50%",
// //                 animation: "spin 0.8s linear infinite",
// //               }}
// //             />
// //             <p
// //               style={{
// //                 fontSize: "0.85rem",
// //                 color: "var(--text-3)",
// //                 fontWeight: 500,
// //               }}
// //             >
// //               Đang kết nối luồng AI...
// //             </p>
// //           </div>
// //         )}

// //         {/* TRẠNG THÁI 2: HIỂN THỊ ẢNH CỦA NGƯỜI GẦN NHẤT */}
// //         {showSnapshot && (
// //           <>
// //             <img
// //               src={cameraSnapshot}
// //               alt="Last access snapshot"
// //               style={{
// //                 width: "100%",
// //                 height: "100%",
// //                 objectFit: "cover",
// //                 display: "block",
// //               }}
// //             />
// //             {/* Lớp gradient đen che phủ nửa dưới bức ảnh để chữ dễ đọc hơn */}
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 inset: 0,
// //                 background:
// //                   "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)",
// //                 pointerEvents: "none",
// //               }}
// //             />

// //             {/* Thông tin tên và thời gian của ảnh */}
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 bottom: "1rem",
// //                 left: "1rem",
// //                 right: "1rem",
// //                 pointerEvents: "none",
// //               }}
// //             >
// //               <p
// //                 style={{
// //                   margin: 0,
// //                   color: "#fff",
// //                   fontSize: "1.2rem",
// //                   fontWeight: 700,
// //                   textShadow: "0 2px 4px rgba(0,0,0,0.5)",
// //                 }}
// //               >
// //                 {latestName}
// //               </p>
// //               <p
// //                 style={{
// //                   margin: "2px 0 0",
// //                   color: "#e5e7eb",
// //                   fontSize: "0.8rem",
// //                   display: "flex",
// //                   alignItems: "center",
// //                   gap: "4px",
// //                 }}
// //               >
// //                 <svg
// //                   width="12"
// //                   height="12"
// //                   viewBox="0 0 24 24"
// //                   fill="none"
// //                   stroke="currentColor"
// //                   strokeWidth="2"
// //                 >
// //                   <circle cx="12" cy="12" r="10" />
// //                   <polyline points="12 6 12 12 16 14" />
// //                 </svg>
// //                 {snapTime}
// //               </p>
// //             </div>

// //             {/* Badge nhỏ góc trên thông báo đây là ảnh lưu trữ */}
// //             <div
// //               style={{
// //                 position: "absolute",
// //                 top: "1rem",
// //                 right: "1rem",
// //                 background: "rgba(0,0,0,0.4)",
// //                 color: "#fff",
// //                 fontSize: "0.65rem",
// //                 padding: "2px 6px",
// //                 borderRadius: 4,
// //                 backdropFilter: "blur(4px)",
// //                 fontWeight: 600,
// //               }}
// //             >
// //               ẢNH LƯU TRỮ
// //             </div>
// //           </>
// //         )}

// //         {/* TRẠNG THÁI 3: MÀN HÌNH CHỜ (KHI KHÔNG CÓ CẢ ẢNH LẪN VIDEO) */}
// //         {showIdle && (
// //           <div
// //             style={{
// //               display: "flex",
// //               flexDirection: "column",
// //               alignItems: "center",
// //               gap: "0.75rem",
// //               opacity: 0.6,
// //             }}
// //           >
// //             <div
// //               style={{
// //                 width: 64,
// //                 height: 64,
// //                 borderRadius: "50%",
// //                 background: "rgba(0,0,0,0.05)",
// //                 display: "flex",
// //                 alignItems: "center",
// //                 justifyContent: "center",
// //               }}
// //             >
// //               <svg
// //                 width="28"
// //                 height="28"
// //                 viewBox="0 0 24 24"
// //                 fill="none"
// //                 stroke="currentColor"
// //                 strokeWidth="1.5"
// //               >
// //                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
// //                 <circle cx="12" cy="12" r="3" />
// //               </svg>
// //             </div>
// //             <p
// //               style={{
// //                 margin: 0,
// //                 color: "var(--text-2)",
// //                 fontSize: "0.9rem",
// //                 fontWeight: 600,
// //               }}
// //             >
// //               Camera đang ngủ
// //             </p>
// //             <p
// //               style={{
// //                 margin: 0,
// //                 color: "var(--text-3)",
// //                 fontSize: "0.75rem",
// //                 textAlign: "center",
// //                 maxWidth: "70%",
// //               }}
// //             >
// //               Hệ thống tự động thức dậy và truyền hình trực tiếp khi phát hiện
// //               có chuyển động.
// //             </p>
// //           </div>
// //         )}
// //       </div>

// //       <p
// //         style={{
// //           margin: 0,
// //           fontSize: "0.75rem",
// //           color: "var(--text-3)",
// //           textAlign: "center",
// //         }}
// //       >
// //         Hệ thống tự động điều khiển luồng Camera để tối ưu tài nguyên Raspberry
// //         Pi
// //       </p>

// //       {/* ── CÁC HIỆU ỨNG CHUYỂN ĐỘNG (ANIMATIONS) ── */}
// //       <style>{`
// //         @keyframes spin { to { transform: rotate(360deg); } }
// //         @keyframes pulseDot { 0% { opacity: 1; } 50% { opacity: 0.4; transform: scale(0.8); } 100% { opacity: 1; } }
// //         @keyframes pulseBorder { 0% { border-color: rgba(220, 38, 38, 0.4); } 50% { border-color: rgba(220, 38, 38, 0.1); } 100% { border-color: rgba(220, 38, 38, 0.4); } }
// //       `}</style>
// //     </div>
// //   );
// // }

// /**
//  * components/CameraFeed.jsx
//  * BẢN CẬP NHẬT: INSTANT SNAPSHOT (HIỂN THỊ TỨC THỜI)
//  */

// import { useState, useEffect } from "react";
// import { formatDistanceToNow } from "date-fns";
// import { vi } from "date-fns/locale";
// import useSystemStore from "../store/systemStore.js";

// export default function CameraFeed({ className = "" }) {
//   const {
//     cameraSnapshot,
//     latestEvent,
//     isScanning,
//     scanFrame,
//     scanState,
//     cameraActive,
//   } = useSystemStore();

//   const [displayFrame, setDisplayFrame] = useState(null);
//   const [instantSnap, setInstantSnap] = useState(null); // [VŨ KHÍ MỚI] Lưu ảnh tạm thời

//   useEffect(() => {
//     if (scanFrame) {
//       setDisplayFrame(scanFrame);
//       setInstantSnap(scanFrame); // Bắt dính khung hình Base64 cuối cùng
//     }
//     if (!isScanning) {
//       setDisplayFrame(null);
//     }
//   }, [scanFrame, isScanning]);

//   // Khi hệ thống nhận được ảnh xịn từ Cloudinary (DB cập nhật), ta xóa ảnh tạm đi
//   useEffect(() => {
//     setInstantSnap(null);
//   }, [cameraSnapshot]);

//   const snapTime = latestEvent?.timestamp
//     ? formatDistanceToNow(new Date(latestEvent.timestamp), {
//         addSuffix: true,
//         locale: vi,
//       })
//     : "—";

//   const latestName =
//     latestEvent?.data?.name || latestEvent?.person_name || "Khách lạ";

//   const SCAN_LABELS = {
//     WATCH: "Phát hiện người...",
//     STABILIZE: "Đang lấy nét...",
//     SCAN: "Đang nhận diện",
//   };
//   const scanLabel = SCAN_LABELS[scanState] || "Đang nhận diện";

//   // Lựa chọn ảnh: Ưu tiên ảnh đóng băng tức thời, nếu không có thì lấy ảnh Cloudinary
//   const displaySnapshot = instantSnap || cameraSnapshot;

//   const showVideo = isScanning && displayFrame;
//   const showLoadingVideo = isScanning && !displayFrame;
//   const showSnapshot = !isScanning && displaySnapshot; // Sử dụng ảnh đã lựa chọn
//   const showIdle = !isScanning && !displaySnapshot;

//   if (!cameraActive) {
//     return (
//       <div
//         className={className}
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           height: 240,
//           borderRadius: 10,
//           background: "var(--surface-2)",
//           border: "2px dashed var(--border)",
//         }}
//       >
//         <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</span>
//         <p
//           style={{
//             color: "var(--text-3)",
//             fontWeight: 600,
//             fontSize: "0.85rem",
//           }}
//         >
//           CAMERA OFFLINE
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div
//       className={`card ${className}`}
//       style={{
//         padding: "1.2rem",
//         display: "flex",
//         flexDirection: "column",
//         gap: "1rem",
//         height: "100%",
//       }}
//     >
//       {/* ── HEADER ── */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <p
//           className="card-title"
//           style={{
//             margin: 0,
//             display: "flex",
//             alignItems: "center",
//             gap: "6px",
//           }}
//         >
//           <svg
//             width="18"
//             height="18"
//             viewBox="0 0 24 24"
//             fill="none"
//             stroke="currentColor"
//             strokeWidth="2"
//           >
//             <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
//             <circle cx="12" cy="13" r="4" />
//           </svg>
//           MẮT THẦN
//         </p>

//         <div style={{ display: "flex", alignItems: "center" }}>
//           {isScanning ? (
//             <span
//               style={{
//                 padding: "4px 10px",
//                 fontSize: "0.75rem",
//                 borderRadius: 6,
//                 background: "rgba(220,38,38,0.1)",
//                 color: "#dc2626",
//                 fontWeight: 600,
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 6,
//                 border: "1px solid rgba(220,38,38,0.3)",
//               }}
//             >
//               <span
//                 style={{
//                   width: 6,
//                   height: 6,
//                   borderRadius: "50%",
//                   background: "#dc2626",
//                   animation: "pulseDot 1.5s infinite",
//                 }}
//               />
//               Trực tiếp
//             </span>
//           ) : (
//             <span
//               style={{
//                 padding: "4px 10px",
//                 fontSize: "0.75rem",
//                 borderRadius: 6,
//                 background: "var(--surface-2)",
//                 color: "var(--text-3)",
//                 fontWeight: 500,
//                 border: "1px solid var(--border)",
//               }}
//             >
//               Chế độ Tự động
//             </span>
//           )}
//         </div>
//       </div>

//       {/* ── KHUNG HIỂN THỊ CHÍNH ── */}
//       <div
//         style={{
//           background: "var(--surface-2)",
//           border: "1px solid var(--border)",
//           borderRadius: 12,
//           aspectRatio: "4/3",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           overflow: "hidden",
//           position: "relative",
//         }}
//       >
//         {/* TRẠNG THÁI 1: LIVE VIDEO */}
//         {showVideo && (
//           <>
//             <img
//               src={displayFrame}
//               alt="Live scan frame"
//               style={{
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "cover",
//                 display: "block",
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 top: "1rem",
//                 left: "1rem",
//                 background: "rgba(0,0,0,0.6)",
//                 color: "#fff",
//                 fontSize: "0.75rem",
//                 fontWeight: 600,
//                 padding: "0.3rem 0.7rem",
//                 borderRadius: 8,
//                 backdropFilter: "blur(4px)",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//               }}
//             >
//               <svg
//                 width="14"
//                 height="14"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="#4ade80"
//                 strokeWidth="2.5"
//               >
//                 <path d="M5 13l4 4L19 7" />
//               </svg>
//               {scanLabel}
//             </div>
//             <div
//               style={{
//                 position: "absolute",
//                 inset: 0,
//                 border: "2px solid rgba(220, 38, 38, 0.4)",
//                 borderRadius: 12,
//                 animation: "pulseBorder 1.5s infinite pointer-events-none",
//               }}
//             />
//           </>
//         )}

//         {showLoadingVideo && (
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               gap: "0.75rem",
//             }}
//           >
//             <div
//               style={{
//                 width: 36,
//                 height: 36,
//                 border: "3px solid var(--border)",
//                 borderTopColor: "var(--green)",
//                 borderRadius: "50%",
//                 animation: "spin 0.8s linear infinite",
//               }}
//             />
//             <p
//               style={{
//                 fontSize: "0.85rem",
//                 color: "var(--text-3)",
//                 fontWeight: 500,
//               }}
//             >
//               Đang kết nối luồng AI...
//             </p>
//           </div>
//         )}

//         {/* TRẠNG THÁI 2: ẢNH LƯU TỨC THỜI HOẶC TỪ CLOUD */}
//         {showSnapshot && (
//           <>
//             <img
//               src={displaySnapshot}
//               alt="Snapshot"
//               style={{
//                 width: "100%",
//                 height: "100%",
//                 objectFit: "cover",
//                 display: "block",
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 inset: 0,
//                 background:
//                   "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)",
//                 pointerEvents: "none",
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 bottom: "1rem",
//                 left: "1rem",
//                 right: "1rem",
//                 pointerEvents: "none",
//               }}
//             >
//               <p
//                 style={{
//                   margin: 0,
//                   color: "#fff",
//                   fontSize: "1.2rem",
//                   fontWeight: 700,
//                   textShadow: "0 2px 4px rgba(0,0,0,0.5)",
//                 }}
//               >
//                 {instantSnap ? "Đang xử lý..." : latestName}
//               </p>
//               <p
//                 style={{
//                   margin: "2px 0 0",
//                   color: "#e5e7eb",
//                   fontSize: "0.8rem",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "4px",
//                 }}
//               >
//                 <svg
//                   width="12"
//                   height="12"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                 >
//                   <circle cx="12" cy="12" r="10" />
//                   <polyline points="12 6 12 12 16 14" />
//                 </svg>
//                 {instantSnap ? "Vừa xong" : snapTime}
//               </p>
//             </div>
//             <div
//               style={{
//                 position: "absolute",
//                 top: "1rem",
//                 right: "1rem",
//                 background: "rgba(0,0,0,0.4)",
//                 color: "#fff",
//                 fontSize: "0.65rem",
//                 padding: "2px 6px",
//                 borderRadius: 4,
//                 backdropFilter: "blur(4px)",
//                 fontWeight: 600,
//               }}
//             >
//               {instantSnap ? "ẢNH TẠM THỜI" : "ẢNH LƯU TRỮ"}
//             </div>
//           </>
//         )}

//         {/* TRẠNG THÁI 3: CHỜ */}
//         {showIdle && (
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               gap: "0.75rem",
//               opacity: 0.6,
//             }}
//           >
//             <div
//               style={{
//                 width: 64,
//                 height: 64,
//                 borderRadius: "50%",
//                 background: "rgba(0,0,0,0.05)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <svg
//                 width="28"
//                 height="28"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="1.5"
//               >
//                 <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//                 <circle cx="12" cy="12" r="3" />
//               </svg>
//             </div>
//             <p
//               style={{
//                 margin: 0,
//                 color: "var(--text-2)",
//                 fontSize: "0.9rem",
//                 fontWeight: 600,
//               }}
//             >
//               Camera đang ngủ
//             </p>
//             <p
//               style={{
//                 margin: 0,
//                 color: "var(--text-3)",
//                 fontSize: "0.75rem",
//                 textAlign: "center",
//                 maxWidth: "70%",
//               }}
//             >
//               Hệ thống tự động thức dậy và truyền hình trực tiếp khi phát hiện
//               chuyển động.
//             </p>
//           </div>
//         )}
//       </div>

//       <p
//         style={{
//           margin: 0,
//           fontSize: "0.75rem",
//           color: "var(--text-3)",
//           textAlign: "center",
//         }}
//       >
//         Hệ thống tự động điều khiển luồng Camera để tối ưu tài nguyên Raspberry
//         Pi
//       </p>

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes pulseDot { 0% { opacity: 1; } 50% { opacity: 0.4; transform: scale(0.8); } 100% { opacity: 1; } }
//         @keyframes pulseBorder { 0% { border-color: rgba(220, 38, 38, 0.4); } 50% { border-color: rgba(220, 38, 38, 0.1); } 100% { border-color: rgba(220, 38, 38, 0.4); } }
//       `}</style>
//     </div>
//   );
// }

/**
 * components/CameraFeed.jsx
 * BẢN CẬP NHẬT: DIRECT DOM MANIPULATION (CHỐNG LAG) & FIX LOGIC ẢNH
 * * - Dùng useRef để vẽ khung hình Base64 trực tiếp vào HTML, bỏ qua React Re-render (siêu mượt).
 * - Đảm bảo luôn hiện ảnh người gần nhất (cameraSnapshot) khi không có Live Video.
 */

/**
 * components/CameraFeed.jsx
 * BẢN CẬP NHẬT CUỐI CÙNG: DIRECT DOM MANIPULATION + INSTANT SNAPSHOT
 * - Chống lag tuyệt đối bằng subscribeToFrame
 * - Giữ ảnh đóng băng (Instant Snap) ngay khi vừa quét xong
 */
import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import useSystemStore from "../store/systemStore.js";

export default function CameraFeed({ className = "" }) {
  const {
    cameraSnapshot,
    latestEvent,
    isScanning,
    scanState,
    cameraActive,
    subscribeToFrame,
    getLastFrame
  } = useSystemStore();

  const liveImageRef = useRef(null);

  // [VŨ KHÍ TỐI THƯỢNG] Lắng nghe Base64 trực tiếp không qua React Render
  useEffect(() => {
    const unsubscribe = subscribeToFrame((frameBase64) => {
      if (isScanning && liveImageRef.current) {
        liveImageRef.current.src = frameBase64;
      }
    });
    return unsubscribe;
  }, [isScanning, subscribeToFrame]);

  const snapTime = latestEvent?.timestamp
    ? formatDistanceToNow(new Date(latestEvent.timestamp), {
        addSuffix: true,
        locale: vi,
      })
    : "—";

  const latestName =
    latestEvent?.data?.name || latestEvent?.person_name || "Khách lạ";

  const SCAN_LABELS = {
    WATCH: "Phát hiện người...",
    STABILIZE: "Đang lấy nét...",
    SCAN: "Đang nhận diện",
  };
  const scanLabel = SCAN_LABELS[scanState] || "Đang nhận diện";

  // Khi hết quét, lấy frame đóng băng làm ảnh Snapshot tạm thời
  const instantSnap = !isScanning ? getLastFrame() : null;
  // Ưu tiên hiển thị: Ảnh tạm (nếu Cloud chưa tải xong) -> Ảnh Cloud (cameraSnapshot)
  const displaySnapshot = instantSnap || cameraSnapshot;

  // LOGIC HIỂN THỊ RÕ RÀNG:
  const showVideo = isScanning;
  const showSnapshot = !isScanning && !!displaySnapshot;
  const showIdle = !isScanning && !displaySnapshot;

  if (!cameraActive) {
    return (
      <div
        className={className}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, borderRadius: 10, background: "var(--surface-2)", border: "2px dashed var(--border)", }}
      >
        <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</span>
        <p style={{ color: "var(--text-3)", fontWeight: 600, fontSize: "0.85rem" }}>
          CAMERA OFFLINE
        </p>
      </div>
    );
  }

  return (
    <div
      className={`card ${className}`}
      style={{ padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1rem", height: "100%", }}
    >
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          MẮT THẦN
        </p>

        <div style={{ display: "flex", alignItems: "center" }}>
          {isScanning ? (
            <span style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 6, background: "rgba(220,38,38,0.1)", color: "#dc2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(220,38,38,0.3)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", animation: "pulseDot 1.5s infinite" }} />
              Trực tiếp
            </span>
          ) : (
            <span style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: 6, background: "var(--surface-2)", color: "var(--text-3)", fontWeight: 500, border: "1px solid var(--border)" }}>
              Chế độ Tự động
            </span>
          )}
        </div>
      </div>

      {/* ── KHUNG HIỂN THỊ CHÍNH ── */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, aspectRatio: "4/3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
        
        {/* TRẠNG THÁI 1: LIVE VIDEO (ĐANG QUÉT) */}
        {showVideo && (
          <>
            <img
              ref={liveImageRef}
              alt="Live scan frame"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Nhãn báo trạng thái AI */}
            <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.75rem", fontWeight: 600, padding: "0.3rem 0.7rem", borderRadius: 8, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {scanLabel}
            </div>
            {/* Viền đỏ nhấp nháy */}
            <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(220, 38, 38, 0.4)", borderRadius: 12, animation: "pulseBorder 1.5s infinite pointer-events-none" }} />
          </>
        )}

        {/* TRẠNG THÁI 2: ẢNH TĨNH LƯU TRỮ HOẶC TẠM THỜI (KHI KHÔNG QUÉT) */}
        {showSnapshot && (
          <>
            <img
              src={displaySnapshot}
              alt="Snapshot"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Gradient tối làm nền cho text */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)", pointerEvents: "none" }} />
            
            {/* Thông tin người gần nhất */}
            <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem", pointerEvents: "none" }}>
              <p style={{ margin: 0, color: "#fff", fontSize: "1.2rem", fontWeight: 700, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                {instantSnap ? "Đang tải lên Cloud..." : latestName}
              </p>
              <p style={{ margin: "2px 0 0", color: "#e5e7eb", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {instantSnap ? "Vừa xong" : snapTime}
              </p>
            </div>
            {/* Nhãn ẢNH LƯU TRỮ */}
            <div style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: "0.65rem", padding: "2px 6px", borderRadius: 4, backdropFilter: "blur(4px)", fontWeight: 600 }}>
              {instantSnap ? "ẢNH TẠM THỜI" : "ẢNH LƯU TRỮ"}
            </div>
          </>
        )}

        {/* TRẠNG THÁI 3: CHỜ (KHI KHÔNG CÓ CẢ VIDEO VÀ ẢNH) */}
        {showIdle && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", opacity: 0.6 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.9rem", fontWeight: 600 }}>Camera đang ngủ</p>
            <p style={{ margin: 0, color: "var(--text-3)", fontSize: "0.75rem", textAlign: "center", maxWidth: "70%" }}>
              Hệ thống tự động thức dậy và truyền hình trực tiếp khi phát hiện chuyển động.
            </p>
          </div>
        )}
      </div>

      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-3)", textAlign: "center" }}>
        Hệ thống tự động điều khiển luồng Camera để tối ưu tài nguyên Raspberry Pi
      </p>

      <style>{`
        @keyframes pulseDot { 0% { opacity: 1; } 50% { opacity: 0.4; transform: scale(0.8); } 100% { opacity: 1; } }
        @keyframes pulseBorder { 0% { border-color: rgba(220, 38, 38, 0.4); } 50% { border-color: rgba(220, 38, 38, 0.1); } 100% { border-color: rgba(220, 38, 38, 0.4); } }
      `}</style>
    </div>
  );
}