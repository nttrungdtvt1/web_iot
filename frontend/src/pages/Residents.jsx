// // // /**
// // //  * Residents.jsx — Quản lý cư dân & Đăng ký khuôn mặt
// // //  *
// // //  * CHANGELOG:
// // //  *   [SỬA] CameraModal.startCamera(): Tăng resolution ideal lên 1280x720
// // //  *         (cũ: 640x480) — ảnh to hơn giúp backend detect khuôn mặt chắc chắn hơn
// // //  *   [SỬA] CameraModal.handleCapture(): Tăng quality JPEG 0.92 → 0.95
// // //  *         để giữ chi tiết khuôn mặt
// // //  *   [SỬA] FaceEnrollModal: Hiển thị error message từ API rõ ràng hơn
// // //  *         thay vì toast ngắn gọn
// // //  *   [SỬA] FaceEnrollModal.handleSaveCapture(): Bắt lỗi 400 từ backend
// // //  *         và hiển thị chi tiết trong UI thay vì toast
// // //  *   [GIỮ] Toàn bộ logic ResidentModal, ResidentCard, danh sách không đổi
// // //  */
// // // import { useState, useRef, useEffect, useCallback } from "react";
// // // import {
// // //   useResidents,
// // //   useCreateResident,
// // //   useUpdateResident,
// // //   useDeleteResident,
// // //   useUploadFaceImage,
// // //   useEnrollResidentFaceFromDashboard,
// // // } from "../hooks/useResidents.js";
// // // import { useQuery } from "@tanstack/react-query";
// // // import { formatDistanceToNow } from "date-fns";
// // // import { vi } from "date-fns/locale";
// // // import apiClient from "../api/apiClient.js";

// // // const fetchStats = () =>
// // //   apiClient.get("/access-logs/stats").then((r) => r.data);

// // // const AVATAR_COLORS = [
// // //   ["#dce8f0", "#3a6a9a"],
// // //   ["#e8f0dc", "#4a7c59"],
// // //   ["#f0e8dc", "#8b5a1a"],
// // //   ["#ecdce8", "#7a4a8a"],
// // // ];

// // // function getAvatar(name) {
// // //   if (!name) return { bg: "#f0ebe0", fg: "#9e9484", initials: "?" };
// // //   const i = name.charCodeAt(0) % AVATAR_COLORS.length;
// // //   const initials = name
// // //     .split(" ")
// // //     .slice(-2)
// // //     .map((w) => w[0])
// // //     .join("")
// // //     .toUpperCase()
// // //     .slice(0, 2);
// // //   return { bg: AVATAR_COLORS[i][0], fg: AVATAR_COLORS[i][1], initials };
// // // }

// // // // ── Add/Edit Modal ─────────────────────────────────────────────────────────────
// // // function ResidentModal({ resident, onClose }) {
// // //   const isEdit = !!resident;
// // //   const [form, setForm] = useState({
// // //     name: resident?.name || "",
// // //     email: resident?.email || "",
// // //     phone: resident?.phone || "",
// // //   });
// // //   const create = useCreateResident();
// // //   const update = useUpdateResident();
// // //   const busy = create.isPending || update.isPending;

// // //   const submit = async (e) => {
// // //     e.preventDefault();
// // //     isEdit
// // //       ? await update.mutateAsync({ id: resident.id, ...form })
// // //       : await create.mutateAsync(form);
// // //     onClose();
// // //   };

// // //   return (
// // //     <div className="modal-overlay" onClick={onClose}>
// // //       <div className="modal" onClick={(e) => e.stopPropagation()}>
// // //         <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem" }}>
// // //           {isEdit ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
// // //         </h2>
// // //         <form
// // //           onSubmit={submit}
// // //           style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
// // //         >
// // //           {[
// // //             {
// // //               label: "Họ và tên *",
// // //               key: "name",
// // //               type: "text",
// // //               placeholder: "Nguyễn Văn A",
// // //               required: true,
// // //             },
// // //             {
// // //               label: "Email",
// // //               key: "email",
// // //               type: "email",
// // //               placeholder: "email@example.com",
// // //             },
// // //             {
// // //               label: "Số điện thoại",
// // //               key: "phone",
// // //               type: "text",
// // //               placeholder: "0901234567",
// // //             },
// // //           ].map(({ label, key, type, placeholder, required }) => (
// // //             <div key={key}>
// // //               <label
// // //                 style={{
// // //                   display: "block",
// // //                   fontSize: "0.78rem",
// // //                   color: "var(--text-2)",
// // //                   marginBottom: 4,
// // //                 }}
// // //               >
// // //                 {label}
// // //               </label>
// // //               <input
// // //                 className="input"
// // //                 type={type}
// // //                 value={form[key]}
// // //                 onChange={(e) => setForm({ ...form, [key]: e.target.value })}
// // //                 placeholder={placeholder}
// // //                 required={required}
// // //               />
// // //             </div>
// // //           ))}
// // //           <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
// // //             <button
// // //               type="button"
// // //               className="btn btn-outline"
// // //               style={{ flex: 1 }}
// // //               onClick={onClose}
// // //             >
// // //               Hủy
// // //             </button>
// // //             <button
// // //               type="submit"
// // //               className="btn btn-primary"
// // //               style={{ flex: 1 }}
// // //               disabled={busy}
// // //             >
// // //               {busy
// // //                 ? "Đang lưu..."
// // //                 : isEdit
// // //                   ? "Lưu thay đổi"
// // //                   : "Thêm thành viên"}
// // //             </button>
// // //           </div>
// // //         </form>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // ── Camera Modal ───────────────────────────────────────────────────────────────
// // // function CameraModal({ onDone, onClose }) {
// // //   const videoRef = useRef(null);
// // //   const canvasRef = useRef(null);
// // //   const streamRef = useRef(null);

// // //   const [capturedImages, setCapturedImages] = useState([]);
// // //   const [cameraError, setCameraError] = useState(null);
// // //   const [isReady, setIsReady] = useState(false);
// // //   const [flashActive, setFlashActive] = useState(false);

// // //   useEffect(() => {
// // //     let mounted = true;

// // //     const startCamera = async () => {
// // //       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
// // //         if (!mounted) return;
// // //         const isLocalhost = ["localhost", "127.0.0.1"].includes(
// // //           window.location.hostname,
// // //         );
// // //         const isHttps = window.location.protocol === "https:";
// // //         setCameraError(
// // //           !isHttps && !isLocalhost
// // //             ? "INSECURE_CONTEXT"
// // //             : "Trình duyệt không hỗ trợ camera.",
// // //         );
// // //         return;
// // //       }

// // //       try {
// // //         const stream = await navigator.mediaDevices.getUserMedia({
// // //           video: {
// // //             // [SỬA] Tăng resolution lên 1280x720 để ảnh đủ lớn cho face detection
// // //             width: { ideal: 1280, min: 640 },
// // //             height: { ideal: 720, min: 480 },
// // //             facingMode: "user",
// // //           },
// // //           audio: false,
// // //         });
// // //         if (!mounted) {
// // //           stream.getTracks().forEach((t) => t.stop());
// // //           return;
// // //         }
// // //         streamRef.current = stream;
// // //         if (videoRef.current) {
// // //           videoRef.current.srcObject = stream;
// // //           videoRef.current.onloadedmetadata = () => {
// // //             if (mounted) setIsReady(true);
// // //           };
// // //         }
// // //       } catch (err) {
// // //         if (!mounted) return;
// // //         if (
// // //           err.name === "NotAllowedError" ||
// // //           err.name === "PermissionDeniedError"
// // //         ) {
// // //           setCameraError(
// // //             "Trình duyệt đã từ chối quyền truy cập Camera. Vui lòng nhấn vào biểu tượng khóa trên thanh địa chỉ và chọn 'Cho phép'.",
// // //           );
// // //         } else if (
// // //           err.name === "NotFoundError" ||
// // //           err.name === "DevicesNotFoundError"
// // //         ) {
// // //           setCameraError(
// // //             "Không tìm thấy Camera trên thiết bị này. Vui lòng kết nối webcam và thử lại.",
// // //           );
// // //         } else {
// // //           setCameraError(`Không thể khởi động Camera: ${err.message}`);
// // //         }
// // //       }
// // //     };

// // //     startCamera();
// // //     return () => {
// // //       mounted = false;
// // //       stopStream();
// // //     };
// // //   }, []);

// // //   const stopStream = useCallback(() => {
// // //     if (streamRef.current) {
// // //       streamRef.current.getTracks().forEach((t) => t.stop());
// // //       streamRef.current = null;
// // //     }
// // //   }, []);

// // //   const handleCapture = useCallback(() => {
// // //     if (!videoRef.current || !canvasRef.current || !isReady) return;

// // //     const video = videoRef.current;
// // //     const canvas = canvasRef.current;
// // //     const ctx = canvas.getContext("2d");

// // //     canvas.width = video.videoWidth || 1280;
// // //     canvas.height = video.videoHeight || 720;

// // //     // [FIX] Flip canvas ngang để match với giao diện mirror (scaleX(-1))
// // //     // → ảnh backend nhận sẽ đúng chiều như user nhìn thấy
// // //     ctx.save();
// // //     ctx.scale(-1, 1);
// // //     ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
// // //     ctx.restore();

// // //     const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

// // //     setFlashActive(true);
// // //     setTimeout(() => setFlashActive(false), 150);
// // //     setCapturedImages((prev) => [...prev, dataUrl]);
// // //   }, [isReady]);

// // //   const handleDone = useCallback(() => {
// // //     stopStream();
// // //     onDone(capturedImages);
// // //   }, [capturedImages, stopStream, onDone]);
// // //   const handleClose = useCallback(() => {
// // //     stopStream();
// // //     onClose();
// // //   }, [stopStream, onClose]);

// // //   return (
// // //     <div
// // //       className="modal-overlay"
// // //       onClick={handleClose}
// // //       style={{ zIndex: 1100 }}
// // //     >
// // //       <div
// // //         className="modal"
// // //         style={{ maxWidth: 560, padding: "1.25rem" }}
// // //         onClick={(e) => e.stopPropagation()}
// // //       >
// // //         <div
// // //           style={{
// // //             display: "flex",
// // //             alignItems: "center",
// // //             justifyContent: "space-between",
// // //             marginBottom: "1rem",
// // //           }}
// // //         >
// // //           <h2 style={{ margin: 0, fontSize: "1rem" }}>
// // //             📸 Camera — Chụp ảnh khuôn mặt
// // //           </h2>
// // //           <button
// // //             onClick={handleClose}
// // //             style={{
// // //               background: "none",
// // //               border: "none",
// // //               fontSize: "1.2rem",
// // //               cursor: "pointer",
// // //               color: "var(--text-3)",
// // //               lineHeight: 1,
// // //               padding: "0.2rem",
// // //             }}
// // //           >
// // //             ✕
// // //           </button>
// // //         </div>

// // //         {cameraError ? (
// // //           <div
// // //             style={{
// // //               background: "var(--red-bg, #f5e8e8)",
// // //               border: "1px solid var(--red, #b84040)",
// // //               borderRadius: 8,
// // //               padding: "1.25rem",
// // //             }}
// // //           >
// // //             <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
// // //               <p style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🔒</p>
// // //               <p
// // //                 style={{
// // //                   fontWeight: 700,
// // //                   color: "var(--red-text, #8b2020)",
// // //                   fontSize: "0.9rem",
// // //                 }}
// // //               >
// // //                 {cameraError === "INSECURE_CONTEXT"
// // //                   ? "Không thể truy cập Camera qua HTTP"
// // //                   : "Không thể khởi động Camera"}
// // //               </p>
// // //             </div>
// // //             {cameraError === "INSECURE_CONTEXT" ? (
// // //               <div
// // //                 style={{
// // //                   fontSize: "0.82rem",
// // //                   color: "var(--red-text, #8b2020)",
// // //                   lineHeight: 1.6,
// // //                 }}
// // //               >
// // //                 <p style={{ marginBottom: "0.6rem" }}>
// // //                   Trình duyệt chặn camera vì trang đang chạy trên{" "}
// // //                   <b>HTTP không bảo mật</b>. Camera chỉ hoạt động trên{" "}
// // //                   <b>HTTPS</b> hoặc <b>localhost</b>.
// // //                 </p>
// // //                 <p style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
// // //                   ✅ Khắc phục nhanh (Chrome / Edge):
// // //                 </p>
// // //                 <ol style={{ paddingLeft: "1.2rem", margin: "0 0 0.75rem" }}>
// // //                   <li>
// // //                     Dán:{" "}
// // //                     <code
// // //                       style={{
// // //                         background: "rgba(0,0,0,0.08)",
// // //                         padding: "0.1rem 0.35rem",
// // //                         borderRadius: 4,
// // //                         fontSize: "0.78rem",
// // //                         userSelect: "all",
// // //                       }}
// // //                     >
// // //                       chrome://flags/#unsafely-treat-insecure-origin-as-secure
// // //                     </code>
// // //                   </li>
// // //                   <li>
// // //                     Thêm{" "}
// // //                     <code
// // //                       style={{
// // //                         background: "rgba(0,0,0,0.08)",
// // //                         padding: "0.1rem 0.35rem",
// // //                         borderRadius: 4,
// // //                         fontSize: "0.78rem",
// // //                         userSelect: "all",
// // //                       }}
// // //                     >
// // //                       {window.location.origin}
// // //                     </code>{" "}
// // //                     vào ô nhập liệu
// // //                   </li>
// // //                   <li>
// // //                     Chọn <b>Enabled</b> → bấm <b>Relaunch</b>
// // //                   </li>
// // //                 </ol>
// // //               </div>
// // //             ) : (
// // //               <p
// // //                 style={{
// // //                   color: "var(--red-text, #8b2020)",
// // //                   fontSize: "0.85rem",
// // //                   lineHeight: 1.5,
// // //                   textAlign: "center",
// // //                 }}
// // //               >
// // //                 {cameraError}
// // //               </p>
// // //             )}
// // //             <button
// // //               className="btn btn-outline"
// // //               style={{ marginTop: "1rem", width: "100%" }}
// // //               onClick={handleClose}
// // //             >
// // //               Đóng
// // //             </button>
// // //           </div>
// // //         ) : (
// // //           <>
// // //             <div
// // //               style={{
// // //                 position: "relative",
// // //                 borderRadius: 10,
// // //                 overflow: "hidden",
// // //                 background: "#000",
// // //                 aspectRatio: "4/3",
// // //                 marginBottom: "0.75rem",
// // //               }}
// // //             >
// // //               <video
// // //                 ref={videoRef}
// // //                 autoPlay
// // //                 playsInline
// // //                 muted
// // //                 style={{
// // //                   width: "100%",
// // //                   height: "100%",
// // //                   objectFit: "cover",
// // //                   display: "block",
// // //                   transform: "scaleX(-1)",
// // //                 }}
// // //               />
// // //               {flashActive && (
// // //                 <div
// // //                   style={{
// // //                     position: "absolute",
// // //                     inset: 0,
// // //                     background: "rgba(255,255,255,0.55)",
// // //                     pointerEvents: "none",
// // //                   }}
// // //                 />
// // //               )}
// // //               {isReady && (
// // //                 <div
// // //                   style={{
// // //                     position: "absolute",
// // //                     inset: 0,
// // //                     display: "flex",
// // //                     alignItems: "center",
// // //                     justifyContent: "center",
// // //                     pointerEvents: "none",
// // //                   }}
// // //                 >
// // //                   <div
// // //                     style={{
// // //                       width: "42%",
// // //                       aspectRatio: "3/4",
// // //                       border: "2.5px dashed rgba(255,255,255,0.75)",
// // //                       borderRadius: "50%",
// // //                       boxShadow: "0 0 0 9999px rgba(0,0,0,0.28)",
// // //                     }}
// // //                   />
// // //                   <div
// // //                     style={{
// // //                       position: "absolute",
// // //                       top: "0.6rem",
// // //                       left: 0,
// // //                       right: 0,
// // //                       textAlign: "center",
// // //                     }}
// // //                   >
// // //                     <span
// // //                       style={{
// // //                         background: "rgba(0,0,0,0.55)",
// // //                         color: "#fff",
// // //                         fontSize: "0.72rem",
// // //                         padding: "0.2rem 0.6rem",
// // //                         borderRadius: 20,
// // //                       }}
// // //                     >
// // //                       Căn mặt vào khung · Nhìn thẳng vào camera
// // //                     </span>
// // //                   </div>
// // //                   <div
// // //                     style={{
// // //                       position: "absolute",
// // //                       bottom: "0.6rem",
// // //                       right: "0.6rem",
// // //                     }}
// // //                   >
// // //                     <span
// // //                       style={{
// // //                         background:
// // //                           capturedImages.length > 0
// // //                             ? "rgba(74,124,89,0.9)"
// // //                             : "rgba(0,0,0,0.6)",
// // //                         color: "#fff",
// // //                         fontSize: "0.75rem",
// // //                         fontWeight: 600,
// // //                         padding: "0.25rem 0.6rem",
// // //                         borderRadius: 20,
// // //                       }}
// // //                     >
// // //                       Đã chụp: {capturedImages.length} ảnh
// // //                     </span>
// // //                   </div>
// // //                 </div>
// // //               )}
// // //               {!isReady && !cameraError && (
// // //                 <div
// // //                   style={{
// // //                     position: "absolute",
// // //                     inset: 0,
// // //                     display: "flex",
// // //                     alignItems: "center",
// // //                     justifyContent: "center",
// // //                     background: "#111",
// // //                     color: "rgba(255,255,255,0.5)",
// // //                     flexDirection: "column",
// // //                     gap: "0.5rem",
// // //                     fontSize: "0.85rem",
// // //                   }}
// // //                 >
// // //                   <span style={{ fontSize: "1.75rem" }}>📷</span>
// // //                   <span>Đang khởi động camera...</span>
// // //                 </div>
// // //               )}
// // //             </div>

// // //             <canvas ref={canvasRef} style={{ display: "none" }} />

// // //             {capturedImages.length > 0 && (
// // //               <div
// // //                 style={{
// // //                   display: "flex",
// // //                   gap: "0.4rem",
// // //                   flexWrap: "wrap",
// // //                   marginBottom: "0.75rem",
// // //                 }}
// // //               >
// // //                 {capturedImages.map((src, i) => (
// // //                   <img
// // //                     key={i}
// // //                     src={src}
// // //                     alt={`Ảnh ${i + 1}`}
// // //                     style={{
// // //                       width: 48,
// // //                       height: 48,
// // //                       objectFit: "cover",
// // //                       borderRadius: 6,
// // //                       border: "2px solid var(--green, #4a7c59)",
// // //                       transform: "scaleX(-1)",
// // //                     }}
// // //                   />
// // //                 ))}
// // //               </div>
// // //             )}

// // //             <div style={{ display: "flex", gap: "0.5rem" }}>
// // //               <button
// // //                 className="btn btn-outline"
// // //                 style={{ flex: "0 0 auto", minWidth: 70 }}
// // //                 onClick={handleClose}
// // //               >
// // //                 Hủy
// // //               </button>
// // //               <button
// // //                 className="btn btn-primary"
// // //                 style={{ flex: 1 }}
// // //                 onClick={handleCapture}
// // //                 disabled={!isReady}
// // //               >
// // //                 📸 Chụp ảnh
// // //               </button>
// // //               <button
// // //                 className="btn"
// // //                 style={{
// // //                   flex: "0 0 auto",
// // //                   minWidth: 100,
// // //                   background:
// // //                     capturedImages.length > 0
// // //                       ? "var(--green, #4a7c59)"
// // //                       : "var(--surface-2)",
// // //                   color: capturedImages.length > 0 ? "#fff" : "var(--text-3)",
// // //                   border: "none",
// // //                   cursor: capturedImages.length > 0 ? "pointer" : "not-allowed",
// // //                 }}
// // //                 onClick={capturedImages.length > 0 ? handleDone : undefined}
// // //                 disabled={capturedImages.length === 0}
// // //               >
// // //                 ✅ Hoàn tất
// // //               </button>
// // //             </div>
// // //             <p
// // //               style={{
// // //                 fontSize: "0.72rem",
// // //                 color: "var(--text-3)",
// // //                 marginTop: "0.5rem",
// // //                 textAlign: "center",
// // //               }}
// // //             >
// // //               Chụp nhiều góc mặt khác nhau để tăng độ chính xác nhận diện
// // //             </p>
// // //           </>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // ── Face Enroll Modal ──────────────────────────────────────────────────────────
// // // function FaceEnrollModal({ resident, onClose }) {
// // //   const [fileList, setFileList] = useState([]);
// // //   const [filePreviews, setFilePreviews] = useState([]);
// // //   const [uploadingFiles, setUploadingFiles] = useState(false);

// // //   const [showCamera, setShowCamera] = useState(false);
// // //   const [capturedB64, setCapturedB64] = useState([]);
// // //   const [savingCapture, setSavingCapture] = useState(false);

// // //   // [THÊM] State lưu lỗi API chi tiết
// // //   const [apiError, setApiError] = useState(null);

// // //   const uploadFile = useUploadFaceImage();
// // //   const enroll = useEnrollResidentFaceFromDashboard();

// // //   const handleFiles = (e) => {
// // //     const fs = Array.from(e.target.files).slice(0, 6);
// // //     setFileList(fs);
// // //     setFilePreviews(fs.map((f) => URL.createObjectURL(f)));
// // //     setCapturedB64([]);
// // //     setApiError(null);
// // //   };

// // //   const handleUploadFiles = async () => {
// // //     if (!fileList.length) return;
// // //     setUploadingFiles(true);
// // //     setApiError(null);
// // //     try {
// // //       for (const f of fileList) {
// // //         await uploadFile.mutateAsync({ id: resident.id, file: f });
// // //       }
// // //       onClose();
// // //     } catch (err) {
// // //       const msg =
// // //         err?.response?.data?.detail || err?.message || "Upload thất bại.";
// // //       setApiError(msg);
// // //     } finally {
// // //       setUploadingFiles(false);
// // //     }
// // //   };

// // //   // Webcam: nhận mảng Base64 từ CameraModal
// // //   const handleCameraDone = (images) => {
// // //     setCapturedB64(images);
// // //     setShowCamera(false);
// // //     setFileList([]);
// // //     setFilePreviews([]);
// // //     setApiError(null);
// // //   };

// // //   // [SỬA] Bắt lỗi 400 từ backend và hiển thị trong UI
// // //   const handleSaveCapture = async () => {
// // //     if (!capturedB64.length) return;
// // //     setSavingCapture(true);
// // //     setApiError(null);
// // //     try {
// // //       await enroll.mutateAsync({ id: resident.id, images: capturedB64 });
// // //       onClose();
// // //     } catch (err) {
// // //       // Lấy message chi tiết từ response body (backend trả về string có xuống dòng)
// // //       const detail =
// // //         err?.response?.data?.detail ||
// // //         err?.message ||
// // //         "Lưu khuôn mặt thất bại.";
// // //       setApiError(detail);
// // //     } finally {
// // //       setSavingCapture(false);
// // //     }
// // //   };

// // //   // Drag & drop
// // //   const handleDrop = (e) => {
// // //     e.preventDefault();
// // //     const fs = Array.from(e.dataTransfer.files)
// // //       .filter((f) => f.type.startsWith("image/"))
// // //       .slice(0, 6);
// // //     if (!fs.length) return;
// // //     setFileList(fs);
// // //     setFilePreviews(fs.map((f) => URL.createObjectURL(f)));
// // //     setCapturedB64([]);
// // //     setApiError(null);
// // //   };

// // //   return (
// // //     <>
// // //       {showCamera && (
// // //         <CameraModal
// // //           onDone={handleCameraDone}
// // //           onClose={() => setShowCamera(false)}
// // //         />
// // //       )}

// // //       <div className="modal-overlay" onClick={onClose}>
// // //         <div
// // //           className="modal"
// // //           style={{ maxWidth: 560 }}
// // //           onClick={(e) => e.stopPropagation()}
// // //         >
// // //           {/* Header */}
// // //           <div
// // //             style={{
// // //               display: "flex",
// // //               alignItems: "center",
// // //               justifyContent: "space-between",
// // //               marginBottom: "1.25rem",
// // //             }}
// // //           >
// // //             <div>
// // //               <h2 style={{ margin: 0, fontSize: "1rem" }}>
// // //                 Thêm ảnh khuôn mặt
// // //               </h2>
// // //               <p
// // //                 style={{
// // //                   margin: "0.2rem 0 0",
// // //                   fontSize: "0.8rem",
// // //                   color: "var(--text-2)",
// // //                 }}
// // //               >
// // //                 Thành viên: <b>{resident?.name}</b>
// // //               </p>
// // //             </div>
// // //             <button
// // //               onClick={onClose}
// // //               style={{
// // //                 background: "none",
// // //                 border: "none",
// // //                 fontSize: "1.2rem",
// // //                 cursor: "pointer",
// // //                 color: "var(--text-3)",
// // //               }}
// // //             >
// // //               ✕
// // //             </button>
// // //           </div>

// // //           {/* [THÊM] Hiển thị lỗi API rõ ràng trong UI */}
// // //           {apiError && (
// // //             <div
// // //               style={{
// // //                 background: "var(--red-bg, #f5e8e8)",
// // //                 border: "1px solid var(--red, #b84040)",
// // //                 borderRadius: 8,
// // //                 padding: "0.75rem 1rem",
// // //                 marginBottom: "1rem",
// // //               }}
// // //             >
// // //               <div
// // //                 style={{
// // //                   display: "flex",
// // //                   alignItems: "flex-start",
// // //                   gap: "0.5rem",
// // //                 }}
// // //               >
// // //                 <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>❌</span>
// // //                 <div>
// // //                   <p
// // //                     style={{
// // //                       margin: 0,
// // //                       fontWeight: 700,
// // //                       color: "var(--red-text, #8b2020)",
// // //                       fontSize: "0.85rem",
// // //                       marginBottom: "0.25rem",
// // //                     }}
// // //                   >
// // //                     Không lưu được ảnh khuôn mặt
// // //                   </p>
// // //                   <p
// // //                     style={{
// // //                       margin: 0,
// // //                       color: "var(--red-text, #8b2020)",
// // //                       fontSize: "0.8rem",
// // //                       whiteSpace: "pre-wrap",
// // //                       lineHeight: 1.5,
// // //                     }}
// // //                   >
// // //                     {apiError}
// // //                   </p>
// // //                   <p
// // //                     style={{
// // //                       margin: "0.5rem 0 0",
// // //                       color: "var(--red-text, #8b2020)",
// // //                       fontSize: "0.78rem",
// // //                     }}
// // //                   >
// // //                     💡 Thử chụp lại với mặt nhìn thẳng, đủ ánh sáng, không bị
// // //                     che khuất.
// // //                   </p>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           )}

// // //           {/* ── Phần 1: Webcam ── */}
// // //           <div
// // //             style={{
// // //               border: "1px solid var(--border)",
// // //               borderRadius: 10,
// // //               padding: "1rem",
// // //               marginBottom: "0.75rem",
// // //             }}
// // //           >
// // //             <p
// // //               style={{
// // //                 margin: "0 0 0.5rem",
// // //                 fontWeight: 600,
// // //                 fontSize: "0.88rem",
// // //               }}
// // //             >
// // //               📷 Chụp ảnh khuôn mặt (Webcam)
// // //             </p>
// // //             <p
// // //               style={{
// // //                 margin: "0 0 0.75rem",
// // //                 fontSize: "0.78rem",
// // //                 color: "var(--text-2)",
// // //                 lineHeight: 1.5,
// // //               }}
// // //             >
// // //               Sử dụng camera của thiết bị này để chụp trực tiếp. Chụp nhiều góc
// // //               để tăng độ chính xác nhận diện.
// // //             </p>

// // //             {capturedB64.length > 0 ? (
// // //               <>
// // //                 <div
// // //                   style={{
// // //                     display: "flex",
// // //                     gap: "0.4rem",
// // //                     flexWrap: "wrap",
// // //                     marginBottom: "0.75rem",
// // //                   }}
// // //                 >
// // //                   {capturedB64.map((src, i) => (
// // //                     <img
// // //                       key={i}
// // //                       src={src}
// // //                       alt={`Ảnh ${i + 1}`}
// // //                       style={{
// // //                         width: 56,
// // //                         height: 56,
// // //                         objectFit: "cover",
// // //                         borderRadius: 6,
// // //                         border: "2px solid var(--green, #4a7c59)",
// // //                       }}
// // //                     />
// // //                   ))}
// // //                 </div>
// // //                 <div style={{ display: "flex", gap: "0.5rem" }}>
// // //                   <button
// // //                     className="btn btn-outline"
// // //                     style={{ flex: 1 }}
// // //                     onClick={() => {
// // //                       setCapturedB64([]);
// // //                       setApiError(null);
// // //                     }}
// // //                   >
// // //                     🔄 Chụp lại
// // //                   </button>
// // //                   <button
// // //                     className="btn btn-primary"
// // //                     style={{ flex: 2, background: "var(--ink, #2d2a24)" }}
// // //                     onClick={handleSaveCapture}
// // //                     disabled={savingCapture}
// // //                   >
// // //                     {savingCapture
// // //                       ? "⏳ Đang lưu..."
// // //                       : `💾 Lưu ${capturedB64.length} ảnh`}
// // //                   </button>
// // //                 </div>
// // //               </>
// // //             ) : (
// // //               <button
// // //                 className="btn btn-outline"
// // //                 style={{ width: "100%" }}
// // //                 onClick={() => {
// // //                   setShowCamera(true);
// // //                   setApiError(null);
// // //                 }}
// // //               >
// // //                 📸 Mở camera &amp; chụp ảnh
// // //               </button>
// // //             )}
// // //           </div>

// // //           {/* Divider */}
// // //           <div
// // //             style={{
// // //               display: "flex",
// // //               alignItems: "center",
// // //               gap: "0.75rem",
// // //               margin: "0.5rem 0",
// // //             }}
// // //           >
// // //             <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
// // //             <span
// // //               style={{
// // //                 fontSize: "0.75rem",
// // //                 color: "var(--text-3)",
// // //                 textTransform: "uppercase",
// // //                 letterSpacing: "0.05em",
// // //               }}
// // //             >
// // //               HOẶC
// // //             </span>
// // //             <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
// // //           </div>

// // //           {/* ── Phần 2: Upload file ── */}
// // //           <div
// // //             style={{
// // //               border: "1px solid var(--border)",
// // //               borderRadius: 10,
// // //               padding: "1rem",
// // //             }}
// // //           >
// // //             <p
// // //               style={{
// // //                 margin: "0 0 0.75rem",
// // //                 fontWeight: 600,
// // //                 fontSize: "0.88rem",
// // //               }}
// // //             >
// // //               📁 Tải ảnh lên từ thiết bị
// // //             </p>

// // //             <div
// // //               onDragOver={(e) => e.preventDefault()}
// // //               onDrop={handleDrop}
// // //               style={{
// // //                 border: "1.5px dashed var(--border)",
// // //                 borderRadius: 8,
// // //                 padding: "1.25rem",
// // //                 textAlign: "center",
// // //                 cursor: "pointer",
// // //                 transition: "border-color 0.2s",
// // //               }}
// // //               onClick={() =>
// // //                 document.getElementById(`file-input-${resident?.id}`)?.click()
// // //               }
// // //             >
// // //               <input
// // //                 id={`file-input-${resident?.id}`}
// // //                 type="file"
// // //                 accept="image/jpeg,image/png,image/webp"
// // //                 multiple
// // //                 style={{ display: "none" }}
// // //                 onChange={handleFiles}
// // //               />
// // //               {filePreviews.length > 0 ? (
// // //                 <div
// // //                   style={{
// // //                     display: "flex",
// // //                     gap: "0.4rem",
// // //                     flexWrap: "wrap",
// // //                     justifyContent: "center",
// // //                   }}
// // //                 >
// // //                   {filePreviews.map((src, i) => (
// // //                     <img
// // //                       key={i}
// // //                       src={src}
// // //                       alt=""
// // //                       style={{
// // //                         width: 56,
// // //                         height: 56,
// // //                         objectFit: "cover",
// // //                         borderRadius: 6,
// // //                         border: "2px solid var(--border)",
// // //                       }}
// // //                     />
// // //                   ))}
// // //                 </div>
// // //               ) : (
// // //                 <>
// // //                   <span
// // //                     style={{
// // //                       fontSize: "1.5rem",
// // //                       display: "block",
// // //                       marginBottom: "0.4rem",
// // //                     }}
// // //                   >
// // //                     ⬆️
// // //                   </span>
// // //                   <p
// // //                     style={{
// // //                       margin: 0,
// // //                       fontSize: "0.85rem",
// // //                       color: "var(--text-2)",
// // //                     }}
// // //                   >
// // //                     Kéo thả hoặc click để chọn ảnh
// // //                   </p>
// // //                   <p
// // //                     style={{
// // //                       margin: "0.25rem 0 0",
// // //                       fontSize: "0.75rem",
// // //                       color: "var(--text-3)",
// // //                     }}
// // //                   >
// // //                     Tối đa 6 ảnh · JPEG, PNG, WebP
// // //                   </p>
// // //                 </>
// // //               )}
// // //             </div>

// // //             {fileList.length > 0 && (
// // //               <button
// // //                 className="btn btn-primary"
// // //                 style={{
// // //                   width: "100%",
// // //                   marginTop: "0.75rem",
// // //                   background: "var(--ink, #2d2a24)",
// // //                 }}
// // //                 onClick={handleUploadFiles}
// // //                 disabled={uploadingFiles}
// // //               >
// // //                 {uploadingFiles
// // //                   ? "⏳ Đang tải lên..."
// // //                   : `⬆️ Tải lên ${fileList.length} ảnh`}
// // //               </button>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </>
// // //   );
// // // }

// // // // ── Resident Card ──────────────────────────────────────────────────────────────
// // // function ResidentCardLocal({ resident, onEdit, onDelete, onFace }) {
// // //   const av = getAvatar(resident.name);
// // //   const lastSeen = resident.last_seen
// // //     ? formatDistanceToNow(new Date(resident.last_seen), {
// // //         addSuffix: true,
// // //         locale: vi,
// // //       })
// // //     : null;

// // //   return (
// // //     <div
// // //       style={{
// // //         background: "var(--surface)",
// // //         border: "1px solid var(--border)",
// // //         borderRadius: 14,
// // //         padding: "1rem",
// // //         display: "flex",
// // //         flexDirection: "column",
// // //         gap: "0.6rem",
// // //         transition: "box-shadow 0.2s",
// // //       }}
// // //     >
// // //       <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
// // //         <div
// // //           style={{
// // //             width: 44,
// // //             height: 44,
// // //             borderRadius: "50%",
// // //             overflow: "hidden",
// // //             flexShrink: 0,
// // //             border: "2px solid var(--border)",
// // //           }}
// // //         >
// // //           {resident.face_image_url ? (
// // //             <img
// // //               src={resident.face_image_url}
// // //               alt={resident.name}
// // //               style={{ width: "100%", height: "100%", objectFit: "cover" }}
// // //             />
// // //           ) : (
// // //             <div
// // //               style={{
// // //                 width: "100%",
// // //                 height: "100%",
// // //                 background: av.bg,
// // //                 display: "flex",
// // //                 alignItems: "center",
// // //                 justifyContent: "center",
// // //                 fontWeight: 700,
// // //                 fontSize: "0.95rem",
// // //                 color: av.fg,
// // //               }}
// // //             >
// // //               {av.initials}
// // //             </div>
// // //           )}
// // //         </div>
// // //         <div style={{ flex: 1, minWidth: 0 }}>
// // //           <p
// // //             style={{
// // //               margin: 0,
// // //               fontWeight: 600,
// // //               fontSize: "0.9rem",
// // //               overflow: "hidden",
// // //               textOverflow: "ellipsis",
// // //               whiteSpace: "nowrap",
// // //             }}
// // //           >
// // //             {resident.name}
// // //           </p>
// // //           {resident.email && (
// // //             <p
// // //               style={{
// // //                 margin: 0,
// // //                 fontSize: "0.75rem",
// // //                 color: "var(--text-2)",
// // //                 overflow: "hidden",
// // //                 textOverflow: "ellipsis",
// // //                 whiteSpace: "nowrap",
// // //               }}
// // //             >
// // //               {resident.email}
// // //             </p>
// // //           )}
// // //         </div>
// // //         <span
// // //           style={{
// // //             flexShrink: 0,
// // //             width: 8,
// // //             height: 8,
// // //             borderRadius: "50%",
// // //             background: resident.is_active ? "#4a7c59" : "#ccc",
// // //           }}
// // //           title={resident.is_active ? "Đang hoạt động" : "Không hoạt động"}
// // //         />
// // //       </div>

// // //       <div
// // //         style={{
// // //           display: "flex",
// // //           alignItems: "center",
// // //           gap: "0.4rem",
// // //           fontSize: "0.75rem",
// // //         }}
// // //       >
// // //         {resident.has_face_encoding ? (
// // //           <>
// // //             <span style={{ color: "#4a7c59" }}>✅</span>
// // //             <span style={{ color: "#4a7c59" }}>Đã đăng ký khuôn mặt</span>
// // //           </>
// // //         ) : (
// // //           <>
// // //             <span style={{ color: "#c07a30" }}>⚠️</span>
// // //             <span style={{ color: "#c07a30" }}>Chưa có dữ liệu khuôn mặt</span>
// // //           </>
// // //         )}
// // //       </div>

// // //       {lastSeen && (
// // //         <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-3)" }}>
// // //           Lần cuối: {lastSeen}
// // //         </p>
// // //       )}

// // //       <div
// // //         style={{
// // //           display: "flex",
// // //           gap: "0.4rem",
// // //           marginTop: "auto",
// // //           paddingTop: "0.5rem",
// // //           borderTop: "1px solid var(--border)",
// // //         }}
// // //       >
// // //         <button
// // //           className="btn btn-outline"
// // //           style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem" }}
// // //           onClick={onFace}
// // //           title="Thêm/Cập nhật ảnh khuôn mặt"
// // //         >
// // //           📷 Face
// // //         </button>
// // //         <button
// // //           className="btn btn-outline"
// // //           style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem" }}
// // //           onClick={onEdit}
// // //         >
// // //           ✏️ Sửa
// // //         </button>
// // //         <button
// // //           className="btn btn-outline"
// // //           style={{
// // //             flex: 1,
// // //             fontSize: "0.75rem",
// // //             padding: "0.35rem",
// // //             color: "var(--red, #b84040)",
// // //             borderColor: "var(--red, #b84040)",
// // //           }}
// // //           onClick={onDelete}
// // //         >
// // //           🗑️ Xóa
// // //         </button>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // // ── Main Page ──────────────────────────────────────────────────────────────────
// // // export default function Residents() {
// // //   const [page, setPage] = useState(1);
// // //   const [search, setSearch] = useState("");
// // //   const [debouncedSearch, setDS] = useState("");
// // //   const [editResident, setEdit] = useState(null);
// // //   const [showAdd, setShowAdd] = useState(false);
// // //   const [faceResident, setFaceRes] = useState(null);
// // //   const [deleteTarget, setDelTgt] = useState(null);

// // //   // Debounce search
// // //   useEffect(() => {
// // //     const t = setTimeout(() => {
// // //       setDS(search);
// // //       setPage(1);
// // //     }, 350);
// // //     return () => clearTimeout(t);
// // //   }, [search]);

// // //   const { data, isLoading, isError } = useResidents({
// // //     page,
// // //     limit: 12,
// // //     search: debouncedSearch,
// // //   });
// // //   const deleteResident = useDeleteResident();
// // //   const { data: stats } = useQuery({
// // //     queryKey: ["access-stats"],
// // //     queryFn: fetchStats,
// // //     staleTime: 60_000,
// // //   });

// // //   const residents = data?.items || [];
// // //   const total = data?.total || 0;
// // //   const totalPages = Math.ceil(total / 12);

// // //   const handleDelete = async () => {
// // //     if (!deleteTarget) return;
// // //     await deleteResident.mutateAsync(deleteTarget.id);
// // //     setDelTgt(null);
// // //   };

// // //   return (
// // //     <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
// // //       {/* Header */}
// // //       <div
// // //         style={{
// // //           display: "flex",
// // //           alignItems: "center",
// // //           justifyContent: "space-between",
// // //           marginBottom: "1.25rem",
// // //           flexWrap: "wrap",
// // //           gap: "0.75rem",
// // //         }}
// // //       >
// // //         <div>
// // //           <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
// // //             Quản lý Thành viên
// // //           </h1>
// // //           <p
// // //             style={{
// // //               margin: "0.2rem 0 0",
// // //               fontSize: "0.8rem",
// // //               color: "var(--text-2)",
// // //             }}
// // //           >
// // //             {total} thành viên · {stats?.face_enrolled ?? "—"} đã đăng ký khuôn
// // //             mặt
// // //           </p>
// // //         </div>
// // //         <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
// // //           <input
// // //             className="input"
// // //             style={{ width: 200 }}
// // //             placeholder="🔍 Tìm tên..."
// // //             value={search}
// // //             onChange={(e) => setSearch(e.target.value)}
// // //           />
// // //           <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
// // //             + Thêm thành viên
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {/* Grid */}
// // //       {isLoading ? (
// // //         <div
// // //           style={{
// // //             display: "grid",
// // //             gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
// // //             gap: "1rem",
// // //           }}
// // //         >
// // //           {Array.from({ length: 6 }).map((_, i) => (
// // //             <div
// // //               key={i}
// // //               style={{
// // //                 height: 160,
// // //                 background: "var(--surface)",
// // //                 borderRadius: 14,
// // //                 border: "1px solid var(--border)",
// // //                 animation: "pulse 1.5s ease-in-out infinite",
// // //               }}
// // //             />
// // //           ))}
// // //         </div>
// // //       ) : isError ? (
// // //         <div
// // //           style={{
// // //             textAlign: "center",
// // //             padding: "3rem",
// // //             color: "var(--text-2)",
// // //           }}
// // //         >
// // //           <p style={{ fontSize: "2rem" }}>⚠️</p>
// // //           <p>Không tải được danh sách thành viên.</p>
// // //         </div>
// // //       ) : residents.length === 0 ? (
// // //         <div
// // //           style={{
// // //             textAlign: "center",
// // //             padding: "3rem",
// // //             color: "var(--text-2)",
// // //           }}
// // //         >
// // //           <p style={{ fontSize: "2rem" }}>👥</p>
// // //           <p>
// // //             {debouncedSearch
// // //               ? `Không tìm thấy "${debouncedSearch}"`
// // //               : "Chưa có thành viên nào."}
// // //           </p>
// // //           {!debouncedSearch && (
// // //             <button
// // //               className="btn btn-primary"
// // //               style={{ marginTop: "0.75rem" }}
// // //               onClick={() => setShowAdd(true)}
// // //             >
// // //               Thêm ngay
// // //             </button>
// // //           )}
// // //         </div>
// // //       ) : (
// // //         <div
// // //           style={{
// // //             display: "grid",
// // //             gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
// // //             gap: "1rem",
// // //           }}
// // //         >
// // //           {residents.map((r) => (
// // //             <ResidentCardLocal
// // //               key={r.id}
// // //               resident={r}
// // //               onEdit={() => setEdit(r)}
// // //               onDelete={() => setDelTgt(r)}
// // //               onFace={() => setFaceRes(r)}
// // //             />
// // //           ))}
// // //         </div>
// // //       )}

// // //       {/* Pagination */}
// // //       {totalPages > 1 && (
// // //         <div
// // //           style={{
// // //             display: "flex",
// // //             justifyContent: "center",
// // //             gap: "0.5rem",
// // //             marginTop: "1.5rem",
// // //           }}
// // //         >
// // //           <button
// // //             className="btn btn-outline"
// // //             disabled={page === 1}
// // //             onClick={() => setPage((p) => p - 1)}
// // //           >
// // //             ← Trước
// // //           </button>
// // //           <span
// // //             style={{
// // //               display: "flex",
// // //               alignItems: "center",
// // //               fontSize: "0.85rem",
// // //               color: "var(--text-2)",
// // //               padding: "0 0.5rem",
// // //             }}
// // //           >
// // //             Trang {page} / {totalPages}
// // //           </span>
// // //           <button
// // //             className="btn btn-outline"
// // //             disabled={page >= totalPages}
// // //             onClick={() => setPage((p) => p + 1)}
// // //           >
// // //             Tiếp →
// // //           </button>
// // //         </div>
// // //       )}

// // //       {/* Modals */}
// // //       {showAdd && <ResidentModal onClose={() => setShowAdd(false)} />}
// // //       {editResident && (
// // //         <ResidentModal resident={editResident} onClose={() => setEdit(null)} />
// // //       )}
// // //       {faceResident && (
// // //         <FaceEnrollModal
// // //           resident={faceResident}
// // //           onClose={() => setFaceRes(null)}
// // //         />
// // //       )}

// // //       {deleteTarget && (
// // //         <div className="modal-overlay" onClick={() => setDelTgt(null)}>
// // //           <div
// // //             className="modal"
// // //             style={{ maxWidth: 380, textAlign: "center" }}
// // //             onClick={(e) => e.stopPropagation()}
// // //           >
// // //             <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🗑️</p>
// // //             <h3 style={{ margin: "0 0 0.5rem" }}>Xóa thành viên?</h3>
// // //             <p
// // //               style={{
// // //                 color: "var(--text-2)",
// // //                 fontSize: "0.85rem",
// // //                 margin: "0 0 1.25rem",
// // //               }}
// // //             >
// // //               Bạn có chắc muốn xóa <b>{deleteTarget.name}</b>? Hành động này
// // //               không thể hoàn tác.
// // //             </p>
// // //             <div style={{ display: "flex", gap: "0.5rem" }}>
// // //               <button
// // //                 className="btn btn-outline"
// // //                 style={{ flex: 1 }}
// // //                 onClick={() => setDelTgt(null)}
// // //               >
// // //                 Hủy
// // //               </button>
// // //               <button
// // //                 className="btn"
// // //                 style={{
// // //                   flex: 1,
// // //                   background: "var(--red, #b84040)",
// // //                   color: "#fff",
// // //                   border: "none",
// // //                 }}
// // //                 onClick={handleDelete}
// // //                 disabled={deleteResident.isPending}
// // //               >
// // //                 {deleteResident.isPending ? "Đang xóa..." : "Xóa"}
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // }

// // /**
// //  * components/ResidentCard.jsx
// //  * Card displaying resident info, face image, and action buttons.
// //  *
// //  * BUG FIX LOG:
// //  *   [FIX-1] Trạng thái khuôn mặt hiển thị tiếng Việt đúng ngữ cảnh:
// //  *           - has_face_encoding = true  → ✅ "Đã có dữ liệu khuôn mặt" (xanh lá)
// //  *           - face_image_url có nhưng has_face_encoding = false
// //  *                                       → ⚠️ "Ảnh chưa được mã hóa" (vàng)
// //  *           - Cả hai đều null/false     → ❌ "Chưa có dữ liệu khuôn mặt" (đỏ cam)
// //  *
// //  *   [FIX-2] Bảo vệ trường hợp resident.created_at bị null/undefined
// //  *           (tránh crash khi backend trả dữ liệu thiếu).
// //  *
// //  *   Không thay đổi gì khác ngoài phần logic hiển thị trạng thái khuôn mặt
// //  *   và date formatting guard.
// //  */

// // import {
// //   User,
// //   Pencil,
// //   Trash2,
// //   Camera,
// //   CheckCircle,
// //   XCircle,
// //   AlertCircle,
// // } from "lucide-react";
// // import { format } from "date-fns";

// // /**
// //  * [FIX-1] FaceStatusBadge — hiển thị đúng 3 trạng thái:
// //  *   1. has_face_encoding = true     → Đã có dữ liệu khuôn mặt (xanh lá)
// //  *   2. face_image_url có nhưng chưa encode → Ảnh chưa được mã hóa (vàng)
// //  *   3. Chưa có gì cả               → Chưa có dữ liệu khuôn mặt (đỏ cam)
// //  */
// // function FaceStatusBadge({ hasFaceEncoding, faceImageUrl }) {
// //   if (hasFaceEncoding) {
// //     return (
// //       <div className="flex items-center gap-1.5 text-xs">
// //         <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
// //         <span className="text-green-400">Đã có dữ liệu khuôn mặt</span>
// //       </div>
// //     );
// //   }

// //   if (faceImageUrl) {
// //     // Có ảnh nhưng chưa chạy qua enroll → face_encoding chưa có
// //     return (
// //       <div className="flex items-center gap-1.5 text-xs">
// //         <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
// //         <span className="text-amber-400">Ảnh chưa được mã hóa</span>
// //       </div>
// //     );
// //   }

// //   // Không có gì cả
// //   return (
// //     <div className="flex items-center gap-1.5 text-xs">
// //       <XCircle size={13} className="text-red-400 flex-shrink-0" />
// //       <span className="text-red-400">⚠️ Chưa có dữ liệu khuôn mặt</span>
// //     </div>
// //   );
// // }

// // export default function ResidentCard({
// //   resident,
// //   onEdit,
// //   onDelete,
// //   onUploadFace,
// // }) {
// //   // [FIX-2] Guard: tránh crash nếu created_at là null/undefined
// //   const createdAtLabel = resident.created_at
// //     ? `Thêm lúc ${format(new Date(resident.created_at), "dd/MM/yyyy")}`
// //     : "Ngày tạo không rõ";

// //   return (
// //     <div className="card flex flex-col gap-4 hover:border-gray-700 transition-colors animate-fade-in">
// //       {/* Avatar + name */}
// //       <div className="flex items-start gap-3">
// //         <div className="relative flex-shrink-0">
// //           {resident.face_image_url ? (
// //             <img
// //               src={resident.face_image_url}
// //               alt={resident.name}
// //               className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
// //             />
// //           ) : (
// //             <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
// //               <User size={24} className="text-gray-600" />
// //             </div>
// //           )}

// //           {/* Active indicator */}
// //           <span
// //             className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900
// //               ${resident.is_active ? "bg-green-400" : "bg-gray-600"}`}
// //           />
// //         </div>

// //         <div className="flex-1 min-w-0">
// //           <p className="text-white font-semibold text-sm truncate">
// //             {resident.name}
// //           </p>
// //           {resident.email && (
// //             <p className="text-gray-500 text-xs truncate">{resident.email}</p>
// //           )}
// //           {resident.phone && (
// //             <p className="text-gray-600 text-xs">{resident.phone}</p>
// //           )}
// //         </div>
// //       </div>

// //       {/* [FIX-1] Face encoding status — hiển thị đúng 3 trạng thái */}
// //       <FaceStatusBadge
// //         hasFaceEncoding={resident.has_face_encoding}
// //         faceImageUrl={resident.face_image_url}
// //       />

// //       {/* Created date */}
// //       <p className="text-gray-700 text-xs">{createdAtLabel}</p>

// //       {/* Action buttons */}
// //       <div className="flex gap-2 mt-auto pt-2 border-t border-gray-800">
// //         <button
// //           onClick={onUploadFace}
// //           className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-400
// //                      hover:bg-blue-900/30 rounded-lg transition-colors"
// //           title="Tải ảnh khuôn mặt"
// //         >
// //           <Camera size={13} />
// //           Khuôn mặt
// //         </button>
// //         <button
// //           onClick={onEdit}
// //           className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-400
// //                      hover:bg-gray-800 rounded-lg transition-colors"
// //           title="Chỉnh sửa thông tin"
// //         >
// //           <Pencil size={13} />
// //           Sửa
// //         </button>
// //         <button
// //           onClick={onDelete}
// //           className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-400
// //                      hover:bg-red-900/30 rounded-lg transition-colors"
// //           title="Xóa người dân"
// //         >
// //           <Trash2 size={13} />
// //           Xóa
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// /**
//  * Residents.jsx — Quản lý cư dân & Đăng ký khuôn mặt
//  *
//  * CHANGELOG:
//  *   [SỬA] CameraModal.startCamera(): Tăng resolution ideal lên 1280x720
//  *         (cũ: 640x480) — ảnh to hơn giúp backend detect khuôn mặt chắc chắn hơn
//  *   [SỬA] CameraModal.handleCapture(): Tăng quality JPEG 0.92 → 0.95
//  *         để giữ chi tiết khuôn mặt
//  *   [SỬA] FaceEnrollModal: Hiển thị error message từ API rõ ràng hơn
//  *         thay vì toast ngắn gọn
//  *   [SỬA] FaceEnrollModal.handleSaveCapture(): Bắt lỗi 400 từ backend
//  *         và hiển thị chi tiết trong UI thay vì toast
//  *   [GIỮ] Toàn bộ logic ResidentModal, ResidentCard, danh sách không đổi
//  */
// import { useState, useRef, useEffect, useCallback } from "react";
// import {
//   useResidents,
//   useCreateResident,
//   useUpdateResident,
//   useDeleteResident,
//   useUploadFaceImage,
//   useEnrollResidentFaceFromDashboard,
// } from "../hooks/useResidents.js";
// import { useQuery } from "@tanstack/react-query";
// import { formatDistanceToNow } from "date-fns";
// import { vi } from "date-fns/locale";
// import apiClient from "../api/apiClient.js";

// const fetchStats = () =>
//   apiClient.get("/access-logs/stats").then((r) => r.data);

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

// // ── Add/Edit Modal ─────────────────────────────────────────────────────────────
// function ResidentModal({ resident, onClose }) {
//   const isEdit = !!resident;
//   const [form, setForm] = useState({
//     name: resident?.name || "",
//     email: resident?.email || "",
//     phone: resident?.phone || "",
//   });
//   const create = useCreateResident();
//   const update = useUpdateResident();
//   const busy = create.isPending || update.isPending;

//   const submit = async (e) => {
//     e.preventDefault();
//     isEdit
//       ? await update.mutateAsync({ id: resident.id, ...form })
//       : await create.mutateAsync(form);
//     onClose();
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal" onClick={(e) => e.stopPropagation()}>
//         <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem" }}>
//           {isEdit ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
//         </h2>
//         <form
//           onSubmit={submit}
//           style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
//         >
//           {[
//             {
//               label: "Họ và tên *",
//               key: "name",
//               type: "text",
//               placeholder: "Nguyễn Văn A",
//               required: true,
//             },
//             {
//               label: "Email",
//               key: "email",
//               type: "email",
//               placeholder: "email@example.com",
//             },
//             {
//               label: "Số điện thoại",
//               key: "phone",
//               type: "text",
//               placeholder: "0901234567",
//             },
//           ].map(({ label, key, type, placeholder, required }) => (
//             <div key={key}>
//               <label
//                 style={{
//                   display: "block",
//                   fontSize: "0.78rem",
//                   color: "var(--text-2)",
//                   marginBottom: 4,
//                 }}
//               >
//                 {label}
//               </label>
//               <input
//                 className="input"
//                 type={type}
//                 value={form[key]}
//                 onChange={(e) => setForm({ ...form, [key]: e.target.value })}
//                 placeholder={placeholder}
//                 required={required}
//               />
//             </div>
//           ))}
//           <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
//             <button
//               type="button"
//               className="btn btn-outline"
//               style={{ flex: 1 }}
//               onClick={onClose}
//             >
//               Hủy
//             </button>
//             <button
//               type="submit"
//               className="btn btn-primary"
//               style={{ flex: 1 }}
//               disabled={busy}
//             >
//               {busy
//                 ? "Đang lưu..."
//                 : isEdit
//                   ? "Lưu thay đổi"
//                   : "Thêm thành viên"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ── Camera Modal ───────────────────────────────────────────────────────────────
// function CameraModal({ onDone, onClose }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);

//   const [capturedImages, setCapturedImages] = useState([]);
//   const [cameraError, setCameraError] = useState(null);
//   const [isReady, setIsReady] = useState(false);
//   const [flashActive, setFlashActive] = useState(false);

//   useEffect(() => {
//     let mounted = true;

//     const startCamera = async () => {
//       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//         if (!mounted) return;
//         const isLocalhost = ["localhost", "127.0.0.1"].includes(
//           window.location.hostname,
//         );
//         const isHttps = window.location.protocol === "https:";
//         setCameraError(
//           !isHttps && !isLocalhost
//             ? "INSECURE_CONTEXT"
//             : "Trình duyệt không hỗ trợ camera.",
//         );
//         return;
//       }

//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             // [SỬA] Tăng resolution lên 1280x720 để ảnh đủ lớn cho face detection
//             width: { ideal: 1280, min: 640 },
//             height: { ideal: 720, min: 480 },
//             facingMode: "user",
//           },
//           audio: false,
//         });
//         if (!mounted) {
//           stream.getTracks().forEach((t) => t.stop());
//           return;
//         }
//         streamRef.current = stream;
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           videoRef.current.onloadedmetadata = () => {
//             if (mounted) setIsReady(true);
//           };
//         }
//       } catch (err) {
//         if (!mounted) return;
//         if (
//           err.name === "NotAllowedError" ||
//           err.name === "PermissionDeniedError"
//         ) {
//           setCameraError(
//             "Trình duyệt đã từ chối quyền truy cập Camera. Vui lòng nhấn vào biểu tượng khóa trên thanh địa chỉ và chọn 'Cho phép'.",
//           );
//         } else if (
//           err.name === "NotFoundError" ||
//           err.name === "DevicesNotFoundError"
//         ) {
//           setCameraError(
//             "Không tìm thấy Camera trên thiết bị này. Vui lòng kết nối webcam và thử lại.",
//           );
//         } else {
//           setCameraError(`Không thể khởi động Camera: ${err.message}`);
//         }
//       }
//     };

//     startCamera();
//     return () => {
//       mounted = false;
//       stopStream();
//     };
//   }, []);

//   const stopStream = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//   }, []);

//   const handleCapture = useCallback(() => {
//     if (!videoRef.current || !canvasRef.current || !isReady) return;

//     const video = videoRef.current;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");

//     canvas.width = video.videoWidth || 1280;
//     canvas.height = video.videoHeight || 720;

//     // [FIX] Flip canvas ngang để match với giao diện mirror (scaleX(-1))
//     // → ảnh backend nhận sẽ đúng chiều như user nhìn thấy
//     ctx.save();
//     ctx.scale(-1, 1);
//     ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
//     ctx.restore();

//     const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

//     setFlashActive(true);
//     setTimeout(() => setFlashActive(false), 150);
//     setCapturedImages((prev) => [...prev, dataUrl]);
//   }, [isReady]);

//   const handleDone = useCallback(() => {
//     stopStream();
//     onDone(capturedImages);
//   }, [capturedImages, stopStream, onDone]);
//   const handleClose = useCallback(() => {
//     stopStream();
//     onClose();
//   }, [stopStream, onClose]);

//   return (
//     <div
//       className="modal-overlay"
//       onClick={handleClose}
//       style={{ zIndex: 1100 }}
//     >
//       <div
//         className="modal"
//         style={{ maxWidth: 560, padding: "1.25rem" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginBottom: "1rem",
//           }}
//         >
//           <h2 style={{ margin: 0, fontSize: "1rem" }}>
//             📸 Camera — Chụp ảnh khuôn mặt
//           </h2>
//           <button
//             onClick={handleClose}
//             style={{
//               background: "none",
//               border: "none",
//               fontSize: "1.2rem",
//               cursor: "pointer",
//               color: "var(--text-3)",
//               lineHeight: 1,
//               padding: "0.2rem",
//             }}
//           >
//             ✕
//           </button>
//         </div>

//         {cameraError ? (
//           <div
//             style={{
//               background: "var(--red-bg, #f5e8e8)",
//               border: "1px solid var(--red, #b84040)",
//               borderRadius: 8,
//               padding: "1.25rem",
//             }}
//           >
//             <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
//               <p style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🔒</p>
//               <p
//                 style={{
//                   fontWeight: 700,
//                   color: "var(--red-text, #8b2020)",
//                   fontSize: "0.9rem",
//                 }}
//               >
//                 {cameraError === "INSECURE_CONTEXT"
//                   ? "Không thể truy cập Camera qua HTTP"
//                   : "Không thể khởi động Camera"}
//               </p>
//             </div>
//             {cameraError === "INSECURE_CONTEXT" ? (
//               <div
//                 style={{
//                   fontSize: "0.82rem",
//                   color: "var(--red-text, #8b2020)",
//                   lineHeight: 1.6,
//                 }}
//               >
//                 <p style={{ marginBottom: "0.6rem" }}>
//                   Trình duyệt chặn camera vì trang đang chạy trên{" "}
//                   <b>HTTP không bảo mật</b>. Camera chỉ hoạt động trên{" "}
//                   <b>HTTPS</b> hoặc <b>localhost</b>.
//                 </p>
//                 <p style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
//                   ✅ Khắc phục nhanh (Chrome / Edge):
//                 </p>
//                 <ol style={{ paddingLeft: "1.2rem", margin: "0 0 0.75rem" }}>
//                   <li>
//                     Dán:{" "}
//                     <code
//                       style={{
//                         background: "rgba(0,0,0,0.08)",
//                         padding: "0.1rem 0.35rem",
//                         borderRadius: 4,
//                         fontSize: "0.78rem",
//                         userSelect: "all",
//                       }}
//                     >
//                       chrome://flags/#unsafely-treat-insecure-origin-as-secure
//                     </code>
//                   </li>
//                   <li>
//                     Thêm{" "}
//                     <code
//                       style={{
//                         background: "rgba(0,0,0,0.08)",
//                         padding: "0.1rem 0.35rem",
//                         borderRadius: 4,
//                         fontSize: "0.78rem",
//                         userSelect: "all",
//                       }}
//                     >
//                       {window.location.origin}
//                     </code>{" "}
//                     vào ô nhập liệu
//                   </li>
//                   <li>
//                     Chọn <b>Enabled</b> → bấm <b>Relaunch</b>
//                   </li>
//                 </ol>
//               </div>
//             ) : (
//               <p
//                 style={{
//                   color: "var(--red-text, #8b2020)",
//                   fontSize: "0.85rem",
//                   lineHeight: 1.5,
//                   textAlign: "center",
//                 }}
//               >
//                 {cameraError}
//               </p>
//             )}
//             <button
//               className="btn btn-outline"
//               style={{ marginTop: "1rem", width: "100%" }}
//               onClick={handleClose}
//             >
//               Đóng
//             </button>
//           </div>
//         ) : (
//           <>
//             <div
//               style={{
//                 position: "relative",
//                 borderRadius: 10,
//                 overflow: "hidden",
//                 background: "#000",
//                 aspectRatio: "4/3",
//                 marginBottom: "0.75rem",
//               }}
//             >
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 style={{
//                   width: "100%",
//                   height: "100%",
//                   objectFit: "cover",
//                   display: "block",
//                   transform: "scaleX(-1)",
//                 }}
//               />
//               {flashActive && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     inset: 0,
//                     background: "rgba(255,255,255,0.55)",
//                     pointerEvents: "none",
//                   }}
//                 />
//               )}
//               {isReady && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     inset: 0,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     pointerEvents: "none",
//                   }}
//                 >
//                   <div
//                     style={{
//                       width: "42%",
//                       aspectRatio: "3/4",
//                       border: "2.5px dashed rgba(255,255,255,0.75)",
//                       borderRadius: "50%",
//                       boxShadow: "0 0 0 9999px rgba(0,0,0,0.28)",
//                     }}
//                   />
//                   <div
//                     style={{
//                       position: "absolute",
//                       top: "0.6rem",
//                       left: 0,
//                       right: 0,
//                       textAlign: "center",
//                     }}
//                   >
//                     <span
//                       style={{
//                         background: "rgba(0,0,0,0.55)",
//                         color: "#fff",
//                         fontSize: "0.72rem",
//                         padding: "0.2rem 0.6rem",
//                         borderRadius: 20,
//                       }}
//                     >
//                       Căn mặt vào khung · Nhìn thẳng vào camera
//                     </span>
//                   </div>
//                   <div
//                     style={{
//                       position: "absolute",
//                       bottom: "0.6rem",
//                       right: "0.6rem",
//                     }}
//                   >
//                     <span
//                       style={{
//                         background:
//                           capturedImages.length > 0
//                             ? "rgba(74,124,89,0.9)"
//                             : "rgba(0,0,0,0.6)",
//                         color: "#fff",
//                         fontSize: "0.75rem",
//                         fontWeight: 600,
//                         padding: "0.25rem 0.6rem",
//                         borderRadius: 20,
//                       }}
//                     >
//                       Đã chụp: {capturedImages.length} ảnh
//                     </span>
//                   </div>
//                 </div>
//               )}
//               {!isReady && !cameraError && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     inset: 0,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     background: "#111",
//                     color: "rgba(255,255,255,0.5)",
//                     flexDirection: "column",
//                     gap: "0.5rem",
//                     fontSize: "0.85rem",
//                   }}
//                 >
//                   <span style={{ fontSize: "1.75rem" }}>📷</span>
//                   <span>Đang khởi động camera...</span>
//                 </div>
//               )}
//             </div>

//             <canvas ref={canvasRef} style={{ display: "none" }} />

//             {capturedImages.length > 0 && (
//               <div
//                 style={{
//                   display: "flex",
//                   gap: "0.4rem",
//                   flexWrap: "wrap",
//                   marginBottom: "0.75rem",
//                 }}
//               >
//                 {capturedImages.map((src, i) => (
//                   <img
//                     key={i}
//                     src={src}
//                     alt={`Ảnh ${i + 1}`}
//                     style={{
//                       width: 48,
//                       height: 48,
//                       objectFit: "cover",
//                       borderRadius: 6,
//                       border: "2px solid var(--green, #4a7c59)",
//                       transform: "scaleX(-1)",
//                     }}
//                   />
//                 ))}
//               </div>
//             )}

//             <div style={{ display: "flex", gap: "0.5rem" }}>
//               <button
//                 className="btn btn-outline"
//                 style={{ flex: "0 0 auto", minWidth: 70 }}
//                 onClick={handleClose}
//               >
//                 Hủy
//               </button>
//               <button
//                 className="btn btn-primary"
//                 style={{ flex: 1 }}
//                 onClick={handleCapture}
//                 disabled={!isReady}
//               >
//                 📸 Chụp ảnh
//               </button>
//               <button
//                 className="btn"
//                 style={{
//                   flex: "0 0 auto",
//                   minWidth: 100,
//                   background:
//                     capturedImages.length > 0
//                       ? "var(--green, #4a7c59)"
//                       : "var(--surface-2)",
//                   color: capturedImages.length > 0 ? "#fff" : "var(--text-3)",
//                   border: "none",
//                   cursor: capturedImages.length > 0 ? "pointer" : "not-allowed",
//                 }}
//                 onClick={capturedImages.length > 0 ? handleDone : undefined}
//                 disabled={capturedImages.length === 0}
//               >
//                 ✅ Hoàn tất
//               </button>
//             </div>
//             <p
//               style={{
//                 fontSize: "0.72rem",
//                 color: "var(--text-3)",
//                 marginTop: "0.5rem",
//                 textAlign: "center",
//               }}
//             >
//               Chụp nhiều góc mặt khác nhau để tăng độ chính xác nhận diện
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// // ── Face Enroll Modal ──────────────────────────────────────────────────────────
// function FaceEnrollModal({ resident, onClose }) {
//   const [fileList, setFileList] = useState([]);
//   const [filePreviews, setFilePreviews] = useState([]);
//   const [uploadingFiles, setUploadingFiles] = useState(false);

//   const [showCamera, setShowCamera] = useState(false);
//   const [capturedB64, setCapturedB64] = useState([]);
//   const [savingCapture, setSavingCapture] = useState(false);

//   // [THÊM] State lưu lỗi API chi tiết
//   const [apiError, setApiError] = useState(null);

//   const uploadFile = useUploadFaceImage();
//   const enroll = useEnrollResidentFaceFromDashboard();

//   const handleFiles = (e) => {
//     const fs = Array.from(e.target.files).slice(0, 6);
//     setFileList(fs);
//     setFilePreviews(fs.map((f) => URL.createObjectURL(f)));
//     setCapturedB64([]);
//     setApiError(null);
//   };

//   const handleUploadFiles = async () => {
//     if (!fileList.length) return;
//     setUploadingFiles(true);
//     setApiError(null);
//     try {
//       for (const f of fileList) {
//         await uploadFile.mutateAsync({ id: resident.id, file: f });
//       }
//       onClose();
//     } catch (err) {
//       const msg =
//         err?.response?.data?.detail || err?.message || "Upload thất bại.";
//       setApiError(msg);
//     } finally {
//       setUploadingFiles(false);
//     }
//   };

//   // Webcam: nhận mảng Base64 từ CameraModal
//   const handleCameraDone = (images) => {
//     setCapturedB64(images);
//     setShowCamera(false);
//     setFileList([]);
//     setFilePreviews([]);
//     setApiError(null);
//   };

//   // [SỬA] Bắt lỗi 400 từ backend và hiển thị trong UI
//   const handleSaveCapture = async () => {
//     if (!capturedB64.length) return;
//     setSavingCapture(true);
//     setApiError(null);
//     try {
//       await enroll.mutateAsync({ id: resident.id, images: capturedB64 });
//       onClose();
//     } catch (err) {
//       // Lấy message chi tiết từ response body (backend trả về string có xuống dòng)
//       const detail =
//         err?.response?.data?.detail ||
//         err?.message ||
//         "Lưu khuôn mặt thất bại.";
//       setApiError(detail);
//     } finally {
//       setSavingCapture(false);
//     }
//   };

//   // Drag & drop
//   const handleDrop = (e) => {
//     e.preventDefault();
//     const fs = Array.from(e.dataTransfer.files)
//       .filter((f) => f.type.startsWith("image/"))
//       .slice(0, 6);
//     if (!fs.length) return;
//     setFileList(fs);
//     setFilePreviews(fs.map((f) => URL.createObjectURL(f)));
//     setCapturedB64([]);
//     setApiError(null);
//   };

//   return (
//     <>
//       {showCamera && (
//         <CameraModal
//           onDone={handleCameraDone}
//           onClose={() => setShowCamera(false)}
//         />
//       )}

//       <div className="modal-overlay" onClick={onClose}>
//         <div
//           className="modal"
//           style={{ maxWidth: 560 }}
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* Header */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               marginBottom: "1.25rem",
//             }}
//           >
//             <div>
//               <h2 style={{ margin: 0, fontSize: "1rem" }}>
//                 Thêm ảnh khuôn mặt
//               </h2>
//               <p
//                 style={{
//                   margin: "0.2rem 0 0",
//                   fontSize: "0.8rem",
//                   color: "var(--text-2)",
//                 }}
//               >
//                 Thành viên: <b>{resident?.name}</b>
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               style={{
//                 background: "none",
//                 border: "none",
//                 fontSize: "1.2rem",
//                 cursor: "pointer",
//                 color: "var(--text-3)",
//               }}
//             >
//               ✕
//             </button>
//           </div>

//           {/* [THÊM] Hiển thị lỗi API rõ ràng trong UI */}
//           {apiError && (
//             <div
//               style={{
//                 background: "var(--red-bg, #f5e8e8)",
//                 border: "1px solid var(--red, #b84040)",
//                 borderRadius: 8,
//                 padding: "0.75rem 1rem",
//                 marginBottom: "1rem",
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "flex-start",
//                   gap: "0.5rem",
//                 }}
//               >
//                 <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>❌</span>
//                 <div>
//                   <p
//                     style={{
//                       margin: 0,
//                       fontWeight: 700,
//                       color: "var(--red-text, #8b2020)",
//                       fontSize: "0.85rem",
//                       marginBottom: "0.25rem",
//                     }}
//                   >
//                     Không lưu được ảnh khuôn mặt
//                   </p>
//                   <p
//                     style={{
//                       margin: 0,
//                       color: "var(--red-text, #8b2020)",
//                       fontSize: "0.8rem",
//                       whiteSpace: "pre-wrap",
//                       lineHeight: 1.5,
//                     }}
//                   >
//                     {apiError}
//                   </p>
//                   <p
//                     style={{
//                       margin: "0.5rem 0 0",
//                       color: "var(--red-text, #8b2020)",
//                       fontSize: "0.78rem",
//                     }}
//                   >
//                     💡 Thử chụp lại với mặt nhìn thẳng, đủ ánh sáng, không bị
//                     che khuất.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ── Phần 1: Webcam ── */}
//           <div
//             style={{
//               border: "1px solid var(--border)",
//               borderRadius: 10,
//               padding: "1rem",
//               marginBottom: "0.75rem",
//             }}
//           >
//             <p
//               style={{
//                 margin: "0 0 0.5rem",
//                 fontWeight: 600,
//                 fontSize: "0.88rem",
//               }}
//             >
//               📷 Chụp ảnh khuôn mặt (Webcam)
//             </p>
//             <p
//               style={{
//                 margin: "0 0 0.75rem",
//                 fontSize: "0.78rem",
//                 color: "var(--text-2)",
//                 lineHeight: 1.5,
//               }}
//             >
//               Sử dụng camera của thiết bị này để chụp trực tiếp. Chụp nhiều góc
//               để tăng độ chính xác nhận diện.
//             </p>

//             {capturedB64.length > 0 ? (
//               <>
//                 <div
//                   style={{
//                     display: "flex",
//                     gap: "0.4rem",
//                     flexWrap: "wrap",
//                     marginBottom: "0.75rem",
//                   }}
//                 >
//                   {capturedB64.map((src, i) => (
//                     <img
//                       key={i}
//                       src={src}
//                       alt={`Ảnh ${i + 1}`}
//                       style={{
//                         width: 56,
//                         height: 56,
//                         objectFit: "cover",
//                         borderRadius: 6,
//                         border: "2px solid var(--green, #4a7c59)",
//                       }}
//                     />
//                   ))}
//                 </div>
//                 <div style={{ display: "flex", gap: "0.5rem" }}>
//                   <button
//                     className="btn btn-outline"
//                     style={{ flex: 1 }}
//                     onClick={() => {
//                       setCapturedB64([]);
//                       setApiError(null);
//                     }}
//                   >
//                     🔄 Chụp lại
//                   </button>
//                   <button
//                     className="btn btn-primary"
//                     style={{ flex: 2, background: "var(--ink, #2d2a24)" }}
//                     onClick={handleSaveCapture}
//                     disabled={savingCapture}
//                   >
//                     {savingCapture
//                       ? "⏳ Đang lưu..."
//                       : `💾 Lưu ${capturedB64.length} ảnh`}
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <button
//                 className="btn btn-outline"
//                 style={{ width: "100%" }}
//                 onClick={() => {
//                   setShowCamera(true);
//                   setApiError(null);
//                 }}
//               >
//                 📸 Mở camera &amp; chụp ảnh
//               </button>
//             )}
//           </div>

//           {/* Divider */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "0.75rem",
//               margin: "0.5rem 0",
//             }}
//           >
//             <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
//             <span
//               style={{
//                 fontSize: "0.75rem",
//                 color: "var(--text-3)",
//                 textTransform: "uppercase",
//                 letterSpacing: "0.05em",
//               }}
//             >
//               HOẶC
//             </span>
//             <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
//           </div>

//           {/* ── Phần 2: Upload file ── */}
//           <div
//             style={{
//               border: "1px solid var(--border)",
//               borderRadius: 10,
//               padding: "1rem",
//             }}
//           >
//             <p
//               style={{
//                 margin: "0 0 0.75rem",
//                 fontWeight: 600,
//                 fontSize: "0.88rem",
//               }}
//             >
//               📁 Tải ảnh lên từ thiết bị
//             </p>

//             <div
//               onDragOver={(e) => e.preventDefault()}
//               onDrop={handleDrop}
//               style={{
//                 border: "1.5px dashed var(--border)",
//                 borderRadius: 8,
//                 padding: "1.25rem",
//                 textAlign: "center",
//                 cursor: "pointer",
//                 transition: "border-color 0.2s",
//               }}
//               onClick={() =>
//                 document.getElementById(`file-input-${resident?.id}`)?.click()
//               }
//             >
//               <input
//                 id={`file-input-${resident?.id}`}
//                 type="file"
//                 accept="image/jpeg,image/png,image/webp"
//                 multiple
//                 style={{ display: "none" }}
//                 onChange={handleFiles}
//               />
//               {filePreviews.length > 0 ? (
//                 <div
//                   style={{
//                     display: "flex",
//                     gap: "0.4rem",
//                     flexWrap: "wrap",
//                     justifyContent: "center",
//                   }}
//                 >
//                   {filePreviews.map((src, i) => (
//                     <img
//                       key={i}
//                       src={src}
//                       alt=""
//                       style={{
//                         width: 56,
//                         height: 56,
//                         objectFit: "cover",
//                         borderRadius: 6,
//                         border: "2px solid var(--border)",
//                       }}
//                     />
//                   ))}
//                 </div>
//               ) : (
//                 <>
//                   <span
//                     style={{
//                       fontSize: "1.5rem",
//                       display: "block",
//                       marginBottom: "0.4rem",
//                     }}
//                   >
//                     ⬆️
//                   </span>
//                   <p
//                     style={{
//                       margin: 0,
//                       fontSize: "0.85rem",
//                       color: "var(--text-2)",
//                     }}
//                   >
//                     Kéo thả hoặc click để chọn ảnh
//                   </p>
//                   <p
//                     style={{
//                       margin: "0.25rem 0 0",
//                       fontSize: "0.75rem",
//                       color: "var(--text-3)",
//                     }}
//                   >
//                     Tối đa 6 ảnh · JPEG, PNG, WebP
//                   </p>
//                 </>
//               )}
//             </div>

//             {fileList.length > 0 && (
//               <button
//                 className="btn btn-primary"
//                 style={{
//                   width: "100%",
//                   marginTop: "0.75rem",
//                   background: "var(--ink, #2d2a24)",
//                 }}
//                 onClick={handleUploadFiles}
//                 disabled={uploadingFiles}
//               >
//                 {uploadingFiles
//                   ? "⏳ Đang tải lên..."
//                   : `⬆️ Tải lên ${fileList.length} ảnh`}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// // ── Resident Card ──────────────────────────────────────────────────────────────
// function ResidentCardLocal({ resident, onEdit, onDelete, onFace }) {
//   if (!resident) return null; // [FIX] guard against undefined resident
//   const av = getAvatar(resident.name);
//   const lastSeen = resident.last_seen
//     ? formatDistanceToNow(new Date(resident.last_seen), {
//         addSuffix: true,
//         locale: vi,
//       })
//     : null;

//   return (
//     <div
//       style={{
//         background: "var(--surface)",
//         border: "1px solid var(--border)",
//         borderRadius: 14,
//         padding: "1rem",
//         display: "flex",
//         flexDirection: "column",
//         gap: "0.6rem",
//         transition: "box-shadow 0.2s",
//       }}
//     >
//       <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
//         <div
//           style={{
//             width: 44,
//             height: 44,
//             borderRadius: "50%",
//             overflow: "hidden",
//             flexShrink: 0,
//             border: "2px solid var(--border)",
//           }}
//         >
//           {resident.face_image_url ? (
//             <img
//               src={resident.face_image_url}
//               alt={resident.name}
//               style={{ width: "100%", height: "100%", objectFit: "cover" }}
//             />
//           ) : (
//             <div
//               style={{
//                 width: "100%",
//                 height: "100%",
//                 background: av.bg,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontWeight: 700,
//                 fontSize: "0.95rem",
//                 color: av.fg,
//               }}
//             >
//               {av.initials}
//             </div>
//           )}
//         </div>
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <p
//             style={{
//               margin: 0,
//               fontWeight: 600,
//               fontSize: "0.9rem",
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {resident.name}
//           </p>
//           {resident.email && (
//             <p
//               style={{
//                 margin: 0,
//                 fontSize: "0.75rem",
//                 color: "var(--text-2)",
//                 overflow: "hidden",
//                 textOverflow: "ellipsis",
//                 whiteSpace: "nowrap",
//               }}
//             >
//               {resident.email}
//             </p>
//           )}
//         </div>
//         <span
//           style={{
//             flexShrink: 0,
//             width: 8,
//             height: 8,
//             borderRadius: "50%",
//             background: resident.is_active ? "#4a7c59" : "#ccc",
//           }}
//           title={resident.is_active ? "Đang hoạt động" : "Không hoạt động"}
//         />
//       </div>

//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "0.4rem",
//           fontSize: "0.75rem",
//         }}
//       >
//         {resident.has_face_encoding ? (
//           <>
//             <span style={{ color: "#4a7c59" }}>✅</span>
//             <span style={{ color: "#4a7c59" }}>Đã đăng ký khuôn mặt</span>
//           </>
//         ) : (
//           <>
//             <span style={{ color: "#c07a30" }}>⚠️</span>
//             <span style={{ color: "#c07a30" }}>Chưa có dữ liệu khuôn mặt</span>
//           </>
//         )}
//       </div>

//       {lastSeen && (
//         <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-3)" }}>
//           Lần cuối: {lastSeen}
//         </p>
//       )}

//       <div
//         style={{
//           display: "flex",
//           gap: "0.4rem",
//           marginTop: "auto",
//           paddingTop: "0.5rem",
//           borderTop: "1px solid var(--border)",
//         }}
//       >
//         <button
//           className="btn btn-outline"
//           style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem" }}
//           onClick={onFace}
//           title="Thêm/Cập nhật ảnh khuôn mặt"
//         >
//           📷 Face
//         </button>
//         <button
//           className="btn btn-outline"
//           style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem" }}
//           onClick={onEdit}
//         >
//           ✏️ Sửa
//         </button>
//         <button
//           className="btn btn-outline"
//           style={{
//             flex: 1,
//             fontSize: "0.75rem",
//             padding: "0.35rem",
//             color: "var(--red, #b84040)",
//             borderColor: "var(--red, #b84040)",
//           }}
//           onClick={onDelete}
//         >
//           🗑️ Xóa
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Main Page ──────────────────────────────────────────────────────────────────
// export default function Residents() {
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDS] = useState("");
//   const [editResident, setEdit] = useState(null);
//   const [showAdd, setShowAdd] = useState(false);
//   const [faceResident, setFaceRes] = useState(null);
//   const [deleteTarget, setDelTgt] = useState(null);

//   // Debounce search
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setDS(search);
//       setPage(1);
//     }, 350);
//     return () => clearTimeout(t);
//   }, [search]);

//   const { data, isLoading, isError } = useResidents({
//     page,
//     limit: 12,
//     search: debouncedSearch,
//   });
//   const deleteResident = useDeleteResident();
//   const { data: stats } = useQuery({
//     queryKey: ["access-stats"],
//     queryFn: fetchStats,
//     staleTime: 60_000,
//   });

//   const residents = (data?.items || []).filter(Boolean);
//   const total = data?.total || 0;
//   const totalPages = Math.ceil(total / 12);

//   const handleDelete = async () => {
//     if (!deleteTarget) return;
//     await deleteResident.mutateAsync(deleteTarget.id);
//     setDelTgt(null);
//   };

//   return (
//     <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
//       {/* Header */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           marginBottom: "1.25rem",
//           flexWrap: "wrap",
//           gap: "0.75rem",
//         }}
//       >
//         <div>
//           <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
//             Quản lý Thành viên
//           </h1>
//           <p
//             style={{
//               margin: "0.2rem 0 0",
//               fontSize: "0.8rem",
//               color: "var(--text-2)",
//             }}
//           >
//             {total} thành viên · {stats?.face_enrolled ?? "—"} đã đăng ký khuôn
//             mặt
//           </p>
//         </div>
//         <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
//           <input
//             className="input"
//             style={{ width: 200 }}
//             placeholder="🔍 Tìm tên..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
//             + Thêm thành viên
//           </button>
//         </div>
//       </div>

//       {/* Grid */}
//       {isLoading ? (
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
//             gap: "1rem",
//           }}
//         >
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div
//               key={i}
//               style={{
//                 height: 160,
//                 background: "var(--surface)",
//                 borderRadius: 14,
//                 border: "1px solid var(--border)",
//                 animation: "pulse 1.5s ease-in-out infinite",
//               }}
//             />
//           ))}
//         </div>
//       ) : isError ? (
//         <div
//           style={{
//             textAlign: "center",
//             padding: "3rem",
//             color: "var(--text-2)",
//           }}
//         >
//           <p style={{ fontSize: "2rem" }}>⚠️</p>
//           <p>Không tải được danh sách thành viên.</p>
//         </div>
//       ) : residents.length === 0 ? (
//         <div
//           style={{
//             textAlign: "center",
//             padding: "3rem",
//             color: "var(--text-2)",
//           }}
//         >
//           <p style={{ fontSize: "2rem" }}>👥</p>
//           <p>
//             {debouncedSearch
//               ? `Không tìm thấy "${debouncedSearch}"`
//               : "Chưa có thành viên nào."}
//           </p>
//           {!debouncedSearch && (
//             <button
//               className="btn btn-primary"
//               style={{ marginTop: "0.75rem" }}
//               onClick={() => setShowAdd(true)}
//             >
//               Thêm ngay
//             </button>
//           )}
//         </div>
//       ) : (
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
//             gap: "1rem",
//           }}
//         >
//           {residents.map((r) => (
//             <ResidentCardLocal
//               key={r.id}
//               resident={r}
//               onEdit={() => setEdit(r)}
//               onDelete={() => setDelTgt(r)}
//               onFace={() => setFaceRes(r)}
//             />
//           ))}
//         </div>
//       )}

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "center",
//             gap: "0.5rem",
//             marginTop: "1.5rem",
//           }}
//         >
//           <button
//             className="btn btn-outline"
//             disabled={page === 1}
//             onClick={() => setPage((p) => p - 1)}
//           >
//             ← Trước
//           </button>
//           <span
//             style={{
//               display: "flex",
//               alignItems: "center",
//               fontSize: "0.85rem",
//               color: "var(--text-2)",
//               padding: "0 0.5rem",
//             }}
//           >
//             Trang {page} / {totalPages}
//           </span>
//           <button
//             className="btn btn-outline"
//             disabled={page >= totalPages}
//             onClick={() => setPage((p) => p + 1)}
//           >
//             Tiếp →
//           </button>
//         </div>
//       )}

//       {/* Modals */}
//       {showAdd && <ResidentModal onClose={() => setShowAdd(false)} />}
//       {editResident && (
//         <ResidentModal resident={editResident} onClose={() => setEdit(null)} />
//       )}
//       {faceResident && (
//         <FaceEnrollModal
//           resident={faceResident}
//           onClose={() => setFaceRes(null)}
//         />
//       )}

//       {deleteTarget && (
//         <div className="modal-overlay" onClick={() => setDelTgt(null)}>
//           <div
//             className="modal"
//             style={{ maxWidth: 380, textAlign: "center" }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🗑️</p>
//             <h3 style={{ margin: "0 0 0.5rem" }}>Xóa thành viên?</h3>
//             <p
//               style={{
//                 color: "var(--text-2)",
//                 fontSize: "0.85rem",
//                 margin: "0 0 1.25rem",
//               }}
//             >
//               Bạn có chắc muốn xóa <b>{deleteTarget.name}</b>? Hành động này
//               không thể hoàn tác.
//             </p>
//             <div style={{ display: "flex", gap: "0.5rem" }}>
//               <button
//                 className="btn btn-outline"
//                 style={{ flex: 1 }}
//                 onClick={() => setDelTgt(null)}
//               >
//                 Hủy
//               </button>
//               <button
//                 className="btn"
//                 style={{
//                   flex: 1,
//                   background: "var(--red, #b84040)",
//                   color: "#fff",
//                   border: "none",
//                 }}
//                 onClick={handleDelete}
//                 disabled={deleteResident.isPending}
//               >
//                 {deleteResident.isPending ? "Đang xóa..." : "Xóa"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

/**
 * Residents.jsx — Quản lý cư dân & Đăng ký khuôn mặt
 *
 * CHANGELOG & OPTIMIZATIONS:
 * [TỐI ƯU] CameraModal.handleCapture(): Áp dụng kỹ thuật Client-side Resize.
 * Ảnh chụp từ camera (1280x720) sẽ được vẽ lại lên một canvas
 * có kích thước nhỏ hơn (chiều rộng tối đa 800px) trước khi xuất
 * ra Base64. Giảm chất lượng JPEG xuống 0.85.
 * Mục đích: Giảm dung lượng payload từ ~5MB xuống chỉ còn ~300KB-500KB
 * cho 5 bức ảnh, giúp upload cực nhanh và không làm treo Backend/Frontend.
 * [SỬA] FaceEnrollModal: Bắt lỗi và hiển thị rõ ràng thông báo từ API.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  useResidents,
  useCreateResident,
  useUpdateResident,
  useDeleteResident,
  useUploadFaceImage,
  useEnrollResidentFaceFromDashboard,
} from "../hooks/useResidents.js";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import apiClient from "../api/apiClient.js";

import {
  User,
  Pencil,
  Trash2,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

const fetchStats = () =>
  apiClient.get("/access-logs/stats").then((r) => r.data);

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

// ── Add/Edit Modal ─────────────────────────────────────────────────────────────
function ResidentModal({ resident, onClose }) {
  const isEdit = !!resident;
  const [form, setForm] = useState({
    name: resident?.name || "",
    email: resident?.email || "",
    phone: resident?.phone || "",
  });
  const create = useCreateResident();
  const update = useUpdateResident();
  const busy = create.isPending || update.isPending;

  const submit = async (e) => {
    e.preventDefault();
    isEdit
      ? await update.mutateAsync({ id: resident.id, ...form })
      : await create.mutateAsync(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem" }}>
          {isEdit ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {[
            {
              label: "Họ và tên *",
              key: "name",
              type: "text",
              placeholder: "Nguyễn Văn A",
              required: true,
            },
            {
              label: "Email",
              key: "email",
              type: "email",
              placeholder: "email@example.com",
            },
            {
              label: "Số điện thoại",
              key: "phone",
              type: "text",
              placeholder: "0901234567",
            },
          ].map(({ label, key, type, placeholder, required }) => (
            <div key={key}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "var(--text-2)",
                  marginBottom: 4,
                }}
              >
                {label}
              </label>
              <input
                className="input"
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                required={required}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={busy}
            >
              {busy
                ? "Đang lưu..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Thêm thành viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Camera Modal ───────────────────────────────────────────────────────────────
function CameraModal({ onDone, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedImages, setCapturedImages] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!mounted) return;
        const isLocalhost = ["localhost", "127.0.0.1"].includes(
          window.location.hostname,
        );
        const isHttps = window.location.protocol === "https:";
        setCameraError(
          !isHttps && !isLocalhost
            ? "INSECURE_CONTEXT"
            : "Trình duyệt không hỗ trợ camera.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
          },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (mounted) setIsReady(true);
          };
        }
      } catch (err) {
        if (!mounted) return;
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setCameraError(
            "Trình duyệt đã từ chối quyền truy cập Camera. Vui lòng nhấn vào biểu tượng khóa trên thanh địa chỉ và chọn 'Cho phép'.",
          );
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setCameraError(
            "Không tìm thấy Camera trên thiết bị này. Vui lòng kết nối webcam và thử lại.",
          );
        } else {
          setCameraError(`Không thể khởi động Camera: ${err.message}`);
        }
      }
    };

    startCamera();
    return () => {
      mounted = false;
      stopStream();
    };
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Lấy kích thước gốc của video
    const origWidth = video.videoWidth || 1280;
    const origHeight = video.videoHeight || 720;

    // [TỐI ƯU] Client-side Resize: Giảm kích thước ảnh xuống tối đa 800px chiều rộng
    const MAX_WIDTH = 800;
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (origWidth > MAX_WIDTH) {
      targetWidth = MAX_WIDTH;
      targetHeight = Math.floor((origHeight * MAX_WIDTH) / origWidth);
    }

    // Set kích thước canvas bằng kích thước đã thu nhỏ
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.save();
    // Flip ảnh để giống với giao diện gương
    ctx.scale(-1, 1);
    ctx.drawImage(video, -targetWidth, 0, targetWidth, targetHeight);
    ctx.restore();

    // Xuất ra Base64 với chất lượng JPEG 0.85 (Đủ nét cho AI, giảm mạnh dung lượng file)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);
    setCapturedImages((prev) => [...prev, dataUrl]);
  }, [isReady]);

  const handleDone = useCallback(() => {
    stopStream();
    onDone(capturedImages);
  }, [capturedImages, stopStream, onDone]);

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{ zIndex: 1100 }}
    >
      <div
        className="modal"
        style={{ maxWidth: 560, padding: "1.25rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem" }}>
            📸 Camera — Chụp ảnh khuôn mặt
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "var(--text-3)",
              lineHeight: 1,
              padding: "0.2rem",
            }}
          >
            ✕
          </button>
        </div>

        {cameraError ? (
          <div
            style={{
              background: "var(--red-bg, #f5e8e8)",
              border: "1px solid var(--red, #b84040)",
              borderRadius: 8,
              padding: "1.25rem",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🔒</p>
              <p
                style={{
                  fontWeight: 700,
                  color: "var(--red-text, #8b2020)",
                  fontSize: "0.9rem",
                }}
              >
                {cameraError === "INSECURE_CONTEXT"
                  ? "Không thể truy cập Camera qua HTTP"
                  : "Không thể khởi động Camera"}
              </p>
            </div>
            {cameraError === "INSECURE_CONTEXT" ? (
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--red-text, #8b2020)",
                  lineHeight: 1.6,
                }}
              >
                <p style={{ marginBottom: "0.6rem" }}>
                  Trình duyệt chặn camera vì trang đang chạy trên{" "}
                  <b>HTTP không bảo mật</b>. Camera chỉ hoạt động trên{" "}
                  <b>HTTPS</b> hoặc <b>localhost</b>.
                </p>
                <p style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
                  ✅ Khắc phục nhanh (Chrome / Edge):
                </p>
                <ol style={{ paddingLeft: "1.2rem", margin: "0 0 0.75rem" }}>
                  <li>
                    Dán:{" "}
                    <code
                      style={{
                        background: "rgba(0,0,0,0.08)",
                        padding: "0.1rem 0.35rem",
                        borderRadius: 4,
                        fontSize: "0.78rem",
                        userSelect: "all",
                      }}
                    >
                      chrome://flags/#unsafely-treat-insecure-origin-as-secure
                    </code>
                  </li>
                  <li>
                    Thêm{" "}
                    <code
                      style={{
                        background: "rgba(0,0,0,0.08)",
                        padding: "0.1rem 0.35rem",
                        borderRadius: 4,
                        fontSize: "0.78rem",
                        userSelect: "all",
                      }}
                    >
                      {window.location.origin}
                    </code>{" "}
                    vào ô nhập liệu
                  </li>
                  <li>
                    Chọn <b>Enabled</b> → bấm <b>Relaunch</b>
                  </li>
                </ol>
              </div>
            ) : (
              <p
                style={{
                  color: "var(--red-text, #8b2020)",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                {cameraError}
              </p>
            )}
            <button
              className="btn btn-outline"
              style={{ marginTop: "1rem", width: "100%" }}
              onClick={handleClose}
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                background: "#000",
                aspectRatio: "4/3",
                marginBottom: "0.75rem",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform: "scaleX(-1)",
                }}
              />
              {flashActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0.55)",
                    pointerEvents: "none",
                  }}
                />
              )}
              {isReady && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: "42%",
                      aspectRatio: "3/4",
                      border: "2.5px dashed rgba(255,255,255,0.75)",
                      borderRadius: "50%",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.28)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "0.6rem",
                      left: 0,
                      right: 0,
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: "0.72rem",
                        padding: "0.2rem 0.6rem",
                        borderRadius: 20,
                      }}
                    >
                      Căn mặt vào khung · Nhìn thẳng vào camera
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0.6rem",
                      right: "0.6rem",
                    }}
                  >
                    <span
                      style={{
                        background:
                          capturedImages.length > 0
                            ? "rgba(74,124,89,0.9)"
                            : "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.25rem 0.6rem",
                        borderRadius: 20,
                      }}
                    >
                      Đã chụp: {capturedImages.length} ảnh
                    </span>
                  </div>
                </div>
              )}
              {!isReady && !cameraError && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#111",
                    color: "rgba(255,255,255,0.5)",
                    flexDirection: "column",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontSize: "1.75rem" }}>📷</span>
                  <span>Đang khởi động camera...</span>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {capturedImages.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  flexWrap: "wrap",
                  marginBottom: "0.75rem",
                }}
              >
                {capturedImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Ảnh ${i + 1}`}
                    style={{
                      width: 48,
                      height: 48,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "2px solid var(--green, #4a7c59)",
                      transform: "scaleX(-1)",
                    }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-outline"
                style={{ flex: "0 0 auto", minWidth: 70 }}
                onClick={handleClose}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleCapture}
                disabled={!isReady}
              >
                📸 Chụp ảnh
              </button>
              <button
                className="btn"
                style={{
                  flex: "0 0 auto",
                  minWidth: 100,
                  background:
                    capturedImages.length > 0
                      ? "var(--green, #4a7c59)"
                      : "var(--surface-2)",
                  color: capturedImages.length > 0 ? "#fff" : "var(--text-3)",
                  border: "none",
                  cursor: capturedImages.length > 0 ? "pointer" : "not-allowed",
                }}
                onClick={capturedImages.length > 0 ? handleDone : undefined}
                disabled={capturedImages.length === 0}
              >
                ✅ Hoàn tất
              </button>
            </div>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-3)",
                marginTop: "0.5rem",
                textAlign: "center",
              }}
            >
              Chụp nhiều góc mặt khác nhau để tăng độ chính xác nhận diện
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Face Enroll Modal ──────────────────────────────────────────────────────────
function FaceEnrollModal({ resident, onClose }) {
  const [fileList, setFileList] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const [capturedB64, setCapturedB64] = useState([]);
  const [savingCapture, setSavingCapture] = useState(false);

  const [apiError, setApiError] = useState(null);

  const uploadFile = useUploadFaceImage();
  const enroll = useEnrollResidentFaceFromDashboard();

  const handleFiles = (e) => {
    const fs = Array.from(e.target.files).slice(0, 6);
    setFileList(fs);
    setFilePreviews(fs.map((f) => URL.createObjectURL(f)));
    setCapturedB64([]);
    setApiError(null);
  };

  const handleUploadFiles = async () => {
    if (!fileList.length) return;
    setUploadingFiles(true);
    setApiError(null);
    try {
      for (const f of fileList) {
        await uploadFile.mutateAsync({ id: resident.id, file: f });
      }
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.message || "Upload thất bại.";
      setApiError(msg);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCameraDone = (images) => {
    setCapturedB64(images);
    setShowCamera(false);
    setFileList([]);
    setFilePreviews([]);
    setApiError(null);
  };

  const handleSaveCapture = async () => {
    if (!capturedB64.length) return;
    setSavingCapture(true);
    setApiError(null);
    try {
      await enroll.mutateAsync({ id: resident.id, images: capturedB64 });
      onClose();
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Lưu khuôn mặt thất bại.";
      setApiError(detail);
    } finally {
      setSavingCapture(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fs = Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6);
    if (!fs.length) return;
    setFileList(fs);
    setFilePreviews(fs.map((f) => URL.createObjectURL(f)));
    setCapturedB64([]);
    setApiError(null);
  };

  return (
    <>
      {showCamera && (
        <CameraModal
          onDone={handleCameraDone}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal"
          style={{ maxWidth: 560 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem" }}>
                Thêm ảnh khuôn mặt
              </h2>
              <p
                style={{
                  margin: "0.2rem 0 0",
                  fontSize: "0.8rem",
                  color: "var(--text-2)",
                }}
              >
                Thành viên: <b>{resident?.name}</b>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                color: "var(--text-3)",
              }}
            >
              ✕
            </button>
          </div>

          {apiError && (
            <div
              style={{
                background: "var(--red-bg, #f5e8e8)",
                border: "1px solid var(--red, #b84040)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>❌</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      color: "var(--red-text, #8b2020)",
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Không lưu được ảnh khuôn mặt
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--red-text, #8b2020)",
                      fontSize: "0.8rem",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.5,
                    }}
                  >
                    {apiError}
                  </p>
                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      color: "var(--red-text, #8b2020)",
                      fontSize: "0.78rem",
                    }}
                  >
                    💡 Thử chụp lại với mặt nhìn thẳng, đủ ánh sáng, không bị
                    che khuất.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Phần 1: Webcam ── */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "1rem",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem",
                fontWeight: 600,
                fontSize: "0.88rem",
              }}
            >
              📷 Chụp ảnh khuôn mặt (Webcam)
            </p>
            <p
              style={{
                margin: "0 0 0.75rem",
                fontSize: "0.78rem",
                color: "var(--text-2)",
                lineHeight: 1.5,
              }}
            >
              Sử dụng camera của thiết bị này để chụp trực tiếp. Chụp nhiều góc
              để tăng độ chính xác nhận diện.
            </p>

            {capturedB64.length > 0 ? (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    flexWrap: "wrap",
                    marginBottom: "0.75rem",
                  }}
                >
                  {capturedB64.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Ảnh ${i + 1}`}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "2px solid var(--green, #4a7c59)",
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setCapturedB64([]);
                      setApiError(null);
                    }}
                  >
                    🔄 Chụp lại
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 2, background: "var(--ink, #2d2a24)" }}
                    onClick={handleSaveCapture}
                    disabled={savingCapture}
                  >
                    {savingCapture
                      ? "⏳ Đang lưu..."
                      : `💾 Lưu ${capturedB64.length} ảnh`}
                  </button>
                </div>
              </>
            ) : (
              <button
                className="btn btn-outline"
                style={{ width: "100%" }}
                onClick={() => {
                  setShowCamera(true);
                  setApiError(null);
                }}
              >
                📸 Mở camera &amp; chụp ảnh
              </button>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: "0.5rem 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              HOẶC
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* ── Phần 2: Upload file ── */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "1rem",
            }}
          >
            <p
              style={{
                margin: "0 0 0.75rem",
                fontWeight: 600,
                fontSize: "0.88rem",
              }}
            >
              📁 Tải ảnh lên từ thiết bị
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: "1.5px dashed var(--border)",
                borderRadius: 8,
                padding: "1.25rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() =>
                document.getElementById(`file-input-${resident?.id}`)?.click()
              }
            >
              <input
                id={`file-input-${resident?.id}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: "none" }}
                onChange={handleFiles}
              />
              {filePreviews.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {filePreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "2px solid var(--border)",
                      }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      display: "block",
                      marginBottom: "0.4rem",
                    }}
                  >
                    ⬆️
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      color: "var(--text-2)",
                    }}
                  >
                    Kéo thả hoặc click để chọn ảnh
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0 0",
                      fontSize: "0.75rem",
                      color: "var(--text-3)",
                    }}
                  >
                    Tối đa 6 ảnh · JPEG, PNG, WebP
                  </p>
                </>
              )}
            </div>

            {fileList.length > 0 && (
              <button
                className="btn btn-primary"
                style={{
                  width: "100%",
                  marginTop: "0.75rem",
                  background: "var(--ink, #2d2a24)",
                }}
                onClick={handleUploadFiles}
                disabled={uploadingFiles}
              >
                {uploadingFiles
                  ? "⏳ Đang tải lên..."
                  : `⬆️ Tải lên ${fileList.length} ảnh`}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Resident Card ──────────────────────────────────────────────────────────────
function ResidentCardLocal({ resident, onEdit, onDelete, onFace }) {
  if (!resident) return null;
  const av = getAvatar(resident.name);
  const lastSeen = resident.last_seen
    ? formatDistanceToNow(new Date(resident.last_seen), {
        addSuffix: true,
        locale: vi,
      })
    : null;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            border: "2px solid var(--border)",
          }}
        >
          {resident.face_image_url ? (
            <img
              src={resident.face_image_url}
              alt={resident.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: av.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: av.fg,
              }}
            >
              {av.initials}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: "0.9rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {resident.name}
          </p>
          {resident.email && (
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "var(--text-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {resident.email}
            </p>
          )}
        </div>
        <span
          style={{
            flexShrink: 0,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: resident.is_active ? "#4a7c59" : "#ccc",
          }}
          title={resident.is_active ? "Đang hoạt động" : "Không hoạt động"}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.75rem",
        }}
      >
        {resident.has_face_encoding ? (
          <>
            <span style={{ color: "#4a7c59" }}>✅</span>
            <span style={{ color: "#4a7c59" }}>Đã đăng ký khuôn mặt</span>
          </>
        ) : (
          <>
            <span style={{ color: "#c07a30" }}>⚠️</span>
            <span style={{ color: "#c07a30" }}>Chưa có dữ liệu khuôn mặt</span>
          </>
        )}
      </div>

      {lastSeen && (
        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-3)" }}>
          Lần cuối: {lastSeen}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          marginTop: "auto",
          paddingTop: "0.5rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          className="btn btn-outline"
          style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem" }}
          onClick={onFace}
          title="Thêm/Cập nhật ảnh khuôn mặt"
        >
          📷 Face
        </button>
        <button
          className="btn btn-outline"
          style={{ flex: 1, fontSize: "0.75rem", padding: "0.35rem" }}
          onClick={onEdit}
        >
          ✏️ Sửa
        </button>
        <button
          className="btn btn-outline"
          style={{
            flex: 1,
            fontSize: "0.75rem",
            padding: "0.35rem",
            color: "var(--red, #b84040)",
            borderColor: "var(--red, #b84040)",
          }}
          onClick={onDelete}
        >
          🗑️ Xóa
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Residents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDS] = useState("");
  const [editResident, setEdit] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [faceResident, setFaceRes] = useState(null);
  const [deleteTarget, setDelTgt] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDS(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError } = useResidents({
    page,
    limit: 12,
    search: debouncedSearch,
  });
  const deleteResident = useDeleteResident();
  const { data: stats } = useQuery({
    queryKey: ["access-stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });

  const residents = (data?.items || []).filter(Boolean);
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteResident.mutateAsync(deleteTarget.id);
    setDelTgt(null);
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
            Quản lý Thành viên
          </h1>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.8rem",
              color: "var(--text-2)",
            }}
          >
            {total} thành viên · {stats?.face_enrolled ?? "—"} đã đăng ký khuôn
            mặt
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            className="input"
            style={{ width: 200 }}
            placeholder="🔍 Tìm tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Thêm thành viên
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 160,
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : isError ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-2)",
          }}
        >
          <p style={{ fontSize: "2rem" }}>⚠️</p>
          <p>Không tải được danh sách thành viên.</p>
        </div>
      ) : residents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-2)",
          }}
        >
          <p style={{ fontSize: "2rem" }}>👥</p>
          <p>
            {debouncedSearch
              ? `Không tìm thấy "${debouncedSearch}"`
              : "Chưa có thành viên nào."}
          </p>
          {!debouncedSearch && (
            <button
              className="btn btn-primary"
              style={{ marginTop: "0.75rem" }}
              onClick={() => setShowAdd(true)}
            >
              Thêm ngay
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {residents.map((r) => (
            <ResidentCardLocal
              key={r.id}
              resident={r}
              onEdit={() => setEdit(r)}
              onDelete={() => setDelTgt(r)}
              onFace={() => setFaceRes(r)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "0.85rem",
              color: "var(--text-2)",
              padding: "0 0.5rem",
            }}
          >
            Trang {page} / {totalPages}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Tiếp →
          </button>
        </div>
      )}

      {/* Modals */}
      {showAdd && <ResidentModal onClose={() => setShowAdd(false)} />}
      {editResident && (
        <ResidentModal resident={editResident} onClose={() => setEdit(null)} />
      )}
      {faceResident && (
        <FaceEnrollModal
          resident={faceResident}
          onClose={() => setFaceRes(null)}
        />
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDelTgt(null)}>
          <div
            className="modal"
            style={{ maxWidth: 380, textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>🗑️</p>
            <h3 style={{ margin: "0 0 0.5rem" }}>Xóa thành viên?</h3>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: "0.85rem",
                margin: "0 0 1.25rem",
              }}
            >
              Bạn có chắc muốn xóa <b>{deleteTarget.name}</b>? Hành động này
              không thể hoàn tác.
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setDelTgt(null)}
              >
                Hủy
              </button>
              <button
                className="btn"
                style={{
                  flex: 1,
                  background: "var(--red, #b84040)",
                  color: "#fff",
                  border: "none",
                }}
                onClick={handleDelete}
                disabled={deleteResident.isPending}
              >
                {deleteResident.isPending ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
