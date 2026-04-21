/**
 * App.jsx — Top navigation tab layout matching the mockup design.
 * Warm beige background, horizontal tab nav, no sidebar.
 * Responsive: hamburger menu on mobile (≤ 767px), desktop unchanged.
 */
import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useWebSocket } from "./hooks/useWebSocket.js";
import useSystemStore from "./store/systemStore.js";
import { useAuth } from "./hooks/useAuth.js";
import AlertPanel from "./components/AlertPanel.jsx";

export default function App() {
  const { logout, getUser } = useAuth();
  const { wsConnected, alarmActive } = useSystemStore();
  const user = getUser();
  const location = useLocation();
  useWebSocket();

  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef(null);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!mobileOpen) return;
    const fn = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target))
        setMobileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [mobileOpen]);

  const tabs = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/logs", label: "Lịch sử ra vào" },
    { to: "/residents", label: "Thành Viên" },
    { to: "/settings", label: "Cài đặt" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Header ── */}
      <header
        ref={headerRef}
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              height: "3.5rem",
            }}
          >
            {/* Logo — không đổi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: "var(--text)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="3"
                    y="2"
                    width="10"
                    height="13"
                    rx="1.5"
                    stroke="white"
                    strokeWidth="1.2"
                  />
                  <circle cx="11" cy="8.5" r="1" fill="white" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "Lora, serif",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--text)",
                }}
              >
                SmartDoor
              </span>
            </div>

            {/* Desktop tabs — ẩn trên mobile qua CSS */}
            <nav
              className="sd-desktop-nav"
              style={{ display: "flex", gap: "0.25rem", flex: 1 }}
            >
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `nav-tab ${isActive ? "active" : ""}`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side — thu gọn trên mobile qua CSS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                flexShrink: 0,
              }}
            >
              {/* WS status */}
              <div
                className="sd-ws-badge"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <span
                  className={`status-dot ${wsConnected ? "online" : "offline"}`}
                  style={
                    wsConnected ? { animation: "pulseDot 2s infinite" } : {}
                  }
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                  {wsConnected ? "Live" : "Offline"}
                </span>
              </div>

              {/* Alarm badge */}
              {alarmActive && (
                <span
                  className="badge badge-alarm sd-alarm-badge"
                  style={{ animation: "pulseDot 1s infinite" }}
                >
                  🔴 ALARM
                </span>
              )}

              {/* User + logout — ẩn trên mobile, nằm trong dropdown */}
              <div
                className="sd-user-block"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>
                  {user?.username}
                </span>
                <button
                  onClick={logout}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-2)",
                    borderRadius: 6,
                    padding: "0.3rem 0.6rem",
                    fontSize: "0.75rem",
                    color: "var(--text-3)",
                    cursor: "pointer",
                  }}
                >
                  Đăng xuất
                </button>
              </div>

              {/* Hamburger button — chỉ hiện trên mobile */}
              <button
                className="sd-hamburger"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Mở menu"
                style={{
                  display: "none" /* CSS sẽ override thành flex trên mobile */,
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",
                  width: 36,
                  height: 36,
                  background: "none",
                  border: "1px solid var(--border-2)",
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 18,
                    height: 2,
                    background: "var(--text)",
                    borderRadius: 2,
                    transition: "transform 0.25s",
                    transform: mobileOpen
                      ? "rotate(45deg) translate(5px, 5px)"
                      : "none",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    width: 18,
                    height: 2,
                    background: "var(--text)",
                    borderRadius: 2,
                    transition: "opacity 0.2s",
                    opacity: mobileOpen ? 0 : 1,
                  }}
                />
                <span
                  style={{
                    display: "block",
                    width: 18,
                    height: 2,
                    background: "var(--text)",
                    borderRadius: 2,
                    transition: "transform 0.25s",
                    transform: mobileOpen
                      ? "rotate(-45deg) translate(5px, -5px)"
                      : "none",
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown — chỉ render khi mobileOpen */}
        {mobileOpen && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
              padding: "0.75rem 1rem 1rem",
              animation: "slideDown 0.2s ease",
            }}
          >
            {/* Nav links dạng dọc */}
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                marginBottom: "0.75rem",
              }}
            >
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `nav-tab ${isActive ? "active" : ""}`
                  }
                  style={{
                    borderRadius: 8,
                    padding: "0.65rem 1rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
            {/* User + logout */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>
                👤 {user?.username}
              </span>
              <button
                onClick={logout}
                style={{
                  background: "var(--red-bg)",
                  border: "1px solid #e0c0c0",
                  borderRadius: 7,
                  padding: "0.4rem 1rem",
                  fontSize: "0.82rem",
                  color: "var(--red-text)",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Page content — không đổi so với gốc ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
        <Outlet />
      </main>

      <AlertPanel />
    </div>
  );
}
