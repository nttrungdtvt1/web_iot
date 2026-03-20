/**
 * App.jsx — Top navigation tab layout matching the mockup design.
 * Warm beige background, horizontal tab nav, no sidebar.
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useWebSocket } from './hooks/useWebSocket.js'
import useSystemStore from './store/systemStore.js'
import { useAuth } from './hooks/useAuth.js'
import AlertPanel from './components/AlertPanel.jsx'

export default function App() {
  const { logout, getUser } = useAuth()
  const { wsConnected, alarmActive } = useSystemStore()
  const user = getUser()
  useWebSocket()

  const tabs = [
    { to: '/',          label: 'Dashboard',       end: true },
    { to: '/logs',      label: 'Lịch sử ra vào'           },
    { to: '/residents', label: 'Cư dân'                    },
    { to: '/settings',  label: 'Cài đặt'                   },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', height: '3.5rem' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, background: 'var(--text)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="2" width="10" height="13" rx="1.5" stroke="white" strokeWidth="1.2"/>
                  <circle cx="11" cy="8.5" r="1" fill="white"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'Lora, serif', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                SmartDoor
              </span>
            </div>

            {/* Tabs */}
            <nav style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
              {tabs.map(t => (
                <NavLink
                  key={t.to} to={t.to} end={t.end}
                  className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              {/* WS indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className={`status-dot ${wsConnected ? 'online' : 'offline'}`}
                  style={wsConnected ? { animation: 'pulseDot 2s infinite' } : {}} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {wsConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Alarm badge */}
              {alarmActive && (
                <span className="badge badge-alarm" style={{ animation: 'pulseDot 1s infinite' }}>
                  🔴 ALARM
                </span>
              )}

              {/* User + logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{user?.username}</span>
                <button
                  onClick={logout}
                  style={{
                    background: 'none', border: '1px solid var(--border-2)',
                    borderRadius: 6, padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem', color: 'var(--text-3)',
                    cursor: 'pointer',
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
        <Outlet />
      </main>

      <AlertPanel />
    </div>
  )
}
