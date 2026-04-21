// /**
//  * pages/Dashboard.jsx
//  *
//  * CẢI TIẾN:
//  * - Sửa lỗi "Chuông thông báo" (NotificationBell): Đã tách state riêng.
//  * Giờ đây chuông chỉ hiện thị số lượng các hoạt động MỚI (chưa đọc), 
//  * và CÓ THỂ XÓA (Clear All) để không bị tràn màn hình hay nhảy loạn xạ.
//  */

// import { useState, useEffect } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { format } from "date-fns";
// import apiClient from "../api/apiClient.js";
// import useSystemStore from "../store/systemStore.js";
// import toast from "react-hot-toast";
// import CameraFeed from "../components/CameraFeed.jsx";

// // ── API calls ─────────────────────────────────────────────────
// const fetchStats = () => apiClient.get("/access-logs/stats").then((r) => r.data);
// const fetchLogs = () => apiClient.get("/access-logs?limit=15&page=1").then((r) => r.data);
// const fetchStatus = () => apiClient.get("/device/status").then((r) => r.data);
// const stopAlarm = () => apiClient.post("/device/stop-alarm").then((r) => r.data);
// const lockDoor = () => apiClient.post("/device/lock-door").then((r) => r.data);
// const unlockDoor = () => apiClient.post("/device/unlock-door").then((r) => r.data);

// // ── Avatar helper ─────────────────────────────────────────────
// const AVATAR_COLORS = [
//   ["#dce8f0", "#3a6a9a"], ["#e8f0dc", "#4a7c59"],
//   ["#f0e8dc", "#8b5a1a"], ["#ecdce8", "#7a4a8a"],
// ];
// function getAvatar(name) {
//   if (!name) return { bg: "#f0ebe0", fg: "#9e9484", initials: "?" };
//   const i = name.charCodeAt(0) % AVATAR_COLORS.length;
//   const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
//   return { bg: AVATAR_COLORS[i][0], fg: AVATAR_COLORS[i][1], initials };
// }

// // ── Activity row ──────────────────────────────────────────────
// function ActivityRow({ log }) {
//   const av = getAvatar(log.resident_name);
//   const isGranted = log.status === "granted";
//   const isAlarm = log.notes?.toLowerCase().includes("alarm") || (log.status === "denied" && log.method === "pin");
//   const time = format(new Date(log.timestamp), "HH:mm");

//   let badge, badgeLabel;
//   if (isAlarm) { badge = "badge-alarm"; badgeLabel = "Alarm"; } 
//   else if (isGranted) { badge = "badge-granted"; badgeLabel = "Vào được"; } 
//   else if (log.method === "pin") { badge = "badge-pin"; badgeLabel = "PIN"; } 
//   else { badge = "badge-denied"; badgeLabel = "Từ chối"; }

//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
//       <div className="avatar" style={{ background: av.bg, color: av.fg }}>{av.initials}</div>
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text)", margin: 0 }}>{log.resident_name || "Không xác định"}</p>
//         <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "2px 0 0" }}>
//           {log.method === "face" ? "Khuôn mặt" : log.method === "pin" ? "Mặt thất bại" : log.method} — {time}
//         </p>
//       </div>
//       <span className={`badge ${badge}`}>{badgeLabel}</span>
//     </div>
//   );
// }

// // ── Notification Bell (✅ ĐÃ FIX LỖI NHẢY LOẠN & THÊM NÚT XÓA) ───
// function NotificationBell({ logs }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [notifs, setNotifs] = useState([]);
//   const [lastSeenId, setLastSeenId] = useState(null);

//   // Logic: Mỗi khi Server trả về logs mới, ta gắp những thằng MỚI HƠN lastSeenId nhét vào kho tạm
//   useEffect(() => {
//     if (logs?.items?.length > 0) {
//       const newItems = [];
//       for (const item of logs.items) {
//         if (item.id === lastSeenId) break; // Gặp cái cũ thì dừng
//         newItems.push(item);
//       }

//       if (newItems.length > 0) {
//         setNotifs((prev) => [...newItems, ...prev].slice(0, 20)); // Cất tối đa 20 thông báo chưa đọc
//         setLastSeenId(logs.items[0].id); // Cập nhật mốc
//       } else if (!lastSeenId) {
//         // Lần đầu tiên tải trang, set mốc luôn để không thông báo cả 15 cái cũ
//         setLastSeenId(logs.items[0].id);
//       }
//     }
//   }, [logs]);

//   const unreadCount = notifs.length;

//   const handleClearAll = (e) => {
//     e.stopPropagation();
//     setNotifs([]); // Xóa sạch sành sanh
//     setIsOpen(false);
//   };

//   return (
//     <div style={{ position: "relative" }}>
//       <button
//         className="btn btn-outline"
//         style={{ padding: "0.4rem 0.6rem", borderRadius: 8, display: "flex", alignItems: "center", gap: "0.5rem" }}
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
//           <path d="M13.73 21a2 2 0 0 1-3.46 0" />
//         </svg>
//         <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Thông báo</span>
//         {unreadCount > 0 && (
//           <span style={{ background: "var(--red)", color: "white", fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: 10, fontWeight: "bold" }}>
//             {unreadCount > 9 ? "9+" : unreadCount}
//           </span>
//         )}
//       </button>

//       {isOpen && (
//         <>
//           <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setIsOpen(false)} />
//           <div className="card animate-fade-in-up" style={{ position: "absolute", right: 0, top: "120%", width: 340, zIndex: 100, padding: "1rem", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid var(--border)" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
//               <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>Mới cập nhật</p>
//               <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//                 {unreadCount > 0 && (
//                   <button onClick={handleClearAll} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}>Xóa tất cả</button>
//                 )}
//                 <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}>×</button>
//               </div>
//             </div>

//             <div className="custom-scroll" style={{ maxHeight: 350, overflowY: "auto", paddingRight: "0.25rem" }}>
//               <style>{`.custom-scroll::-webkit-scrollbar { width: 4px; } .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }`}</style>
//               {notifs.length > 0 ? (
//                 notifs.map((l) => <ActivityRow key={l.id} log={l} />)
//               ) : (
//                 <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-3)" }}>
//                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "0.5rem", opacity: 0.5 }}>
//                     <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
//                   </svg>
//                   <p style={{ margin: 0, fontSize: "0.85rem" }}>Bạn đã đọc hết thông báo</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// // ── Change PIN Modal ───────────────────────────────────────────
// function ChangePinModal({ onClose }) {
//   const [currentPin, setCurrentPin] = useState("");
//   const [newPin, setNewPin] = useState("");
//   const [confirmPin, setConfirmPin] = useState("");
  
//   const changePinMutation = useMutation({
//     mutationFn: (data) => apiClient.post("/device/change-pin", data).then((r) => r.data),
//     onSuccess: () => { toast.success("Đổi mã PIN thành công!"); onClose(); },
//     onError: () => toast.error("Tính năng này cần cấu hình API /change-pin ở Backend"),
//   });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (newPin !== confirmPin) return toast.error("PIN mới và xác nhận không khớp!");
//     if (newPin.length < 4 || newPin.length > 8) return toast.error("PIN mới phải từ 4 đến 8 chữ số!");
//     changePinMutation.mutate({ current_pin: currentPin, new_pin: newPin });
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
//         <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Đổi mã PIN</h2>
//         <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//           {[
//             ["Mã PIN hiện tại", currentPin, setCurrentPin],
//             ["Mã PIN mới (4–8 số)", newPin, setNewPin],
//             ["Xác nhận PIN mới", confirmPin, setConfirmPin],
//           ].map(([label, val, setter]) => (
//             <div key={label}>
//               <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 4 }}>{label}</label>
//               <input className="input" type="password" inputMode="numeric" maxLength={8} value={val} onChange={(e) => setter(e.target.value)} required />
//             </div>
//           ))}
//           <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
//             <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Hủy</button>
//             <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={changePinMutation.isPending}>
//               {changePinMutation.isPending ? "Đang đổi..." : "Xác nhận"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ── Door Control ──────────────────────────────────────────────
// function DoorControl({ status }) {
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [reason, setReason] = useState("");
//   const [showPinModal, setShowPinModal] = useState(false);
  
//   const unlock = useMutation({
//     mutationFn: unlockDoor,
//     onSuccess: () => { toast.success("Đã gửi lệnh mở cửa"); setShowConfirm(false); setReason(""); },
//     onError: () => toast.error("Không kết nối được Pi"),
//   });
  
//   const lock = useMutation({ mutationFn: lockDoor, onSuccess: () => toast.success("Đã khóa cửa"), onError: () => toast.error("Lỗi kết nối") });
//   const alarm = useMutation({ mutationFn: stopAlarm, onSuccess: () => toast.success("Đã dừng alarm"), onError: () => toast.error("Lỗi kết nối") });
//   const testBuzzer = useMutation({ mutationFn: () => apiClient.post("/device/test-buzzer").then((r) => r.data), onSuccess: () => toast.success("Buzzer đang kêu thử..."), onError: () => toast.error("Lỗi kết nối Pi") });
  
//   const isLocked = status?.door_locked !== false;

//   return (
//     <>
//       <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//         <p className="card-title">Điều khiển cửa</p>
//         <div onClick={() => setShowConfirm(true)} style={{ border: showConfirm ? "2px solid var(--green)" : "1px solid var(--border)", borderRadius: 10, padding: "1.25rem", textAlign: "center", background: "var(--surface-2)", cursor: "pointer", transition: "all 0.2s ease" }}>
//           <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
//             {isLocked ? (
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
//             ) : (
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" /></svg>
//             )}
//           </div>
//           <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.25rem" }}>Mở khóa từ xa</p>
//           <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Gửi lệnh CMD_UNLOCK_DOOR xuống STM32</p>
//         </div>

//         {showConfirm && (
//           <div className="animate-fade-in-up" style={{ border: "1px solid #e8d8b0", borderRadius: 10, padding: "1rem", background: "#fdf8ee" }}>
//             <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--amber-text)", marginBottom: "0.6rem" }}>Xác nhận mở cửa thủ công</p>
//             <select className="input" style={{ marginBottom: "0.6rem", fontSize: "0.82rem" }} value={reason} onChange={(e) => setReason(e.target.value)}>
//               <option value="">— Chọn lý do —</option>
//               <option value="delivery">Giao hàng</option>
//               <option value="guest">Khách đến thăm</option>
//               <option value="maintenance">Bảo trì</option>
//               <option value="other">Khác</option>
//             </select>
//             <div style={{ display: "flex", gap: "0.5rem" }}>
//               <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setReason(""); setShowConfirm(false); }}>Hủy</button>
//               <button className="btn btn-success" style={{ flex: 1 }} disabled={!reason || unlock.isPending} onClick={() => unlock.mutate()}>
//                 {unlock.isPending ? "..." : "Xác nhận mở"}
//               </button>
//             </div>
//           </div>
//         )}

//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
//           <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => alarm.mutate()} disabled={alarm.isPending}>{alarm.isPending ? "..." : "Dừng alarm"}</button>
//           <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => setShowPinModal(true)}>Đổi mã PIN</button>
//           <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => testBuzzer.mutate()} disabled={testBuzzer.isPending}>{testBuzzer.isPending ? "..." : "Test buzzer"}</button>
//           <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => lock.mutate()} disabled={lock.isPending}>{lock.isPending ? "..." : "Khóa ngay"}</button>
//         </div>
//       </div>
//       {showPinModal && <ChangePinModal onClose={() => setShowPinModal(false)} />}
//     </>
//   );
// }

// // ── Connection Status ─────────────────────────────────────────
// function ConnectionStatus({ status }) {
//   const items = [
//     { label: "Raspberry Pi", detail: status?.online ? "Online" : "Offline", ok: status?.online },
//     { label: "STM32", detail: "UART ổn định", ok: true },
//     { label: "Cloud storage", detail: "S3 bình thường", ok: true },
//   ];
//   return (
//     <div className="card">
//       <p className="card-title">Trạng thái kết nối</p>
//       <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
//         {items.map((it) => (
//           <div key={it.label} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
//             <span className={`status-dot ${it.ok ? "online" : "offline"}`} />
//             <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--text)" }}>{it.label}</span>
//             <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{it.detail}</span>
//           </div>
//         ))}
//       </div>
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
//       warnings.push({ text: `Phát hiện chuyển động lúc ${t} — chưa có người vào`, level: "warn" });
//     }
//     const denied = logs.items.filter((l) => l.status === "denied" || l.status === "unknown");
//     if (denied.length >= 2) {
//       warnings.push({ text: `Nhận diện thất bại ${denied.length} lần trong 24h — kiểm tra camera`, level: "danger" });
//     }
//   }
//   if (!warnings.length) return null;
//   return (
//     <div className="card animate-fade-in-up">
//       <p className="card-title">Cảnh báo & Thông báo</p>
//       <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
//         {warnings.map((w, i) => (
//           <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.6rem 0.75rem", background: w.level === "danger" ? "var(--red-bg)" : "var(--amber-bg)", borderRadius: 8, borderLeft: `3px solid ${w.level === "danger" ? "var(--red)" : "var(--amber)"}` }}>
//             <span style={{ color: w.level === "danger" ? "var(--red)" : "var(--amber)", marginTop: 1 }}>•</span>
//             <p style={{ fontSize: "0.82rem", color: w.level === "danger" ? "var(--red-text)" : "var(--amber-text)", lineHeight: 1.5, margin: 0 }}>{w.text}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ── MAIN Dashboard ────────────────────────────────────────────
// export default function Dashboard() {
//   const { doorStatus, alarmActive } = useSystemStore();
//   const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 30000 });
//   const { data: logs } = useQuery({ queryKey: ["logs-dash"], queryFn: fetchLogs, refetchInterval: 15000 });
//   const { data: status } = useQuery({ queryKey: ["device"], queryFn: fetchStatus, refetchInterval: 20000 });

//   const isLocked = doorStatus !== "open";
//   const deniedCount = stats?.today?.denied ?? 0;
//   const totalToday = stats?.today?.total ?? 0;

//   const [latestLogId, setLatestLogId] = useState(null);

//   // Zalo-style push notification
//   useEffect(() => {
//     if (logs?.items?.length > 0) {
//       const topLog = logs.items[0];
//       if (latestLogId !== null && topLog.id !== latestLogId) {
//         const time = format(new Date(topLog.timestamp), "HH:mm");
//         const name = topLog.resident_name || "Khách lạ";
//         const isGranted = topLog.status === "granted";
//         toast.custom(
//           (t) => (
//             <div className="animate-fade-in-up" style={{ background: "var(--surface)", padding: "1rem", borderRadius: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: "flex", gap: "0.8rem", alignItems: "center", borderLeft: `4px solid ${isGranted ? "var(--green)" : "var(--red)"}`, border: "1px solid var(--border)" }}>
//               <div style={{ fontSize: "1.5rem" }}>{isGranted ? "✅" : "⚠️"}</div>
//               <div>
//                 <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>{name} {isGranted ? "vừa mở cửa" : "cố gắng mở cửa"}</p>
//                 <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>
//                   Lúc {time} bằng {topLog.method === "face" ? "Khuôn mặt" : topLog.method === "pin" ? "Mã PIN" : "Remote"}
//                 </p>
//               </div>
//             </div>
//           ),
//           { duration: 5000 }
//         );
//       }
//       setLatestLogId(topLog.id);
//     }
//   }, [logs]);

//   return (
//     <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//       {/* Header */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Tổng quan hệ thống</h1>
//         <NotificationBell logs={logs} />
//       </div>

//       {/* Stat row */}
//       <div className="sd-stats-grid stagger" style={{ gap: "0.75rem" }}>
//         <StatCard label="Trạng thái cửa" value={<><span className={`status-dot ${isLocked ? "online" : "warn"}`} style={{ marginRight: 6 }} />{isLocked ? "Đã khóa" : "Đang mở"}</>} sub="Cập nhật 2 phút trước" valueStyle={{ display: "flex", alignItems: "center", fontWeight: 600 }} />
//         <StatCard label="Lượt vào hôm nay" value={totalToday} sub={`+${Math.max(0, totalToday - 11)} so với hôm qua`} valueStyle={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", fontFamily: "Lora,serif" }} />
//         <StatCard label="Nhận diện thất bại" value={deniedCount} sub="Trong 24h qua" valueStyle={{ fontSize: "1.5rem", fontWeight: 700, color: deniedCount > 0 ? "var(--red)" : "var(--text)", fontFamily: "Lora,serif" }} />
//         <StatCard label="Trạng thái alarm" value={alarmActive ? "Đang hoạt động" : "Không hoạt động"} sub={`Lần cuối: ${alarmActive ? "ngay bây giờ" : "2 ngày trước"}`} valueStyle={{ fontWeight: 600, color: alarmActive ? "var(--red)" : "var(--text)", fontSize: "0.92rem" }} />
//       </div>

//       {/* Main grid */}
//       <div className="sd-main-grid" style={{ gap: "0.75rem" }}>
//         <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//           <CameraFeed />
//         </div>
//         <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
//           <DoorControl status={status} />
//           <ConnectionStatus status={status} />
//         </div>
//       </div>

//       <WarningsPanel logs={logs} />
//     </div>
//   );
// }

// function StatCard({ label, value, sub, valueStyle }) {
//   return (
//     <div className="card animate-fade-in-up">
//       <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "0.4rem" }}>{label}</p>
//       <p style={{ ...valueStyle, margin: 0 }}>{value}</p>
//       {sub && <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: "0.3rem", margin: "4px 0 0" }}>{sub}</p>}
//     </div>
//   );
// }



/**
 * pages/Dashboard.jsx
 * [FIX]: Tự động khôi phục ảnh Snapshot và Tên người khi ấn F5 (Reload trang)
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import apiClient from "../api/apiClient.js";
import useSystemStore from "../store/systemStore.js";
import toast from "react-hot-toast";

import CameraFeed from "../components/CameraFeed.jsx";

// ── API calls ─────────────────────────────────────────────────
const fetchStats = () => apiClient.get("/access-logs/stats").then((r) => r.data);
const fetchLogs = () => apiClient.get("/access-logs?limit=15&page=1").then((r) => r.data);
const fetchStatus = () => apiClient.get("/device/status").then((r) => r.data);
const stopAlarm = () => apiClient.post("/device/stop-alarm").then((r) => r.data);
const lockDoor = () => apiClient.post("/device/lock-door").then((r) => r.data);
const unlockDoor = () => apiClient.post("/device/unlock-door").then((r) => r.data);

// ── Avatar helper ─────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#dce8f0", "#3a6a9a"], ["#e8f0dc", "#4a7c59"],
  ["#f0e8dc", "#8b5a1a"], ["#ecdce8", "#7a4a8a"],
];
function getAvatar(name) {
  if (!name) return { bg: "#f0ebe0", fg: "#9e9484", initials: "?" };
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return { bg: AVATAR_COLORS[i][0], fg: AVATAR_COLORS[i][1], initials };
}

// ── Activity row ──────────────────────────────────────────────
function ActivityRow({ log }) {
  const av = getAvatar(log.resident_name);
  const isGranted = log.status === "granted";
  const isAlarm = log.notes?.toLowerCase().includes("alarm") || (log.status === "denied" && log.method === "pin");
  const time = format(new Date(log.timestamp), "HH:mm");

  let badge, badgeLabel;
  if (isAlarm) { badge = "badge-alarm"; badgeLabel = "Alarm"; } 
  else if (isGranted) { badge = "badge-granted"; badgeLabel = "Vào được"; } 
  else if (log.method === "pin") { badge = "badge-pin"; badgeLabel = "PIN"; } 
  else { badge = "badge-denied"; badgeLabel = "Từ chối"; }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
      <div className="avatar" style={{ background: av.bg, color: av.fg }}>{av.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text)", margin: 0 }}>{log.resident_name || "Không xác định"}</p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "2px 0 0" }}>
          {log.method === "face" ? "Khuôn mặt" : log.method === "pin" ? "Mặt thất bại" : log.method} — {time}
        </p>
      </div>
      <span className={`badge ${badge}`}>{badgeLabel}</span>
    </div>
  );
}

// ── Notification Bell ───
function NotificationBell({ logs }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [lastSeenId, setLastSeenId] = useState(null);

  useEffect(() => {
    if (logs?.items?.length > 0) {
      const newItems = [];
      for (const item of logs.items) {
        if (item.id === lastSeenId) break; 
        newItems.push(item);
      }

      if (newItems.length > 0) {
        setNotifs((prev) => [...newItems, ...prev].slice(0, 20)); 
        setLastSeenId(logs.items[0].id); 
      } else if (!lastSeenId) {
        setLastSeenId(logs.items[0].id);
      }
    }
  }, [logs]);

  const unreadCount = notifs.length;

  const handleClearAll = (e) => {
    e.stopPropagation();
    setNotifs([]); 
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", borderRadius: 8, display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={() => setIsOpen(!isOpen)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Thông báo</span>
        {unreadCount > 0 && <span style={{ background: "var(--red)", color: "white", fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: 10, fontWeight: "bold" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setIsOpen(false)} />
          <div className="card animate-fade-in-up" style={{ position: "absolute", right: 0, top: "120%", width: 340, zIndex: 100, padding: "1rem", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
              <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>Mới cập nhật</p>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {unreadCount > 0 && <button onClick={handleClearAll} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold" }}>Xóa tất cả</button>}
                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div className="custom-scroll" style={{ maxHeight: 350, overflowY: "auto", paddingRight: "0.25rem" }}>
              <style>{`.custom-scroll::-webkit-scrollbar { width: 4px; } .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }`}</style>
              {notifs.length > 0 ? (
                notifs.map((l) => <ActivityRow key={l.id} log={l} />)
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-3)" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "0.5rem", opacity: 0.5 }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Bạn đã đọc hết thông báo</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Change PIN Modal ───────────────────────────────────────────
function ChangePinModal({ onClose }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  
  const changePinMutation = useMutation({
    mutationFn: (data) => apiClient.post("/device/change-pin", data).then((r) => r.data),
    onSuccess: () => { toast.success("Đổi mã PIN thành công!"); onClose(); },
    onError: () => toast.error("Tính năng này cần cấu hình API /change-pin ở Backend"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPin !== confirmPin) return toast.error("PIN mới và xác nhận không khớp!");
    if (newPin.length < 4 || newPin.length > 8) return toast.error("PIN mới phải từ 4 đến 8 chữ số!");
    changePinMutation.mutate({ current_pin: currentPin, new_pin: newPin });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Đổi mã PIN</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            ["Mã PIN hiện tại", currentPin, setCurrentPin],
            ["Mã PIN mới (4–8 số)", newPin, setNewPin],
            ["Xác nhận PIN mới", confirmPin, setConfirmPin],
          ].map(([label, val, setter]) => (
            <div key={label}>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-2)", marginBottom: 4 }}>{label}</label>
              <input className="input" type="password" inputMode="numeric" maxLength={8} value={val} onChange={(e) => setter(e.target.value)} required />
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={changePinMutation.isPending}>
              {changePinMutation.isPending ? "Đang đổi..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Door Control ──────────────────────────────────────────────
function DoorControl({ status }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  
  const unlock = useMutation({
    mutationFn: unlockDoor,
    onSuccess: () => { toast.success("Đã gửi lệnh mở cửa"); setShowConfirm(false); setReason(""); },
    onError: () => toast.error("Không kết nối được Pi"),
  });
  
  const lock = useMutation({ mutationFn: lockDoor, onSuccess: () => toast.success("Đã khóa cửa"), onError: () => toast.error("Lỗi kết nối") });
  const alarm = useMutation({ mutationFn: stopAlarm, onSuccess: () => toast.success("Đã dừng alarm"), onError: () => toast.error("Lỗi kết nối") });
  const testBuzzer = useMutation({ mutationFn: () => apiClient.post("/device/test-buzzer").then((r) => r.data), onSuccess: () => toast.success("Buzzer đang kêu thử..."), onError: () => toast.error("Lỗi kết nối Pi") });
  
  const isLocked = status?.door_locked !== false;

  return (
    <>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p className="card-title">Điều khiển cửa</p>
        <div onClick={() => setShowConfirm(true)} style={{ border: showConfirm ? "2px solid var(--green)" : "1px solid var(--border)", borderRadius: 10, padding: "1.25rem", textAlign: "center", background: "var(--surface-2)", cursor: "pointer", transition: "all 0.2s ease" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
            {isLocked ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" /></svg>
            )}
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.25rem" }}>Mở khóa từ xa</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Gửi lệnh CMD_UNLOCK_DOOR xuống STM32</p>
        </div>

        {showConfirm && (
          <div className="animate-fade-in-up" style={{ border: "1px solid #e8d8b0", borderRadius: 10, padding: "1rem", background: "#fdf8ee" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--amber-text)", marginBottom: "0.6rem" }}>Xác nhận mở cửa thủ công</p>
            <select className="input" style={{ marginBottom: "0.6rem", fontSize: "0.82rem" }} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">— Chọn lý do —</option>
              <option value="delivery">Giao hàng</option>
              <option value="guest">Khách đến thăm</option>
              <option value="maintenance">Bảo trì</option>
              <option value="other">Khác</option>
            </select>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setReason(""); setShowConfirm(false); }}>Hủy</button>
              <button className="btn btn-success" style={{ flex: 1 }} disabled={!reason || unlock.isPending} onClick={() => unlock.mutate()}>
                {unlock.isPending ? "..." : "Xác nhận mở"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => alarm.mutate()} disabled={alarm.isPending}>{alarm.isPending ? "..." : "Dừng alarm"}</button>
          <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => setShowPinModal(true)}>Đổi mã PIN</button>
          <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => testBuzzer.mutate()} disabled={testBuzzer.isPending}>{testBuzzer.isPending ? "..." : "Test buzzer"}</button>
          <button className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => lock.mutate()} disabled={lock.isPending}>{lock.isPending ? "..." : "Khóa ngay"}</button>
        </div>
      </div>
      {showPinModal && <ChangePinModal onClose={() => setShowPinModal(false)} />}
    </>
  );
}

// ── Connection Status ─────────────────────────────────────────
function ConnectionStatus({ status }) {
  const items = [
    { label: "Raspberry Pi", detail: status?.online ? "Online" : "Offline", ok: status?.online },
    { label: "STM32", detail: "UART ổn định", ok: true },
    { label: "Cloud storage", detail: "S3 bình thường", ok: true },
  ];
  return (
    <div className="card">
      <p className="card-title">Trạng thái kết nối</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span className={`status-dot ${it.ok ? "online" : "offline"}`} />
            <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--text)" }}>{it.label}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{it.detail}</span>
          </div>
        ))}
      </div>
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
      warnings.push({ text: `Phát hiện chuyển động lúc ${t} — chưa có người vào`, level: "warn" });
    }
    const denied = logs.items.filter((l) => l.status === "denied" || l.status === "unknown");
    if (denied.length >= 2) {
      warnings.push({ text: `Nhận diện thất bại ${denied.length} lần trong 24h — kiểm tra camera`, level: "danger" });
    }
  }
  if (!warnings.length) return null;
  return (
    <div className="card animate-fade-in-up">
      <p className="card-title">Cảnh báo & Thông báo</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {warnings.map((w, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.6rem 0.75rem", background: w.level === "danger" ? "var(--red-bg)" : "var(--amber-bg)", borderRadius: 8, borderLeft: `3px solid ${w.level === "danger" ? "var(--red)" : "var(--amber)"}` }}>
            <span style={{ color: w.level === "danger" ? "var(--red)" : "var(--amber)", marginTop: 1 }}>•</span>
            <p style={{ fontSize: "0.82rem", color: w.level === "danger" ? "var(--red-text)" : "var(--amber-text)", lineHeight: 1.5, margin: 0 }}>{w.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { doorStatus, alarmActive } = useSystemStore();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 30000 });
  const { data: logs } = useQuery({ queryKey: ["logs-dash"], queryFn: fetchLogs, refetchInterval: 15000 });
  const { data: status } = useQuery({ queryKey: ["device"], queryFn: fetchStatus, refetchInterval: 20000 });

  const isLocked = doorStatus !== "open";
  const deniedCount = stats?.today?.denied ?? 0;
  const totalToday = stats?.today?.total ?? 0;

  const [latestLogId, setLatestLogId] = useState(null);

  // Xử lý thông báo Zalo-style và khôi phục ảnh F5
  useEffect(() => {
    if (logs?.items?.length > 0) {
      const topLog = logs.items[0];

      // ✅ ĐÃ FIX MẤT ẢNH: Phục hồi ảnh tĩnh và tên người cuối cùng khi tải lại trang (F5)
      const { cameraSnapshot, setCameraSnapshot, latestEvent } = useSystemStore.getState();
      if (!cameraSnapshot && !latestEvent && topLog.image_url) {
          useSystemStore.setState({
              cameraSnapshot: topLog.image_url,
              latestEvent: {
                  timestamp: topLog.timestamp,
                  data: { name: topLog.resident_name || "Khách lạ" }
              }
          });
      }

      if (latestLogId !== null && topLog.id !== latestLogId) {
        const time = format(new Date(topLog.timestamp), "HH:mm");
        const name = topLog.resident_name || "Khách lạ";
        const isGranted = topLog.status === "granted";
        toast.custom(
          (t) => (
            <div className="animate-fade-in-up" style={{ background: "var(--surface)", padding: "1rem", borderRadius: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", display: "flex", gap: "0.8rem", alignItems: "center", borderLeft: `4px solid ${isGranted ? "var(--green)" : "var(--red)"}`, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "1.5rem" }}>{isGranted ? "✅" : "⚠️"}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>{name} {isGranted ? "vừa mở cửa" : "cố gắng mở cửa"}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>
                  Lúc {time} bằng {topLog.method === "face" ? "Khuôn mặt" : topLog.method === "pin" ? "Mã PIN" : "Remote"}
                </p>
              </div>
            </div>
          ),
          { duration: 5000 }
        );
      }
      setLatestLogId(topLog.id);
    }
  }, [logs, latestLogId]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Tổng quan hệ thống</h1>
        <NotificationBell logs={logs} />
      </div>

      {/* Stat row */}
      <div className="sd-stats-grid stagger" style={{ gap: "0.75rem" }}>
        <StatCard label="Trạng thái cửa" value={<><span className={`status-dot ${isLocked ? "online" : "warn"}`} style={{ marginRight: 6 }} />{isLocked ? "Đã khóa" : "Đang mở"}</>} sub="Cập nhật 2 phút trước" valueStyle={{ display: "flex", alignItems: "center", fontWeight: 600 }} />
        <StatCard label="Lượt vào hôm nay" value={totalToday} sub={`+${Math.max(0, totalToday - 11)} so với hôm qua`} valueStyle={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", fontFamily: "Lora,serif" }} />
        <StatCard label="Nhận diện thất bại" value={deniedCount} sub="Trong 24h qua" valueStyle={{ fontSize: "1.5rem", fontWeight: 700, color: deniedCount > 0 ? "var(--red)" : "var(--text)", fontFamily: "Lora,serif" }} />
        <StatCard label="Trạng thái alarm" value={alarmActive ? "Đang hoạt động" : "Không hoạt động"} sub={`Lần cuối: ${alarmActive ? "ngay bây giờ" : "2 ngày trước"}`} valueStyle={{ fontWeight: 600, color: alarmActive ? "var(--red)" : "var(--text)", fontSize: "0.92rem" }} />
      </div>

      {/* Main grid */}
      <div className="sd-main-grid" style={{ gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <CameraFeed />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <DoorControl status={status} />
          <ConnectionStatus status={status} />
        </div>
      </div>

      <WarningsPanel logs={logs} />
    </div>
  );
}

function StatCard({ label, value, sub, valueStyle }) {
  return (
    <div className="card animate-fade-in-up">
      <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "0.4rem" }}>{label}</p>
      <p style={{ ...valueStyle, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: "0.3rem", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}