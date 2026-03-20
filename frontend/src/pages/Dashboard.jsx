// /**
//  * Dashboard.jsx — Matches mockup exactly:
//  * - Top row: 4 stat cards (Trạng thái cửa, Lượt vào, Nhận diện thất bại, Alarm)
//  * - Middle left: Camera snapshot & Live Stream
//  * - Middle right: Điều khiển cửa + Trạng thái kết nối
//  * - Bottom: Cảnh báo & thông báo
//  * - Top Right: Chuông thông báo Zalo-style
//  */
// import { useState, useEffect } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { formatDistanceToNow, format } from "date-fns";
// import { vi } from "date-fns/locale";
// import apiClient from "../api/apiClient.js";
// import useSystemStore from "../store/systemStore.js";
// import toast from "react-hot-toast";

// // ── API calls ─────────────────────────────────────────────────
// const fetchStats = () =>
//   apiClient.get("/access-logs/stats").then((r) => r.data);
// const fetchLogs = () =>
//   apiClient.get("/access-logs?limit=15&page=1").then((r) => r.data);
// const fetchStatus = () => apiClient.get("/device/status").then((r) => r.data);
// const stopAlarm = () =>
//   apiClient.post("/device/stop-alarm").then((r) => r.data);
// const lockDoor = () => apiClient.post("/device/lock-door").then((r) => r.data);
// const unlockDoor = () =>
//   apiClient.post("/device/unlock-door").then((r) => r.data);

// // ── Avatar helper ─────────────────────────────────────────────
// const AVATAR_COLORS = [
//   ["#dce8f0", "#3a6a9a"],
//   ["#e8f0dc", "#4a7c59"],
//   ["#f0e8dc", "#8b5a1a"],
//   ["#ecdce8", "#7a4a8a"],
// ];
// function getAvatar(name) {
//   if (!name) return { bg: "#f0ebe0", fg: "#9e9484", initials: "?" };
//   const i = name.charCodeAt(0) % AVATAR_COLORS.length;
//   const initials = name
//     .split(" ")
//     .slice(-2)
//     .map((w) => w[0])
//     .join("")
//     .toUpperCase()
//     .slice(0, 2);
//   return { bg: AVATAR_COLORS[i][0], fg: AVATAR_COLORS[i][1], initials };
// }

// // ── Activity row ──────────────────────────────────────────────
// function ActivityRow({ log }) {
//   const av = getAvatar(log.resident_name);
//   const isGranted = log.status === "granted";
//   const isAlarm =
//     log.notes?.toLowerCase().includes("alarm") ||
//     (log.status === "denied" && log.method === "pin");
//   const time = format(new Date(log.timestamp), "HH:mm");

//   let badge, badgeLabel;
//   if (isAlarm) {
//     badge = "badge-alarm";
//     badgeLabel = "Alarm";
//   } else if (isGranted) {
//     badge = "badge-granted";
//     badgeLabel = "Vào được";
//   } else if (log.method === "pin") {
//     badge = "badge-pin";
//     badgeLabel = "PIN";
//   } else {
//     badge = "badge-denied";
//     badgeLabel = "Từ chối";
//   }

//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         gap: "0.75rem",
//         padding: "0.6rem 0",
//         borderBottom: "1px solid var(--border)",
//       }}
//     >
//       <div className="avatar" style={{ background: av.bg, color: av.fg }}>
//         {av.initials}
//       </div>
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <p
//           style={{
//             fontWeight: 500,
//             fontSize: "0.875rem",
//             color: "var(--text)",
//           }}
//         >
//           {log.resident_name || "Không xác định"}
//         </p>
//         <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
//           {log.method === "face"
//             ? "Khuôn mặt"
//             : log.method === "pin"
//               ? "Mặt thất bại"
//               : log.method}{" "}
//           — {time}
//         </p>
//       </div>
//       <span className={`badge ${badge}`}>{badgeLabel}</span>
//     </div>
//   );
// }

// // ── Notification Bell (MỚI) ───────────────────────────────────
// function NotificationBell({ logs }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const items = logs?.items || [];
//   const unreadCount = items.length;

//   return (
//     <div style={{ position: "relative" }}>
//       <button
//         className="btn btn-outline"
//         style={{
//           padding: "0.4rem 0.6rem",
//           borderRadius: 8,
//           position: "relative",
//           display: "flex",
//           alignItems: "center",
//           gap: "0.5rem",
//         }}
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <svg
//           width="18"
//           height="18"
//           viewBox="0 0 24 24"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//         >
//           <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
//           <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
//         </svg>
//         <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Thông báo</span>
//         {unreadCount > 0 && (
//           <span
//             style={{
//               background: "var(--red)",
//               color: "white",
//               fontSize: "0.65rem",
//               padding: "0.1rem 0.4rem",
//               borderRadius: 10,
//               fontWeight: "bold",
//             }}
//           >
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {isOpen && (
//         <>
//           <div
//             style={{ position: "fixed", inset: 0, zIndex: 99 }}
//             onClick={() => setIsOpen(false)}
//           />
//           <div
//             className="card animate-fade-in-up"
//             style={{
//               position: "absolute",
//               right: 0,
//               top: "120%",
//               width: 340,
//               zIndex: 100,
//               padding: "1rem",
//               boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
//               border: "1px solid var(--border)",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 borderBottom: "1px solid var(--border)",
//                 paddingBottom: "0.75rem",
//                 marginBottom: "0.5rem",
//               }}
//             >
//               <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>
//                 Hoạt động gần đây
//               </p>
//               <button
//                 style={{
//                   background: "none",
//                   border: "none",
//                   color: "var(--text-3)",
//                   cursor: "pointer",
//                   fontSize: "1.2rem",
//                   lineHeight: 1,
//                 }}
//                 onClick={() => setIsOpen(false)}
//               >
//                 ×
//               </button>
//             </div>

//             <style>{`
//               .custom-scroll::-webkit-scrollbar { width: 4px; }
//               .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }
//             `}</style>
//             <div
//               className="custom-scroll"
//               style={{
//                 maxHeight: 350,
//                 overflowY: "auto",
//                 paddingRight: "0.25rem",
//               }}
//             >
//               {items.length > 0 ? (
//                 items.map((l) => <ActivityRow key={l.id} log={l} />)
//               ) : (
//                 <p
//                   style={{
//                     color: "var(--text-3)",
//                     fontSize: "0.85rem",
//                     textAlign: "center",
//                     padding: "2rem 0",
//                   }}
//                 >
//                   Chưa có hoạt động
//                 </p>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ── Change PIN Modal ───────────────────────────────
// function ChangePinModal({ onClose }) {
//   const [currentPin, setCurrentPin] = useState("");
//   const [newPin, setNewPin] = useState("");
//   const [confirmPin, setConfirmPin] = useState("");

//   const changePinMutation = useMutation({
//     mutationFn: (data) =>
//       apiClient.post("/device/change-pin", data).then((r) => r.data),
//     onSuccess: () => {
//       toast.success("Đổi mã PIN thành công!");
//       onClose();
//     },
//     onError: (err) => {
//       toast.error("Tính năng này cần cấu hình API /change-pin ở Backend");
//       console.error(err);
//     },
//   });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (newPin !== confirmPin)
//       return toast.error("PIN mới và xác nhận không khớp!");
//     if (newPin.length < 4 || newPin.length > 8)
//       return toast.error("PIN mới phải từ 4 đến 8 chữ số!");
//     changePinMutation.mutate({ current_pin: currentPin, new_pin: newPin });
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div
//         className="modal animate-fade-in-up"
//         style={{ maxWidth: 420, padding: "1.5rem" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <h2
//           style={{
//             margin: "0 0 0.5rem",
//             fontSize: "1.1rem",
//             display: "flex",
//             alignItems: "center",
//             gap: "0.5rem",
//             color: "var(--text)",
//           }}
//         >
//           <span>🔑</span> Đổi mã PIN cửa
//         </h2>
//         <p
//           style={{
//             fontSize: "0.82rem",
//             color: "var(--text-3)",
//             marginBottom: "1.25rem",
//             lineHeight: 1.5,
//           }}
//         >
//           Sau khi lưu, hệ thống sẽ đồng bộ PIN xuống STM32 qua Raspberry Pi →
//           UART.
//         </p>

//         <form
//           onSubmit={handleSubmit}
//           style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
//         >
//           <div>
//             <label
//               style={{
//                 display: "block",
//                 fontSize: "0.82rem",
//                 color: "var(--text-2)",
//                 marginBottom: 6,
//               }}
//             >
//               PIN hiện tại
//             </label>
//             <input
//               type="password"
//               className="input"
//               placeholder="****"
//               value={currentPin}
//               onChange={(e) => setCurrentPin(e.target.value)}
//               required
//             />
//           </div>
//           <div>
//             <label
//               style={{
//                 display: "block",
//                 fontSize: "0.82rem",
//                 color: "var(--text-2)",
//                 marginBottom: 6,
//               }}
//             >
//               PIN mới (4–8 chữ số)
//             </label>
//             <input
//               type="password"
//               className="input"
//               placeholder="****"
//               value={newPin}
//               onChange={(e) => setNewPin(e.target.value)}
//               required
//             />
//           </div>
//           <div>
//             <label
//               style={{
//                 display: "block",
//                 fontSize: "0.82rem",
//                 color: "var(--text-2)",
//                 marginBottom: 6,
//               }}
//             >
//               Xác nhận PIN mới
//             </label>
//             <input
//               type="password"
//               className="input"
//               placeholder="****"
//               value={confirmPin}
//               onChange={(e) => setConfirmPin(e.target.value)}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className="btn"
//             style={{
//               marginTop: "0.5rem",
//               width: "100%",
//               background: "#33322e",
//               color: "#fff",
//               padding: "0.8rem",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               cursor: "pointer",
//               transition: "background 0.2s",
//             }}
//             disabled={changePinMutation.isPending}
//             onMouseOver={(e) => (e.target.style.background = "#1a1a1a")}
//             onMouseOut={(e) => (e.target.style.background = "#33322e")}
//           >
//             {changePinMutation.isPending ? "Đang xử lý..." : "Cập nhật PIN"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ── Door control section ──────────────────────────────────────
// function DoorControl({ status }) {
//   const [reason, setReason] = useState("");
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [showPinModal, setShowPinModal] = useState(false);

//   const unlock = useMutation({
//     mutationFn: unlockDoor,
//     onSuccess: () => {
//       toast.success("Đã gửi lệnh mở cửa");
//       setShowConfirm(false);
//       setReason("");
//     },
//     onError: () => toast.error("Không kết nối được Pi"),
//   });
//   const lock = useMutation({
//     mutationFn: lockDoor,
//     onSuccess: () => toast.success("Đã khóa cửa"),
//     onError: () => toast.error("Lỗi kết nối"),
//   });
//   const alarm = useMutation({
//     mutationFn: stopAlarm,
//     onSuccess: () => toast.success("Đã dừng alarm"),
//     onError: () => toast.error("Lỗi kết nối"),
//   });

//   const isLocked = status?.door_locked !== false;

//   return (
//     <>
//       <div
//         className="card"
//         style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
//       >
//         <p className="card-title">Điều khiển cửa</p>

//         <div
//           onClick={() => setShowConfirm(true)}
//           style={{
//             border: showConfirm
//               ? "2px solid var(--green)"
//               : "1px solid var(--border)",
//             borderRadius: 10,
//             padding: "1.25rem",
//             textAlign: "center",
//             background: "var(--surface-2)",
//             cursor: "pointer",
//             transition: "all 0.2s ease",
//           }}
//         >
//           <div
//             style={{
//               width: 52,
//               height: 52,
//               borderRadius: "50%",
//               background: "var(--surface)",
//               border: "1px solid var(--border)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               margin: "0 auto 0.75rem",
//             }}
//           >
//             {isLocked ? (
//               <svg
//                 width="22"
//                 height="22"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="var(--text-2)"
//                 strokeWidth="1.8"
//               >
//                 <rect x="3" y="11" width="18" height="11" rx="2" />
//                 <path d="M7 11V7a5 5 0 0110 0v4" />
//               </svg>
//             ) : (
//               <svg
//                 width="22"
//                 height="22"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="var(--green)"
//                 strokeWidth="1.8"
//               >
//                 <rect x="3" y="11" width="18" height="11" rx="2" />
//                 <path d="M7 11V7a5 5 0 019.9-1" />
//               </svg>
//             )}
//           </div>
//           <p
//             style={{
//               fontWeight: 600,
//               fontSize: "0.95rem",
//               color: "var(--text)",
//               marginBottom: "0.25rem",
//             }}
//           >
//             Mở khóa từ xa
//           </p>
//           <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
//             Gửi lệnh CMD_UNLOCK_DOOR xuống STM32
//           </p>
//         </div>

//         {showConfirm && (
//           <div
//             className="animate-fade-in-up"
//             style={{
//               border: "1px solid #e8d8b0",
//               borderRadius: 10,
//               padding: "1rem",
//               background: "#fdf8ee",
//             }}
//           >
//             <p
//               style={{
//                 fontSize: "0.78rem",
//                 fontWeight: 600,
//                 color: "var(--amber-text)",
//                 marginBottom: "0.6rem",
//               }}
//             >
//               Xác nhận mở cửa thủ công
//             </p>
//             <select
//               className="input"
//               style={{ marginBottom: "0.6rem", fontSize: "0.82rem" }}
//               value={reason}
//               onChange={(e) => setReason(e.target.value)}
//             >
//               <option value="">— Chọn lý do —</option>
//               <option value="delivery">Giao hàng</option>
//               <option value="guest">Khách đến thăm</option>
//               <option value="maintenance">Bảo trì</option>
//               <option value="other">Khác</option>
//             </select>
//             <div style={{ display: "flex", gap: "0.5rem" }}>
//               <button
//                 className="btn btn-outline"
//                 style={{ flex: 1 }}
//                 onClick={() => {
//                   setReason("");
//                   setShowConfirm(false);
//                 }}
//               >
//                 Hủy
//               </button>
//               <button
//                 className="btn btn-success"
//                 style={{ flex: 1 }}
//                 disabled={!reason || unlock.isPending}
//                 onClick={() => unlock.mutate()}
//               >
//                 {unlock.isPending ? "..." : "Xác nhận mở"}
//               </button>
//             </div>
//           </div>
//         )}

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: "0.5rem",
//           }}
//         >
//           <button
//             className="btn btn-outline"
//             style={{ fontSize: "0.82rem" }}
//             onClick={() => alarm.mutate()}
//             disabled={alarm.isPending}
//           >
//             {alarm.isPending ? "..." : "Dừng alarm"}
//           </button>
//           <button
//             className="btn btn-outline"
//             style={{ fontSize: "0.82rem" }}
//             onClick={() => setShowPinModal(true)}
//           >
//             Đổi mã PIN
//           </button>
//           <button className="btn btn-outline" style={{ fontSize: "0.82rem" }}>
//             Test buzzer
//           </button>
//           <button
//             className="btn btn-outline"
//             style={{ fontSize: "0.82rem" }}
//             onClick={() => lock.mutate()}
//             disabled={lock.isPending}
//           >
//             {lock.isPending ? "..." : "Khóa ngay"}
//           </button>
//         </div>
//       </div>
//       {showPinModal && (
//         <ChangePinModal onClose={() => setShowPinModal(false)} />
//       )}
//     </>
//   );
// }

// // ── Connection status ─────────────────────────────────────────
// function ConnectionStatus({ status }) {
//   const items = [
//     {
//       label: "Raspberry Pi",
//       detail: status?.online ? "30s trước" : "Offline",
//       ok: status?.online,
//     },
//     { label: "STM32", detail: "UART ổn định", ok: true },
//     { label: "Cloud storage", detail: "S3 bình thường", ok: true },
//   ];
//   return (
//     <div className="card">
//       <p className="card-title">Trạng thái kết nối</p>
//       <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
//         {items.map((it) => (
//           <div
//             key={it.label}
//             style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
//           >
//             <span className={`status-dot ${it.ok ? "online" : "offline"}`} />
//             <span
//               style={{ flex: 1, fontSize: "0.875rem", color: "var(--text)" }}
//             >
//               {it.label}
//             </span>
//             <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
//               {it.detail}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ── Camera snapshot & Live Stream ─────────────────────────────
// function CameraSnapshot() {
//   const { cameraSnapshot, latestEvent } = useSystemStore();
//   const time = latestEvent?.timestamp
//     ? format(new Date(latestEvent.timestamp), "HH:mm:ss")
//     : "—";
//   const [isLive, setIsLive] = useState(false);
//   const liveStreamUrl = "http://192.168.137.112:5000/video_feed";

//   return (
//     <div className="card">
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "0.8rem",
//         }}
//       >
//         <p className="card-title" style={{ margin: 0 }}>
//           Camera Cửa
//         </p>
//         <div
//           style={{
//             display: "flex",
//             background: "var(--surface-2)",
//             borderRadius: 8,
//             padding: 3,
//             border: "1px solid var(--border)",
//           }}
//         >
//           <button
//             onClick={() => setIsLive(false)}
//             style={{
//               background: !isLive ? "var(--surface)" : "transparent",
//               border: "none",
//               boxShadow: !isLive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
//               padding: "0.3rem 0.6rem",
//               borderRadius: 6,
//               fontSize: "0.75rem",
//               cursor: "pointer",
//               color: !isLive ? "var(--text)" : "var(--text-3)",
//               fontWeight: !isLive ? 600 : 400,
//             }}
//           >
//             Snapshot
//           </button>
//           <button
//             onClick={() => setIsLive(true)}
//             style={{
//               background: isLive ? "var(--surface)" : "transparent",
//               border: "none",
//               boxShadow: isLive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
//               padding: "0.3rem 0.6rem",
//               borderRadius: 6,
//               fontSize: "0.75rem",
//               cursor: "pointer",
//               color: isLive ? "var(--red-text)" : "var(--text-3)",
//               fontWeight: isLive ? 600 : 400,
//               display: "flex",
//               alignItems: "center",
//               gap: "4px",
//             }}
//           >
//             {isLive && (
//               <span
//                 style={{
//                   width: 6,
//                   height: 6,
//                   background: "var(--red)",
//                   borderRadius: "50%",
//                   display: "inline-block",
//                   animation: "pulseDot 1.5s infinite",
//                 }}
//               />
//             )}
//             Trực tiếp
//           </button>
//         </div>
//       </div>

//       <div
//         style={{
//           background: "var(--surface-2)",
//           border: "1px solid var(--border)",
//           borderRadius: 8,
//           aspectRatio: "4/3",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           overflow: "hidden",
//           position: "relative",
//         }}
//       >
//         {isLive ? (
//           <img
//             src={isLive ? liveStreamUrl : ""}
//             alt="Live Stream"
//             style={{ width: "100%", height: "100%", objectFit: "cover" }}
//             onError={(e) => {
//               e.target.style.display = "none";
//               e.target.nextSibling.style.display = "block";
//             }}
//           />
//         ) : cameraSnapshot ? (
//           <img
//             src={cameraSnapshot}
//             alt="snapshot"
//             style={{ width: "100%", height: "100%", objectFit: "cover" }}
//           />
//         ) : (
//           <>
//             <svg
//               width="36"
//               height="36"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="var(--text-3)"
//               strokeWidth="1.2"
//             >
//               <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
//               <circle cx="12" cy="13" r="4" />
//             </svg>
//             <p
//               style={{
//                 marginTop: "0.5rem",
//                 color: "var(--text-3)",
//                 fontSize: "0.82rem",
//               }}
//             >
//               Ảnh mới nhất từ Pi
//             </p>
//             <p style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>
//               {time}
//             </p>
//           </>
//         )}
//       </div>
//       <p
//         style={{
//           marginTop: "0.5rem",
//           fontSize: "0.75rem",
//           color: "var(--text-3)",
//         }}
//       >
//         {isLive
//           ? "Đang truyền hình trực tiếp từ cửa"
//           : "Chụp khi phát hiện chuyển động"}
//       </p>
//     </div>
//   );
// }

// // ── Warnings panel ────────────────────────────────────────────
// function WarningsPanel({ logs }) {
//   const warnings = [];
//   if (logs?.items) {
//     const unknown = logs.items.filter((l) => !l.resident_name);
//     if (unknown.length > 0) {
//       const t = format(new Date(unknown[0].timestamp), "HH:mm");
//       warnings.push({
//         text: `Phát hiện chuyển động lúc ${t} — chưa có người vào`,
//         level: "warn",
//       });
//     }
//     const denied = logs.items.filter(
//       (l) => l.status === "denied" || l.status === "unknown",
//     );
//     if (denied.length >= 2) {
//       warnings.push({
//         text: `Nhận diện thất bại ${denied.length} lần trong 24h — kiểm tra camera`,
//         level: "danger",
//       });
//     }
//   }
//   if (!warnings.length) return null;
//   return (
//     <div className="card animate-fade-in-up">
//       <p className="card-title">Cảnh báo & Thông báo</p>
//       <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
//         {warnings.map((w, i) => (
//           <div
//             key={i}
//             style={{
//               display: "flex",
//               gap: "0.5rem",
//               alignItems: "flex-start",
//               padding: "0.6rem 0.75rem",
//               background:
//                 w.level === "danger" ? "var(--red-bg)" : "var(--amber-bg)",
//               borderRadius: 8,
//               borderLeft: `3px solid ${w.level === "danger" ? "var(--red)" : "var(--amber)"}`,
//             }}
//           >
//             <span
//               style={{
//                 color: w.level === "danger" ? "var(--red)" : "var(--amber)",
//                 marginTop: 1,
//               }}
//             >
//               •
//             </span>
//             <p
//               style={{
//                 fontSize: "0.82rem",
//                 color:
//                   w.level === "danger"
//                     ? "var(--red-text)"
//                     : "var(--amber-text)",
//                 lineHeight: 1.5,
//               }}
//             >
//               {w.text}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ── MAIN ──────────────────────────────────────────────────────
// export default function Dashboard() {
//   const { doorStatus, alarmActive } = useSystemStore();
//   const { data: stats } = useQuery({
//     queryKey: ["stats"],
//     queryFn: fetchStats,
//     refetchInterval: 30000,
//   });
//   const { data: logs } = useQuery({
//     queryKey: ["logs-dash"],
//     queryFn: fetchLogs,
//     refetchInterval: 15000,
//   });
//   const { data: status } = useQuery({
//     queryKey: ["device"],
//     queryFn: fetchStatus,
//     refetchInterval: 20000,
//   });

//   const isLocked = doorStatus !== "open";
//   const deniedCount = stats?.today?.denied ?? 0;
//   const totalToday = stats?.today?.total ?? 0;

//   const [latestLogId, setLatestLogId] = useState(null);

//   // ZALO-STYLE PUSH NOTIFICATION
//   useEffect(() => {
//     if (logs?.items?.length > 0) {
//       const topLog = logs.items[0];
//       if (latestLogId !== null && topLog.id !== latestLogId) {
//         const time = format(new Date(topLog.timestamp), "HH:mm");
//         const name = topLog.resident_name || "Khách lạ";
//         const isGranted = topLog.status === "granted";

//         toast.custom(
//           (t) => (
//             <div
//               className="animate-fade-in-up"
//               style={{
//                 background: "var(--surface)",
//                 padding: "1rem",
//                 borderRadius: 10,
//                 boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
//                 display: "flex",
//                 gap: "0.8rem",
//                 alignItems: "center",
//                 borderLeft: `4px solid ${isGranted ? "var(--green)" : "var(--red)"}`,
//                 border: "1px solid var(--border)",
//               }}
//             >
//               <div style={{ fontSize: "1.5rem" }}>
//                 {isGranted ? "✅" : "⚠️"}
//               </div>
//               <div>
//                 <p
//                   style={{
//                     margin: 0,
//                     fontWeight: 600,
//                     fontSize: "0.9rem",
//                     color: "var(--text)",
//                   }}
//                 >
//                   {name} {isGranted ? "vừa mở cửa" : "cố gắng mở cửa"}
//                 </p>
//                 <p
//                   style={{
//                     margin: 0,
//                     fontSize: "0.75rem",
//                     color: "var(--text-3)",
//                     marginTop: 2,
//                   }}
//                 >
//                   Lúc {time} bằng{" "}
//                   {topLog.method === "face"
//                     ? "Khuôn mặt"
//                     : topLog.method === "pin"
//                       ? "Mã PIN"
//                       : "Remote"}
//                 </p>
//               </div>
//             </div>
//           ),
//           { duration: 5000 },
//         );
//       }
//       setLatestLogId(topLog.id);
//     }
//   }, [logs]);

//   return (
//     <div
//       className="animate-fade-in"
//       style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
//     >
//       {/* ── HEADER CÓ NÚT CHUÔNG BÊN PHẢI ── */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Tổng quan hệ thống</h1>
//         <NotificationBell logs={logs} />
//       </div>

//       {/* ── Stat row ── */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(4,1fr)",
//           gap: "0.75rem",
//         }}
//         className="stagger"
//       >
//         <StatCard
//           label="Trạng thái cửa"
//           value={
//             <>
//               <span
//                 className={`status-dot ${isLocked ? "online" : "warn"}`}
//                 style={{ marginRight: 6 }}
//               />
//               {isLocked ? "Đã khóa" : "Đang mở"}
//             </>
//           }
//           sub="Cập nhật 2 phút trước"
//           valueStyle={{
//             display: "flex",
//             alignItems: "center",
//             fontWeight: 600,
//           }}
//         />
//         <StatCard
//           label="Lượt vào hôm nay"
//           value={totalToday}
//           sub={`+${Math.max(0, totalToday - 11)} so với hôm qua`}
//           valueStyle={{
//             fontSize: "1.5rem",
//             fontWeight: 700,
//             color: "var(--text)",
//             fontFamily: "Lora,serif",
//           }}
//         />
//         <StatCard
//           label="Nhận diện thất bại"
//           value={deniedCount}
//           sub="Trong 24h qua"
//           valueStyle={{
//             fontSize: "1.5rem",
//             fontWeight: 700,
//             color: deniedCount > 0 ? "var(--red)" : "var(--text)",
//             fontFamily: "Lora,serif",
//           }}
//         />
//         <StatCard
//           label="Trạng thái alarm"
//           value={alarmActive ? "Đang hoạt động" : "Không hoạt động"}
//           sub={`Lần cuối: ${alarmActive ? "ngay bây giờ" : "2 ngày trước"}`}
//           valueStyle={{
//             fontWeight: 600,
//             color: alarmActive ? "var(--red)" : "var(--text)",
//             fontSize: "0.92rem",
//           }}
//         />
//       </div>

//       {/* ── Main grid ── */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 1fr",
//           gap: "0.75rem",
//         }}
//       >
//         {/* Left col - ĐÃ BỎ BẢNG HOẠT ĐỘNG GẦN ĐÂY */}
//         <div
//           style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
//         >
//           <CameraSnapshot />
//         </div>

//         {/* Right col */}
//         <div
//           style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
//         >
//           <DoorControl status={status} />
//           <ConnectionStatus status={status} />
//         </div>
//       </div>

//       {/* ── Warnings ── */}
//       <WarningsPanel logs={logs} />
//     </div>
//   );
// }

// function StatCard({ label, value, sub, valueStyle }) {
//   return (
//     <div className="card animate-fade-in-up">
//       <p
//         style={{
//           fontSize: "0.75rem",
//           color: "var(--text-3)",
//           marginBottom: "0.4rem",
//         }}
//       >
//         {label}
//       </p>
//       <p style={{ ...valueStyle }}>{value}</p>
//       {sub && (
//         <p
//           style={{
//             fontSize: "0.72rem",
//             color: "var(--text-3)",
//             marginTop: "0.3rem",
//           }}
//         >
//           {sub}
//         </p>
//       )}
//     </div>
//   );
// }

/**
 * Dashboard.jsx — Matches mockup exactly:
 * - Top row: 4 stat cards (Trạng thái cửa, Lượt vào, Nhận diện thất bại, Alarm)
 * - Middle left: Camera snapshot & Live Stream
 * - Middle right: Điều khiển cửa + Trạng thái kết nối
 * - Bottom: Cảnh báo & thông báo
 * - Top Right: Chuông thông báo Zalo-style
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import apiClient from "../api/apiClient.js";
import useSystemStore from "../store/systemStore.js";
import toast from "react-hot-toast";

// ── API calls ─────────────────────────────────────────────────
const fetchStats = () =>
  apiClient.get("/access-logs/stats").then((r) => r.data);
const fetchLogs = () =>
  apiClient.get("/access-logs?limit=15&page=1").then((r) => r.data);
const fetchStatus = () => apiClient.get("/device/status").then((r) => r.data);
const stopAlarm = () =>
  apiClient.post("/device/stop-alarm").then((r) => r.data);
const lockDoor = () => apiClient.post("/device/lock-door").then((r) => r.data);
const unlockDoor = () =>
  apiClient.post("/device/unlock-door").then((r) => r.data);

// ── Avatar helper ─────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#dce8f0", "#3a6a9a"],
  ["#e8f0dc", "#4a7c59"],
  ["#f0e8dc", "#8b5a1a"],
  ["#ecdce8", "#7a4a8a"],
];
function getAvatar(name) {
  if (!name) return { bg: "#f0ebe0", fg: "#9e9484", initials: "?" };
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  const initials = name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return { bg: AVATAR_COLORS[i][0], fg: AVATAR_COLORS[i][1], initials };
}

// ── Activity row ──────────────────────────────────────────────
function ActivityRow({ log }) {
  const av = getAvatar(log.resident_name);
  const isGranted = log.status === "granted";
  const isAlarm =
    log.notes?.toLowerCase().includes("alarm") ||
    (log.status === "denied" && log.method === "pin");
  const time = format(new Date(log.timestamp), "HH:mm");

  let badge, badgeLabel;
  if (isAlarm) {
    badge = "badge-alarm";
    badgeLabel = "Alarm";
  } else if (isGranted) {
    badge = "badge-granted";
    badgeLabel = "Vào được";
  } else if (log.method === "pin") {
    badge = "badge-pin";
    badgeLabel = "PIN";
  } else {
    badge = "badge-denied";
    badgeLabel = "Từ chối";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.6rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="avatar" style={{ background: av.bg, color: av.fg }}>
        {av.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 500,
            fontSize: "0.875rem",
            color: "var(--text)",
          }}
        >
          {log.resident_name || "Không xác định"}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          {log.method === "face"
            ? "Khuôn mặt"
            : log.method === "pin"
              ? "Mặt thất bại"
              : log.method}{" "}
          — {time}
        </p>
      </div>
      <span className={`badge ${badge}`}>{badgeLabel}</span>
    </div>
  );
}

// ── Notification Bell (MỚI) ───────────────────────────────────
function NotificationBell({ logs }) {
  const [isOpen, setIsOpen] = useState(false);
  const items = logs?.items || [];
  const unreadCount = items.length;

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn btn-outline"
        style={{
          padding: "0.4rem 0.6rem",
          borderRadius: 8,
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Thông báo</span>
        {unreadCount > 0 && (
          <span
            style={{
              background: "var(--red)",
              color: "white",
              fontSize: "0.65rem",
              padding: "0.1rem 0.4rem",
              borderRadius: 10,
              fontWeight: "bold",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="card animate-fade-in-up"
            style={{
              position: "absolute",
              right: 0,
              top: "120%",
              width: 340,
              zIndex: 100,
              padding: "1rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>
                Hoạt động gần đây
              </p>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-3)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                }}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <style>{`
              .custom-scroll::-webkit-scrollbar { width: 4px; }
              .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }
            `}</style>
            <div
              className="custom-scroll"
              style={{
                maxHeight: 350,
                overflowY: "auto",
                paddingRight: "0.25rem",
              }}
            >
              {items.length > 0 ? (
                items.map((l) => <ActivityRow key={l.id} log={l} />)
              ) : (
                <p
                  style={{
                    color: "var(--text-3)",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Chưa có hoạt động
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Change PIN Modal ───────────────────────────────
function ChangePinModal({ onClose }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const changePinMutation = useMutation({
    mutationFn: (data) =>
      apiClient.post("/device/change-pin", data).then((r) => r.data),
    onSuccess: () => {
      toast.success("Đổi mã PIN thành công!");
      onClose();
    },
    onError: (err) => {
      toast.error("Tính năng này cần cấu hình API /change-pin ở Backend");
      console.error(err);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPin !== confirmPin)
      return toast.error("PIN mới và xác nhận không khớp!");
    if (newPin.length < 4 || newPin.length > 8)
      return toast.error("PIN mới phải từ 4 đến 8 chữ số!");
    changePinMutation.mutate({ current_pin: currentPin, new_pin: newPin });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal animate-fade-in-up"
        style={{ maxWidth: 420, padding: "1.5rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text)",
          }}
        >
          <span>🔑</span> Đổi mã PIN cửa
        </h2>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--text-3)",
            marginBottom: "1.25rem",
            lineHeight: 1.5,
          }}
        >
          Sau khi lưu, hệ thống sẽ đồng bộ PIN xuống STM32 qua Raspberry Pi →
          UART.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-2)",
                marginBottom: 6,
              }}
            >
              PIN hiện tại
            </label>
            <input
              type="password"
              className="input"
              placeholder="****"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-2)",
                marginBottom: 6,
              }}
            >
              PIN mới (4–8 chữ số)
            </label>
            <input
              type="password"
              className="input"
              placeholder="****"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-2)",
                marginBottom: 6,
              }}
            >
              Xác nhận PIN mới
            </label>
            <input
              type="password"
              className="input"
              placeholder="****"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              marginTop: "0.5rem",
              width: "100%",
              background: "#33322e",
              color: "#fff",
              padding: "0.8rem",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            disabled={changePinMutation.isPending}
            onMouseOver={(e) => (e.target.style.background = "#1a1a1a")}
            onMouseOut={(e) => (e.target.style.background = "#33322e")}
          >
            {changePinMutation.isPending ? "Đang xử lý..." : "Cập nhật PIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Door control section ──────────────────────────────────────
function DoorControl({ status }) {
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const unlock = useMutation({
    mutationFn: unlockDoor,
    onSuccess: () => {
      toast.success("Đã gửi lệnh mở cửa");
      setShowConfirm(false);
      setReason("");
    },
    onError: () => toast.error("Không kết nối được Pi"),
  });

  const lock = useMutation({
    mutationFn: lockDoor,
    onSuccess: () => toast.success("Đã khóa cửa"),
    onError: () => toast.error("Lỗi kết nối"),
  });

  const alarm = useMutation({
    mutationFn: stopAlarm,
    onSuccess: () => toast.success("Đã dừng alarm"),
    onError: () => toast.error("Lỗi kết nối"),
  });

  // ✅ ĐÃ THÊM LOGIC GỌI API TEST BUZZER
  const testBuzzer = useMutation({
    mutationFn: () => apiClient.post("/device/test-buzzer").then((r) => r.data),
    onSuccess: () => toast.success("Buzzer đang kêu thử..."),
    onError: () => toast.error("Lỗi kết nối Pi"),
  });

  const isLocked = status?.door_locked !== false;

  return (
    <>
      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <p className="card-title">Điều khiển cửa</p>

        <div
          onClick={() => setShowConfirm(true)}
          style={{
            border: showConfirm
              ? "2px solid var(--green)"
              : "1px solid var(--border)",
            borderRadius: 10,
            padding: "1.25rem",
            textAlign: "center",
            background: "var(--surface-2)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
            }}
          >
            {isLocked ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-2)"
                strokeWidth="1.8"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--green)"
                strokeWidth="1.8"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 019.9-1" />
              </svg>
            )}
          </div>
          <p
            style={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "var(--text)",
              marginBottom: "0.25rem",
            }}
          >
            Mở khóa từ xa
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
            Gửi lệnh CMD_UNLOCK_DOOR xuống STM32
          </p>
        </div>

        {showConfirm && (
          <div
            className="animate-fade-in-up"
            style={{
              border: "1px solid #e8d8b0",
              borderRadius: 10,
              padding: "1rem",
              background: "#fdf8ee",
            }}
          >
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--amber-text)",
                marginBottom: "0.6rem",
              }}
            >
              Xác nhận mở cửa thủ công
            </p>
            <select
              className="input"
              style={{ marginBottom: "0.6rem", fontSize: "0.82rem" }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">— Chọn lý do —</option>
              <option value="delivery">Giao hàng</option>
              <option value="guest">Khách đến thăm</option>
              <option value="maintenance">Bảo trì</option>
              <option value="other">Khác</option>
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => {
                  setReason("");
                  setShowConfirm(false);
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn-success"
                style={{ flex: 1 }}
                disabled={!reason || unlock.isPending}
                onClick={() => unlock.mutate()}
              >
                {unlock.isPending ? "..." : "Xác nhận mở"}
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <button
            className="btn btn-outline"
            style={{ fontSize: "0.82rem" }}
            onClick={() => alarm.mutate()}
            disabled={alarm.isPending}
          >
            {alarm.isPending ? "..." : "Dừng alarm"}
          </button>
          <button
            className="btn btn-outline"
            style={{ fontSize: "0.82rem" }}
            onClick={() => setShowPinModal(true)}
          >
            Đổi mã PIN
          </button>

          {/* ✅ ĐÃ THAY NÚT TEST BUZZER CŨ BẰNG NÚT GỌI MUTATION */}
          <button
            className="btn btn-outline"
            style={{ fontSize: "0.82rem" }}
            onClick={() => testBuzzer.mutate()}
            disabled={testBuzzer.isPending}
          >
            {testBuzzer.isPending ? "..." : "Test buzzer"}
          </button>

          <button
            className="btn btn-outline"
            style={{ fontSize: "0.82rem" }}
            onClick={() => lock.mutate()}
            disabled={lock.isPending}
          >
            {lock.isPending ? "..." : "Khóa ngay"}
          </button>
        </div>
      </div>
      {showPinModal && (
        <ChangePinModal onClose={() => setShowPinModal(false)} />
      )}
    </>
  );
}

// ── Connection status ─────────────────────────────────────────
function ConnectionStatus({ status }) {
  const items = [
    {
      label: "Raspberry Pi",
      detail: status?.online ? "30s trước" : "Offline",
      ok: status?.online,
    },
    { label: "STM32", detail: "UART ổn định", ok: true },
    { label: "Cloud storage", detail: "S3 bình thường", ok: true },
  ];
  return (
    <div className="card">
      <p className="card-title">Trạng thái kết nối</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {items.map((it) => (
          <div
            key={it.label}
            style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
          >
            <span className={`status-dot ${it.ok ? "online" : "offline"}`} />
            <span
              style={{ flex: 1, fontSize: "0.875rem", color: "var(--text)" }}
            >
              {it.label}
            </span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
              {it.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Camera snapshot & Live Stream ─────────────────────────────
function CameraSnapshot() {
  const { cameraSnapshot, latestEvent } = useSystemStore();
  const time = latestEvent?.timestamp
    ? format(new Date(latestEvent.timestamp), "HH:mm:ss")
    : "—";
  const [isLive, setIsLive] = useState(false);

  // ✅ ĐÃ SỬA LỖI IP: Trỏ thẳng vào đúng IP .2 của Raspberry Pi
  const PI_IP = import.meta.env.VITE_PI_IP || "192.168.137.2";
  const liveStreamUrl = `http://${PI_IP}:5000/video_feed`;

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.8rem",
        }}
      >
        <p className="card-title" style={{ margin: 0 }}>
          Camera Cửa
        </p>
        <div
          style={{
            display: "flex",
            background: "var(--surface-2)",
            borderRadius: 8,
            padding: 3,
            border: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setIsLive(false)}
            style={{
              background: !isLive ? "var(--surface)" : "transparent",
              border: "none",
              boxShadow: !isLive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              padding: "0.3rem 0.6rem",
              borderRadius: 6,
              fontSize: "0.75rem",
              cursor: "pointer",
              color: !isLive ? "var(--text)" : "var(--text-3)",
              fontWeight: !isLive ? 600 : 400,
            }}
          >
            Snapshot
          </button>
          <button
            onClick={() => setIsLive(true)}
            style={{
              background: isLive ? "var(--surface)" : "transparent",
              border: "none",
              boxShadow: isLive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              padding: "0.3rem 0.6rem",
              borderRadius: 6,
              fontSize: "0.75rem",
              cursor: "pointer",
              color: isLive ? "var(--red-text)" : "var(--text-3)",
              fontWeight: isLive ? 600 : 400,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {isLive && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--red)",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "pulseDot 1.5s infinite",
                }}
              />
            )}
            Trực tiếp
          </button>
        </div>
      </div>

      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          aspectRatio: "4/3",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isLive ? (
          <img
            src={isLive ? liveStreamUrl : ""}
            alt="Live Stream"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
        ) : cameraSnapshot ? (
          <img
            src={cameraSnapshot}
            alt="snapshot"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-3)"
              strokeWidth="1.2"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <p
              style={{
                marginTop: "0.5rem",
                color: "var(--text-3)",
                fontSize: "0.82rem",
              }}
            >
              Ảnh mới nhất từ Pi
            </p>
            <p style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>
              {time}
            </p>
          </>
        )}
      </div>
      <p
        style={{
          marginTop: "0.5rem",
          fontSize: "0.75rem",
          color: "var(--text-3)",
        }}
      >
        {isLive
          ? "Đang truyền hình trực tiếp từ cửa"
          : "Chụp khi phát hiện chuyển động"}
      </p>
    </div>
  );
}

// ── Warnings panel ────────────────────────────────────────────
function WarningsPanel({ logs }) {
  const warnings = [];
  if (logs?.items) {
    const unknown = logs.items.filter((l) => !l.resident_name);
    if (unknown.length > 0) {
      const t = format(new Date(unknown[0].timestamp), "HH:mm");
      warnings.push({
        text: `Phát hiện chuyển động lúc ${t} — chưa có người vào`,
        level: "warn",
      });
    }
    const denied = logs.items.filter(
      (l) => l.status === "denied" || l.status === "unknown",
    );
    if (denied.length >= 2) {
      warnings.push({
        text: `Nhận diện thất bại ${denied.length} lần trong 24h — kiểm tra camera`,
        level: "danger",
      });
    }
  }
  if (!warnings.length) return null;
  return (
    <div className="card animate-fade-in-up">
      <p className="card-title">Cảnh báo & Thông báo</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {warnings.map((w, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-start",
              padding: "0.6rem 0.75rem",
              background:
                w.level === "danger" ? "var(--red-bg)" : "var(--amber-bg)",
              borderRadius: 8,
              borderLeft: `3px solid ${w.level === "danger" ? "var(--red)" : "var(--amber)"}`,
            }}
          >
            <span
              style={{
                color: w.level === "danger" ? "var(--red)" : "var(--amber)",
                marginTop: 1,
              }}
            >
              •
            </span>
            <p
              style={{
                fontSize: "0.82rem",
                color:
                  w.level === "danger"
                    ? "var(--red-text)"
                    : "var(--amber-text)",
                lineHeight: 1.5,
              }}
            >
              {w.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { doorStatus, alarmActive } = useSystemStore();
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });
  const { data: logs } = useQuery({
    queryKey: ["logs-dash"],
    queryFn: fetchLogs,
    refetchInterval: 15000,
  });
  const { data: status } = useQuery({
    queryKey: ["device"],
    queryFn: fetchStatus,
    refetchInterval: 20000,
  });

  const isLocked = doorStatus !== "open";
  const deniedCount = stats?.today?.denied ?? 0;
  const totalToday = stats?.today?.total ?? 0;

  const [latestLogId, setLatestLogId] = useState(null);

  // ZALO-STYLE PUSH NOTIFICATION
  useEffect(() => {
    if (logs?.items?.length > 0) {
      const topLog = logs.items[0];
      if (latestLogId !== null && topLog.id !== latestLogId) {
        const time = format(new Date(topLog.timestamp), "HH:mm");
        const name = topLog.resident_name || "Khách lạ";
        const isGranted = topLog.status === "granted";

        toast.custom(
          (t) => (
            <div
              className="animate-fade-in-up"
              style={{
                background: "var(--surface)",
                padding: "1rem",
                borderRadius: 10,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                display: "flex",
                gap: "0.8rem",
                alignItems: "center",
                borderLeft: `4px solid ${isGranted ? "var(--green)" : "var(--red)"}`,
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>
                {isGranted ? "✅" : "⚠️"}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "var(--text)",
                  }}
                >
                  {name} {isGranted ? "vừa mở cửa" : "cố gắng mở cửa"}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--text-3)",
                    marginTop: 2,
                  }}
                >
                  Lúc {time} bằng{" "}
                  {topLog.method === "face"
                    ? "Khuôn mặt"
                    : topLog.method === "pin"
                      ? "Mã PIN"
                      : "Remote"}
                </p>
              </div>
            </div>
          ),
          { duration: 5000 },
        );
      }
      setLatestLogId(topLog.id);
    }
  }, [logs]);

  return (
    <div
      className="animate-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* ── HEADER CÓ NÚT CHUÔNG BÊN PHẢI ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Tổng quan hệ thống</h1>
        <NotificationBell logs={logs} />
      </div>

      {/* ── Stat row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "0.75rem",
        }}
        className="stagger"
      >
        <StatCard
          label="Trạng thái cửa"
          value={
            <>
              <span
                className={`status-dot ${isLocked ? "online" : "warn"}`}
                style={{ marginRight: 6 }}
              />
              {isLocked ? "Đã khóa" : "Đang mở"}
            </>
          }
          sub="Cập nhật 2 phút trước"
          valueStyle={{
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
          }}
        />
        <StatCard
          label="Lượt vào hôm nay"
          value={totalToday}
          sub={`+${Math.max(0, totalToday - 11)} so với hôm qua`}
          valueStyle={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text)",
            fontFamily: "Lora,serif",
          }}
        />
        <StatCard
          label="Nhận diện thất bại"
          value={deniedCount}
          sub="Trong 24h qua"
          valueStyle={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: deniedCount > 0 ? "var(--red)" : "var(--text)",
            fontFamily: "Lora,serif",
          }}
        />
        <StatCard
          label="Trạng thái alarm"
          value={alarmActive ? "Đang hoạt động" : "Không hoạt động"}
          sub={`Lần cuối: ${alarmActive ? "ngay bây giờ" : "2 ngày trước"}`}
          valueStyle={{
            fontWeight: 600,
            color: alarmActive ? "var(--red)" : "var(--text)",
            fontSize: "0.92rem",
          }}
        />
      </div>

      {/* ── Main grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        {/* Left col - ĐÃ BỎ BẢNG HOẠT ĐỘNG GẦN ĐÂY */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <CameraSnapshot />
        </div>

        {/* Right col */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <DoorControl status={status} />
          <ConnectionStatus status={status} />
        </div>
      </div>

      {/* ── Warnings ── */}
      <WarningsPanel logs={logs} />
    </div>
  );
}

function StatCard({ label, value, sub, valueStyle }) {
  return (
    <div className="card animate-fade-in-up">
      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--text-3)",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </p>
      <p style={{ ...valueStyle }}>{value}</p>
      {sub && (
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--text-3)",
            marginTop: "0.3rem",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
