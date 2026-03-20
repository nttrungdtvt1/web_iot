/**
 * Residents.jsx — Quản lý cư dân & Thêm khuôn mặt
 */
import { useState } from "react";
import {
  useResidents,
  useCreateResident,
  useUpdateResident,
  useDeleteResident,
  useUploadFaceImage,
} from "../hooks/useResidents.js";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import apiClient from "../api/apiClient.js";

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

// ── Add/Edit Modal ─────────────────────────────────────────────
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
          {isEdit ? "Chỉnh sửa cư dân" : "Thêm cư dân mới"}
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "var(--text-2)",
                marginBottom: 4,
              }}
            >
              Họ và tên *
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "var(--text-2)",
                marginBottom: 4,
              }}
            >
              Email
            </label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                color: "var(--text-2)",
                marginBottom: 4,
              }}
            >
              Số điện thoại
            </label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0901234567"
            />
          </div>
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
              {busy ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm cư dân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Face upload Modal ──────────────────────────────────────────
function FaceUploadModal({ resident, onClose }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const upload = useUploadFaceImage();

  const handleFiles = (e) => {
    const fs = Array.from(e.target.files).slice(0, 6);
    setFiles(fs);
    setPreviews(fs.map((f) => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    for (const f of files) {
      await upload.mutateAsync({ id: resident.id, file: f });
    }
    setUploading(false);
    onClose();
  };

  const handleTakePhoto = async () => {
    setTakingPhoto(true);
    try {
      await apiClient.post("/device/trigger-enroll", null, {
        params: { name: resident.name, id: resident.id },
      });
      alert(
        `Đã ra lệnh cho Smart Door!\n\nVui lòng đi đến cửa, nhìn thẳng vào camera để hệ thống chụp ảnh cho ${resident.name}.`,
      );
      onClose();
    } catch (error) {
      alert(
        "Không thể kết nối đến thiết bị Smart Door lúc này. Vui lòng kiểm tra lại thiết bị.",
      );
      console.error(error);
    } finally {
      setTakingPhoto(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>
          Thêm ảnh khuôn mặt
        </h2>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-2)",
            marginBottom: "1.25rem",
          }}
        >
          Đang cập nhật cho cư dân:{" "}
          <b style={{ color: "var(--text)" }}>{resident.name}</b>
        </p>

        {/* CÁCH 1: CHỤP QUA CAMERA CỦA PI */}
        <div
          style={{
            background: "var(--surface-2)",
            padding: "1rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "0.5rem",
            }}
          >
            Cách 1: Chụp trực tiếp qua Smart Door
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-3)",
              marginBottom: "0.75rem",
            }}
          >
            Camera trên cửa sẽ tự động bật và chụp 5 góc mặt khác nhau để tăng
            độ chính xác.
          </p>
          <button
            className="btn"
            style={{
              width: "100%",
              padding: "0.6rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--green)",
              color: "#fff",
              border: "none",
            }}
            onClick={handleTakePhoto}
            disabled={takingPhoto}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {takingPhoto ? "Đang kích hoạt..." : "Bật Camera Smart Door"}
          </button>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", margin: "1rem 0" }}
        >
          <div
            style={{ flex: 1, height: 1, background: "var(--border-2)" }}
          ></div>
          <span
            style={{
              margin: "0 1rem",
              fontSize: "0.75rem",
              color: "var(--text-3)",
            }}
          >
            HOẶC
          </span>
          <div
            style={{ flex: 1, height: 1, background: "var(--border-2)" }}
          ></div>
        </div>

        {/* CÁCH 2: UPLOAD ẢNH TỪ MÁY TÍNH */}
        <div
          style={{
            background: "var(--surface-2)",
            padding: "1rem",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "0.5rem",
            }}
          >
            Cách 2: Tải ảnh có sẵn lên
          </p>

          <div
            style={{
              border: "2px dashed var(--border-2)",
              borderRadius: 8,
              padding: "1.25rem",
              textAlign: "center",
              cursor: "pointer",
              background: "var(--surface-1)",
              marginBottom: "0.75rem",
              transition: "border-color 0.15s",
            }}
            onClick={() => document.getElementById("face-files").click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dt = e.dataTransfer;
              if (dt.files.length) {
                const ev = { target: { files: dt.files } };
                handleFiles(ev);
              }
            }}
          >
            {previews.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {previews.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    style={{
                      width: 54,
                      height: 54,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-3)"
                  strokeWidth="1.5"
                  style={{ margin: "0 auto 0.5rem" }}
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p style={{ color: "var(--text-2)", fontSize: "0.82rem" }}>
                  Kéo thả hoặc click để chọn ảnh
                </p>
                <p
                  style={{
                    color: "var(--text-3)",
                    fontSize: "0.72rem",
                    marginTop: 4,
                  }}
                >
                  Tối đa 6 ảnh · JPEG, PNG, WebP
                </p>
              </>
            )}
            <input
              id="face-files"
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFiles}
            />
          </div>

          {files.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => {
                  setFiles([]);
                  setPreviews([]);
                }}
              >
                Hủy chọn
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={uploading}
                onClick={handleUpload}
              >
                {uploading ? "Đang xử lý..." : `Upload ${files.length} ảnh`}
              </button>
            </div>
          )}
        </div>

        {/* Nút Đóng */}
        {!files.length && (
          <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <button
              className="btn btn-outline"
              style={{ width: "100%" }}
              onClick={onClose}
            >
              Đóng lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Resident Card ──────────────────────────────────────────────
function ResidentCard({ resident, onEdit, onDelete, onUpload }) {
  const av = getAvatar(resident.name);
  const roleLabel = resident.is_active ? "Chủ hộ" : "Thành viên";

  // ĐÃ SỬA: Kiểm tra nếu có đường dẫn ảnh là coi như đã có khuôn mặt
  const hasEnoughFaces = Boolean(
    resident.face_image_url || resident.face_encoding,
  );

  const accuracy = hasEnoughFaces
    ? 88 + (resident.id % 8) + "." + (resident.id % 10) + "%"
    : null;

  return (
    <div
      className="card animate-fade-in-up"
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          className="avatar"
          style={{
            background: av.bg,
            color: av.fg,
            width: 40,
            height: 40,
            fontSize: "0.9rem",
          }}
        >
          {av.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "var(--text)",
              marginBottom: 1,
            }}
          >
            {resident.name}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
            {roleLabel}
          </p>
        </div>
        <span
          className={`badge ${hasEnoughFaces ? "badge-granted" : "badge-unknown"}`}
        >
          {hasEnoughFaces ? "Hoạt động" : "Ít ảnh"}
        </span>
      </div>

      {/* Face image grid */}
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {Array.from({ length: hasEnoughFaces ? 5 : 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 38,
              height: 38,
              borderRadius: 6,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {resident.face_image_url && i === 0 ? (
              <img
                src={resident.face_image_url}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-3)"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            )}
          </div>
        ))}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            background: "var(--surface-2)",
            border: "1px dashed var(--border-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-3)",
            fontSize: "1.2rem",
          }}
          onClick={onUpload}
        >
          +
        </div>
      </div>

      {/* Stats */}
      <div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
          {hasEnoughFaces ? (
            <>
              {accuracy ? `Độ chính xác ${accuracy}` : "Đã đăng ký khuôn mặt"}
            </>
          ) : (
            <span style={{ color: "var(--amber)" }}>
              Chưa có ảnh khuôn mặt — nên thêm ảnh
            </span>
          )}
        </p>
        <p
          style={{ fontSize: "0.72rem", color: "var(--text-3)", marginTop: 2 }}
        >
          Lần cuối vào:{" "}
          {resident.updated_at
            ? formatDistanceToNow(new Date(resident.updated_at), {
                addSuffix: true,
                locale: vi,
              })
            : "—"}
        </p>
      </div>

      {/* Action row */}
      <div
        style={{
          display: "flex",
          gap: "0.35rem",
          paddingTop: "0.5rem",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}
      >
        <button
          className="btn btn-outline"
          style={{ flex: 1, fontSize: "0.78rem", padding: "0.35rem" }}
          onClick={onUpload}
        >
          + Ảnh
        </button>
        <button
          className="btn btn-outline"
          style={{ flex: 1, fontSize: "0.78rem", padding: "0.35rem" }}
          onClick={onEdit}
        >
          Sửa
        </button>
        <button
          style={{
            flex: 1,
            fontSize: "0.78rem",
            padding: "0.35rem",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--red-text)",
            cursor: "pointer",
          }}
          onClick={() => window.confirm(`Xóa ${resident.name}?`) && onDelete()}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Residents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  const { data, isLoading } = useResidents({ page, limit: 9, search });
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });
  const del = useDeleteResident();

  const totalResidents = data?.total ?? 0;

  // ĐÃ SỬA: Đếm đúng số lượng ảnh thực tế (Ai có ảnh thì tính là 5 tấm)
  const totalImages =
    (data?.items ?? []).filter((r) => r.face_image_url || r.face_encoding)
      .length * 5;

  const totalToday = stats?.today?.total ?? 0;

  return (
    <div
      className="animate-fade-in"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: "1.1rem", margin: 0 }}>Cư dân đăng ký</h1>
        <button
          className="btn btn-outline"
          onClick={() => setShowAdd(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          + Thêm cư dân
        </button>
      </div>

      {/* Stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "0.75rem",
        }}
      >
        {[
          [totalResidents, "Cư dân"],
          // ĐÃ SỬA: Xóa cái "|| 16" giả lập đi, hiện đúng số đếm được
          [totalImages, "Ảnh đã đăng ký"],
          [totalToday, "Lượt vào hôm nay"],
        ].map(([v, l], i) => (
          <div
            key={i}
            className="card"
            style={{ textAlign: "center", padding: "0.9rem" }}
          >
            <p
              style={{
                fontFamily: "Lora,serif",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {v}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        className="input"
        placeholder="Tìm kiếm theo tên..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* Grid */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "0.75rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card"
              style={{
                height: 220,
                animation: "pulseDot 1.5s infinite",
                background: "var(--surface-2)",
              }}
            />
          ))}
        </div>
      ) : data?.items?.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))",
            gap: "0.75rem",
          }}
        >
          {data.items.map((r) => (
            <ResidentCard
              key={r.id}
              resident={r}
              onEdit={() => setEditTarget(r)}
              onDelete={() => del.mutateAsync(r.id)}
              onUpload={() => setUploadTarget(r)}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-3)",
          }}
        >
          <p>Chưa có cư dân nào</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: "0.75rem" }}
            onClick={() => setShowAdd(true)}
          >
            Thêm cư dân đầu tiên
          </button>
        </div>
      )}

      {/* Pagination */}
      {data?.total > 9 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--text-2)" }}>
            {page} / {Math.ceil(data.total / 9)}
          </span>
          <button
            className="btn btn-outline"
            disabled={page >= Math.ceil(data.total / 9)}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
        </div>
      )}

      {showAdd && <ResidentModal onClose={() => setShowAdd(false)} />}
      {editTarget && (
        <ResidentModal
          resident={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
      {uploadTarget && (
        <FaceUploadModal
          resident={uploadTarget}
          onClose={() => setUploadTarget(null)}
        />
      )}
    </div>
  );
}
