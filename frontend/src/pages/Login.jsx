/**
 * Login.jsx — Warm beige style matching the app aesthetic
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => { if (localStorage.getItem('access_token')) navigate('/') }, [navigate])

  const submit = async e => { e.preventDefault(); await login(username, password) }

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
    }}>
      {/* Background texture */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle at 20% 20%, rgba(90,122,74,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(58,106,154,0.06) 0%, transparent 50%)',
      }}/>

      <div style={{ width:'100%', maxWidth:380, position:'relative' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{
            width:56, height:56, background:'var(--text)',
            borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 1rem', boxShadow:'0 4px 16px rgba(45,42,36,0.2)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5"/>
              <rect x="7" y="3" width="10" height="15" rx="1.5" fill="white" opacity="0.15"/>
              <circle cx="15" cy="12" r="1.5" fill="white"/>
              <path d="M7 3v18" stroke="white" strokeWidth="1.2" opacity="0.3"/>
            </svg>
          </div>
          <h1 style={{ fontSize:'1.4rem', marginBottom:'0.25rem' }}>Smart Door</h1>
          <p style={{ fontSize:'0.85rem', color:'var(--text-3)' }}>Hệ thống kiểm soát ra vào</p>
        </div>

        {/* Card */}
        <div className="card" style={{ boxShadow:'var(--shadow-lg)', borderRadius:'var(--radius-lg)' }}>
          <p style={{ fontFamily:'Lora,serif', fontWeight:600, fontSize:'1rem', marginBottom:'1.25rem' }}>
            Đăng nhập
          </p>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {error && (
              <div style={{
                background:'var(--red-bg)', border:'1px solid #e0c0c0',
                borderRadius:8, padding:'0.6rem 0.75rem',
                fontSize:'0.82rem', color:'var(--red-text)',
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display:'block', fontSize:'0.78rem', color:'var(--text-2)', marginBottom:4 }}>
                Tên đăng nhập
              </label>
              <input className="input" value={username} onChange={e=>setUsername(e.target.value)}
                placeholder="admin" required autoFocus autoComplete="username"/>
            </div>

            <div>
              <label style={{ display:'block', fontSize:'0.78rem', color:'var(--text-2)', marginBottom:4 }}>
                Mật khẩu
              </label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPw?'text':'password'}
                  value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{ paddingRight:'2.5rem' }}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{
                  position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:0,
                }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop:'0.25rem', width:'100%', padding:'0.6rem' }}
              disabled={loading || !username || !password}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:'0.72rem', color:'var(--text-3)', marginTop:'1rem' }}>
            Mặc định: admin / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
