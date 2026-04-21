/**
 * Settings.jsx — System Configuration (Cấu hình hệ thống)
 * UI Redesign v2: Modern Dashboard — Tối giản, Sang trọng
 *
 * [FIX]: Đã móc nối API cho chức năng "Lưu cấu hình thiết bị" (Còi báo động & Tự động khóa).
 */
import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../api/apiClient"; // ✅ Import apiClient để gửi lệnh về Backend

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  pageBg: "#F8FAFC", // slate-50
  cardBg: "#FFFFFF",

  heading: "#0F172A", // slate-900
  body: "#334155", // slate-700
  muted: "#94A3B8", // slate-400
  caption: "#64748B", // slate-500

  border: "#E2E8F0", // slate-200
  borderHr: "#F1F5F9", // slate-100 — dùng cho <hr> mờ

  inputBg: "#FAFAFA",
  inputBorder: "#E2E8F0",
  inputFocus: "#6366F1", // indigo-500

  primary: "#1E293B", // slate-800
  primaryHover: "#0F172A", // slate-900
  primaryDisabled: "#94A3B8",

  dangerText: "#DC2626", // red-600
  dangerBg: "#FEF2F2", // red-50
  dangerBgHover: "#DC2626",
  dangerBorder: "#FECACA", // red-200

  warningText: "#D97706", // amber-600
  warningBg: "#FFFBEB", // amber-50
  warningBgHover: "#D97706",
  warningBorder: "#FDE68A", // amber-200

  successText: "#059669", // emerald-600
  successBg: "#ECFDF5", // emerald-50
  successBorder: "#A7F3D0", // emerald-200

  toggleOn: "#6366F1", // indigo-500
  toggleOff: "#CBD5E1", // slate-300
};

// ─── Shared style objects ──────────────────────────────────────────────────────
const card = {
  background: T.cardBg,
  borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const inputBase = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  fontSize: "0.875rem",
  color: T.heading,
  background: T.inputBg,
  border: `1px solid ${T.inputBorder}`,
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
  appearance: "none",
};

const labelBase = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: T.caption,
  marginBottom: 6,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const subLabelBase = {
  margin: 0,
  fontSize: "0.775rem",
  fontWeight: 700,
  color: T.caption,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const hrStyle = {
  margin: 0,
  border: "none",
  borderTop: `1px solid ${T.borderHr}`,
};

const chevronSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")";

// ─── Atom components ───────────────────────────────────────────────────────────

function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>{emoji}</span>
        <h2
          style={{
            margin: 0,
            fontSize: "0.975rem",
            fontWeight: 700,
            color: T.heading,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          style={{
            margin: "4px 0 0",
            fontSize: "0.775rem",
            color: T.muted,
            paddingLeft: "1.55rem",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={labelBase}>{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  const [focused, setFocused] = useState(false);
  const { style: extraStyle, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        ...inputBase,
        borderColor: focused ? T.inputFocus : T.inputBorder,
        boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
        ...extraStyle,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Select({ value, onChange, children, style: extraStyle }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        cursor: "pointer",
        backgroundImage: chevronSvg,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.8rem center",
        paddingRight: "2.25rem",
        borderColor: focused ? T.inputFocus : T.inputBorder,
        boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
        ...extraStyle,
      }}
    >
      {children}
    </select>
  );
}

function BtnPrimary({
  children,
  onClick,
  disabled,
  type = "button",
  fullWidth,
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "0.625rem 1.25rem",
        background: disabled
          ? T.primaryDisabled
          : hovered
            ? T.primaryHover
            : T.primary,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : "auto",
        transition: "background 0.15s",
        letterSpacing: "0.01em",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

function BtnDanger({ children, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "0.55rem 1rem",
        background: disabled
          ? T.dangerBg
          : active
            ? T.dangerBgHover
            : T.dangerBg,
        color: disabled ? T.muted : active ? "#fff" : T.dangerText,
        border: `1px solid ${active ? T.dangerBgHover : T.dangerBorder}`,
        borderRadius: 8,
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s, color 0.18s, border-color 0.18s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function BtnWarning({ children, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  const active = hovered && !disabled;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "0.55rem 1rem",
        background: disabled
          ? T.warningBg
          : active
            ? T.warningBgHover
            : T.warningBg,
        color: disabled ? T.muted : active ? "#fff" : T.warningText,
        border: `1px solid ${active ? T.warningBgHover : T.warningBorder}`,
        borderRadius: 8,
        fontSize: "0.82rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.18s, color 0.18s, border-color 0.18s",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.7rem 0.875rem",
        background: T.inputBg,
        borderRadius: 8,
        border: `1px solid ${T.inputBorder}`,
      }}
    >
      <span style={{ fontSize: "0.875rem", color: T.body, fontWeight: 500 }}>
        {label}
      </span>
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? T.toggleOn : T.toggleOff,
          cursor: "pointer",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            transition: "left 0.2s",
          }}
        />
      </div>
    </div>
  );
}

// ─── Section 1: Bảo mật Admin ─────────────────────────────────────────────────
function SecuritySection() {
  const [pass, setPass] = useState({ current: "", new1: "", new2: "" });
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  const mockApiKey = "sk-pi-••••••••••••••••••••••••••••••••";
  const mockApiKeyFull = "sk-pi-a3f8b2c1d9e4f7a1b3c5d7e9f2a4b6c8";

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pass.new1 !== pass.new2) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (pass.new1.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Tính năng đang phát triển");
    setPass({ current: "", new1: "", new2: "" });
  };

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    await new Promise((r) => setTimeout(r, 700));
    setGeneratingKey(false);
    toast.success("Tính năng đang phát triển");
  };

  return (
    <div style={card}>
      <SectionHeader
        emoji="🔐"
        title="Bảo mật Admin"
        subtitle="Quản lý mật khẩu đăng nhập và API Key của thiết bị"
      />

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        <p style={subLabelBase}>Đổi mật khẩu đăng nhập</p>
        <form
          onSubmit={handleChangePassword}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <Field label="Mật khẩu hiện tại">
            <Input
              type="password"
              value={pass.current}
              onChange={(e) => setPass({ ...pass, current: e.target.value })}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </Field>
          <Field label="Mật khẩu mới">
            <Input
              type="password"
              value={pass.new1}
              onChange={(e) => setPass({ ...pass, new1: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </Field>
          <Field label="Xác nhận mật khẩu mới">
            <Input
              type="password"
              value={pass.new2}
              onChange={(e) => setPass({ ...pass, new2: e.target.value })}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </Field>
          <div style={{ paddingTop: "0.25rem" }}>
            <BtnPrimary type="submit" disabled={saving}>
              {saving ? "⏳ Đang cập nhật..." : "🔑 Cập nhật mật khẩu"}
            </BtnPrimary>
          </div>
        </form>
      </div>

      <hr style={hrStyle} />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <p style={subLabelBase}>API Key — Raspberry Pi</p>
        <p
          style={{
            margin: 0,
            fontSize: "0.775rem",
            color: T.muted,
            lineHeight: 1.6,
          }}
        >
          Key này dùng để Pi xác thực khi gọi vào Backend. Tạo mới sẽ vô hiệu
          hóa key cũ.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 0.875rem",
            background: T.inputBg,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 8,
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: "0.775rem",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
              color: T.body,
              overflowX: "auto",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
              userSelect: apiKeyVisible ? "all" : "none",
            }}
          >
            {apiKeyVisible ? mockApiKeyFull : mockApiKey}
          </code>
          <button
            onClick={() => setApiKeyVisible((v) => !v)}
            title={apiKeyVisible ? "Ẩn key" : "Hiện key"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.muted,
              fontSize: "0.9rem",
              padding: "0.15rem 0.3rem",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {apiKeyVisible ? "🙈" : "👁"}
          </button>
        </div>

        <div>
          <button
            onClick={handleGenerateKey}
            disabled={generatingKey}
            style={{
              padding: "0.55rem 1rem",
              background: "none",
              color: generatingKey ? T.muted : T.body,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: generatingKey ? "not-allowed" : "pointer",
              transition: "border-color 0.15s, color 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {generatingKey ? "⏳ Đang tạo..." : "🔄 Tạo API Key mới"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Cấu hình thiết bị (✅ ĐÃ FIX LOGIC API) ──────────────────────
const AUTO_LOCK_OPTIONS = [
  { value: "5", label: "5 giây" },
  { value: "10", label: "10 giây" },
  { value: "15", label: "15 giây" },
  { value: "never", label: "Không bao giờ" },
  { value: "custom", label: "Tự nhập..." },
];

const ALARM_DURATION_OPTIONS = [
  { value: "60", label: "1 phút" },
  { value: "180", label: "3 phút" },
  { value: "300", label: "5 phút" },
];

function DeviceConfigSection() {
  const [autoLock, setAutoLock] = useState("10");
  const [customLockSec, setCustomLockSec] = useState("");
  const [customConfirmed, setCustomConfirmed] = useState(null);
  const [alarmDuration, setAlarmDuration] = useState("60");
  const [telegramAlert, setTelegramAlert] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEnteringCustom = autoLock === "custom" && customConfirmed === null;
  const isCustomConfirmed = autoLock === "custom" && customConfirmed !== null;

  const confirmedLabel = isCustomConfirmed ? `${customConfirmed} giây (tùy chỉnh)` : null;

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setAutoLock(val);
    if (val !== "custom") {
      setCustomLockSec("");
      setCustomConfirmed(null);
    } else {
      setCustomConfirmed(null);
      setCustomLockSec("");
    }
  };

  const handleConfirmCustom = () => {
    const n = Number(customLockSec);
    if (!customLockSec || n < 1 || n > 3600) {
      toast.error("Vui lòng nhập số giây hợp lệ (1 – 3600)");
      return;
    }
    setCustomConfirmed(n);
    toast.success(`Đã chốt thời gian tự đóng cửa là ${n} giây`);
  };

  const handleCancelCustom = () => {
    setAutoLock("10");
    setCustomLockSec("");
    setCustomConfirmed(null);
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === "Enter") handleConfirmCustom();
    if (e.key === "Escape") handleCancelCustom();
  };

  // ✅ LOGIC GỌI API LƯU CẤU HÌNH
  const handleSave = async () => {
    if (autoLock === "custom" && customConfirmed === null) {
      toast.error("Vui lòng xác nhận số giây tùy chỉnh (Bấm nút ✓ Xác nhận) trước khi lưu!");
      return;
    }

    // 1. Gộp giá trị chốt cuối cùng (Nếu chọn 'never', gửi '0' hoặc 'không bao giờ')
    let finalAutoLockSec = autoLock;
    if (autoLock === "custom") {
        finalAutoLockSec = customConfirmed.toString();
    } else if (autoLock === "never") {
        finalAutoLockSec = "0"; // Mốc 0 báo hiệu cho Pi hiểu là tắt tính năng tự khóa
    }

    setSaving(true);
    try {
        // 2. Bắn API qua Backend (Backend cần định tuyến sang hàm /config/update trên Pi)
        const response = await apiClient.post("/device/update-config", {
            auto_lock_duration: finalAutoLockSec,
            alarm_duration: alarmDuration
        });
        
        if (response.data?.success || response.status === 200) {
            toast.success("Tuyệt vời! Đã lưu cấu hình thiết bị thành công.");
        } else {
            toast.error("Lỗi: Không nhận được phản hồi thành công từ Pi.");
        }
    } catch (error) {
        console.error("Save config error:", error);
        toast.error("Lỗi khi kết nối đến thiết bị. Pi đang offline?");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div style={card}>
      <SectionHeader
        emoji="⚙️"
        title="Cấu hình thiết bị"
        subtitle="Điều chỉnh hành vi tự động của Smart Door"
      />

      {/* Auto-lock */}
      <Field label="Tự động khóa cửa sau">
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Select
            value={autoLock}
            onChange={handleSelectChange}
            style={{ flex: 1 }}
          >
            {AUTO_LOCK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>

          {isCustomConfirmed && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.75rem",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#1D4ED8",
                }}
              >
                {customConfirmed}s
              </span>
              <button
                onClick={() => {
                  setCustomConfirmed(null);
                  setCustomLockSec(String(customConfirmed));
                }}
                title="Sửa lại"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#93C5FD",
                  fontSize: "0.75rem",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {isEnteringCustom && (
          <div
            style={{
              marginTop: "0.6rem",
              padding: "0.875rem",
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: 10,
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <Input
                type="number"
                min="1"
                max="3600"
                value={customLockSec}
                onChange={(e) => setCustomLockSec(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder="Ví dụ: 30"
                style={{ flex: 1 }}
                autoFocus
              />
              <span
                style={{
                  fontSize: "0.82rem",
                  color: T.muted,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                giây
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <BtnPrimary onClick={handleConfirmCustom} style={{ flex: 1 }}>
                ✓ Xác nhận
              </BtnPrimary>
              <button
                onClick={handleCancelCustom}
                style={{
                  flex: 1,
                  padding: "0.575rem 1rem",
                  background: "none",
                  color: T.body,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                color: T.muted,
                lineHeight: 1.5,
              }}
            >
              Nhập số giây (ví dụ: 30), sau đó bấm <b>Xác nhận</b>.
            </p>
          </div>
        )}
      </Field>

      {/* Alarm duration */}
      <Field label="Thời gian còi báo động">
        <Select
          value={alarmDuration}
          onChange={(e) => setAlarmDuration(e.target.value)}
        >
          {ALARM_DURATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      {/* Telegram toggle */}
      <Field label="Thông báo">
        <Toggle
          checked={telegramAlert}
          onChange={setTelegramAlert}
          label="📬 Nhận cảnh báo qua Telegram"
        />
      </Field>

      <div>
        <BtnPrimary onClick={handleSave} disabled={saving} fullWidth>
          {saving ? "⏳ Đang gửi xuống thiết bị..." : "💾 Lưu cấu hình thiết bị"}
        </BtnPrimary>
      </div>
    </div>
  );
}

// ─── Section 3: Bảo trì hệ thống ─────────────────────────────────────────────
function MaintenanceSection() {
  const [deletingLogs, setDeletingLogs] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  const handleDeleteLogs = async () => {
    if (
      !window.confirm(
        "Xóa toàn bộ lịch sử ra vào cũ hơn 30 ngày?\nHành động này không thể hoàn tác.",
      )
    )
      return;
    setDeletingLogs(true);
    await new Promise((r) => setTimeout(r, 900));
    setDeletingLogs(false);
    toast.success("Tính năng đang phát triển");
  };

  const handleReboot = async () => {
    if (
      !window.confirm(
        "Khởi động lại Raspberry Pi?\nThiết bị sẽ ngoại tuyến trong khoảng 30–60 giây.",
      )
    )
      return;
    setRebooting(true);
    await new Promise((r) => setTimeout(r, 800));
    setRebooting(false);
    toast.success("Tính năng đang phát triển");
  };

  const rows = [
    {
      title: "Xóa lịch sử ra vào",
      icon: "🗑",
      description:
        "Xóa toàn bộ bản ghi truy cập cũ hơn 30 ngày. Không thể hoàn tác.",
      action: (
        <BtnDanger onClick={handleDeleteLogs} disabled={deletingLogs}>
          {deletingLogs ? "⏳ Đang xóa..." : "🗑 Xóa (> 30 ngày)"}
        </BtnDanger>
      ),
    },
    {
      title: "Khởi động lại Raspberry Pi",
      icon: "🔄",
      description:
        "Thiết bị sẽ ngoại tuyến 30–60 giây. Camera và khóa cửa tạm dừng.",
      action: (
        <BtnWarning onClick={handleReboot} disabled={rebooting}>
          {rebooting ? "⏳ Đang gửi lệnh..." : "🔄 Reboot Pi"}
        </BtnWarning>
      ),
      last: true,
    },
  ];

  return (
    <div style={card}>
      <SectionHeader
        emoji="🧹"
        title="Bảo trì hệ thống"
        subtitle="Dọn dẹp dữ liệu và quản lý trạng thái thiết bị"
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row, i) => (
          <div key={i}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1.5rem",
                padding: "1.125rem 0",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 3px",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: T.heading,
                  }}
                >
                  {row.icon} {row.title}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.775rem",
                    color: T.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {row.description}
                </p>
              </div>
              <div style={{ flexShrink: 0 }}>{row.action}</div>
            </div>
            {!row.last && <hr style={hrStyle} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section 4: Thông tin hệ thống ───────────────────────────────────────────
const SYSTEM_INFO = [
  ["Phiên bản", "v1.0.0"],
  ["Backend", "FastAPI + SQLAlchemy"],
  ["Database", "SQLite (Dev) / PostgreSQL (Prod)"],
  ["Cloud Storage", "Cloudinary / AWS S3"],
  ["Nhận diện khuôn mặt", "face_recognition (dlib)"],
  ["Thông báo", "Telegram Bot + FCM"],
  ["Giao thức Pi ↔ STM32", "UART Serial"],
  ["Frontend", "React 18 + Vite + TanStack Query"],
];

function SystemInfoSection() {
  return (
    <div style={card}>
      <SectionHeader
        emoji="ℹ️"
        title="Thông tin hệ thống"
        subtitle="Thông số kỹ thuật và phiên bản các thành phần"
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        {SYSTEM_INFO.map(([key, val], i) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.65rem 0",
              borderBottom:
                i < SYSTEM_INFO.length - 1 ? `1px solid ${T.borderHr}` : "none",
            }}
          >
            <span
              style={{ fontSize: "0.82rem", color: T.muted, flexShrink: 0 }}
            >
              {key}
            </span>
            <span
              style={{
                fontSize: "0.82rem",
                color: T.body,
                fontWeight: 600,
                textAlign: "right",
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.65rem 0.875rem",
          background: T.successBg,
          borderRadius: 8,
          border: `1px solid ${T.successBorder}`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: T.successText,
            flexShrink: 0,
            boxShadow: "0 0 0 3px rgba(5,150,105,0.15)",
          }}
        />
        <span style={{ fontSize: "0.8rem", color: "#065F46", fontWeight: 600 }}>
          Hệ thống đang hoạt động bình thường
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  return (
    <div
      style={{ background: T.pageBg, minHeight: "100%", paddingBottom: "2rem" }}
    >
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "1.2rem",
            fontWeight: 800,
            color: T.heading,
            letterSpacing: "-0.025em",
          }}
        >
          Cấu hình hệ thống
        </h1>
        <p
          style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", color: T.muted }}
        >
          Quản lý bảo mật, hành vi thiết bị và bảo trì hệ thống SmartDoor
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        <SecuritySection />
        <DeviceConfigSection />
        <MaintenanceSection />
        <SystemInfoSection />
      </div>

      <style>{`*:focus-visible { outline: 2px solid #6366F1; outline-offset: 2px; }`}</style>
    </div>
  );
}