/**
 * AccessLogs.jsx — Matches mockup:
 * Breadcrumb steps: 1.Lịch sử ra vào → 2.Ấn vào dòng → 3.Xem ảnh + chi tiết
 * List with avatar, name, method, time, badge
 * Click row → detail modal with snapshot + info table
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import apiClient from '../api/apiClient.js'

const fetchLogs = ({ page, limit, date, status }) => {
  const p = new URLSearchParams({ page, limit })
  if (date)   p.append('date', date)
  if (status) p.append('status', status)
  return apiClient.get(`/access-logs?${p}`).then(r => r.data)
}

const AVATAR_COLORS = [
  ['#dce8f0','#3a6a9a'],['#e8f0dc','#4a7c59'],
  ['#f0e8dc','#8b5a1a'],['#ecdce8','#7a4a8a'],
  ['#dce8f0','#3a6a9a'],
]
function getAvatar(name) {
  if (!name) return { bg:'#f0ebe0', fg:'#9e9484', initials:'?' }
  const i = name.charCodeAt(0) % AVATAR_COLORS.length
  const initials = name.split(' ').slice(-2).map(w=>w[0]).join('').toUpperCase().slice(0,2)
  return { bg: AVATAR_COLORS[i][0], fg: AVATAR_COLORS[i][1], initials }
}

function getBadge(log) {
  if (log.status === 'granted' && log.method === 'pin') return ['badge-pin','Vào bằng PIN']
  if (log.status === 'granted')  return ['badge-granted','Vào được']
  if (log.status === 'denied' && log.notes?.includes('3'))  return ['badge-alarm','Alarm']
  if (log.status === 'denied')   return ['badge-denied','Từ chối']
  return ['badge-unknown','Không rõ']
}

function getMethodLabel(log) {
  if (log.method === 'face' && log.status === 'granted')  return 'Khuôn mặt'
  if (log.method === 'face' && log.status !== 'granted')  return 'Mặt thất bại'
  if (log.method === 'pin')  return 'PIN'
  if (log.method === 'remote') return 'Từ xa'
  return log.method
}

// ── Detail modal (step 3) ──────────────────────────────────────
function DetailModal({ log, onClose }) {
  const [downloading, setDownloading] = useState(false)
  const av = getAvatar(log.resident_name)
  const [badgeClass, badgeLabel] = getBadge(log)

  const handleDownload = async () => {
    if (!log.image_url) return
    setDownloading(true)
    try {
      const resp = await fetch(log.image_url)
      const blob = await resp.blob()
      const url  = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `snapshot_${log.id}.jpg`; a.click()
      URL.revokeObjectURL(url)
    } catch { } finally { setDownloading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontSize:'0.78rem', color:'var(--text-3)' }}>
          <span style={{ cursor:'pointer', color:'var(--text-2)' }} onClick={onClose}>1. Lịch sử ra vào</span>
          <span>→</span>
          <span style={{ background:'var(--text)', color:'var(--surface)', padding:'0.15rem 0.6rem', borderRadius:99, fontWeight:500 }}>
            3. Chi tiết sự kiện
          </span>
        </div>

        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem', margin:0 }}>{log.resident_name || 'Không xác định'}</h2>
          <button onClick={onClose} style={{
            background:'none', border:'1px solid var(--border-2)',
            borderRadius:6, padding:'0.25rem 0.6rem',
            fontSize:'0.78rem', color:'var(--text-2)', cursor:'pointer',
            display:'flex', alignItems:'center', gap:'0.3rem',
          }}>✕ Đóng</button>
        </div>

        {/* Image */}
        <div style={{
          background:'var(--surface-2)', borderRadius:10,
          aspectRatio:'4/3', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          marginBottom:'1rem', overflow:'hidden', border:'1px solid var(--border)',
        }}>
          {log.image_url ? (
            <img src={log.image_url} alt="snapshot" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <p style={{ fontSize:'0.78rem', color:'var(--text-3)', marginTop:'0.5rem', textAlign:'center', padding:'0 1rem' }}>
                Ảnh chụp từ camera lúc sự kiện xảy ra<br/>
                <span style={{ fontSize:'0.7rem' }}>(lưu trên S3 / Cloudinary)</span>
              </p>
            </>
          )}
        </div>

        {/* Info table */}
        <div style={{ border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', marginBottom:'1rem' }}>
          {[
            ['Tên',       log.resident_name || '—'],
            ['Thời gian', format(new Date(log.timestamp), 'HH:mm:ss')],
            ['Phương thức', getMethodLabel(log)],
            ['Kết quả',   <span className={`badge ${badgeClass}`}>{badgeLabel}</span>],
            ['Ghi chú',   log.notes || '—'],
          ].map(([k,v], i) => (
            <div key={i} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'0.55rem 0.75rem',
              borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              background: i%2===0 ? 'var(--surface)' : 'var(--surface-2)',
            }}>
              <span style={{ fontSize:'0.82rem', color:'var(--text-2)' }}>{k}</span>
              <span style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-outline" style={{ width:'100%' }} onClick={handleDownload} disabled={!log.image_url || downloading}>
          {downloading ? 'Đang tải...' : 'Tải ảnh xuống'}
        </button>
      </div>
    </div>
  )
}

// ── Log list row ──────────────────────────────────────────────
function LogRow({ log, onClick }) {
  const av = getAvatar(log.resident_name)
  const [badgeClass, badgeLabel] = getBadge(log)
  const time = format(new Date(log.timestamp), 'HH:mm:ss')

  return (
    <div
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:'0.75rem',
        padding:'0.75rem', borderRadius:8,
        cursor:'pointer', transition:'background 0.12s',
        borderBottom:'1px solid var(--border)',
      }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--surface-2)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      {/* Snapshot thumb */}
      <div style={{
        width:36, height:36, borderRadius:6,
        background:'var(--surface-2)', border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        overflow:'hidden',
      }}>
        {log.image_url
          ? <img src={log.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        }
      </div>

      <div className="avatar" style={{ background:av.bg, color:av.fg }}>{av.initials}</div>

      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:500, fontSize:'0.875rem', color:'var(--text)' }}>
          {log.resident_name || 'Không xác định'}
        </p>
        <p style={{ fontSize:'0.75rem', color:'var(--text-3)' }}>
          {getMethodLabel(log)} · {time}
        </p>
      </div>

      <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-3)" strokeWidth="1.5">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function AccessLogs() {
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const limit = 15

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, dateFilter, statusFilter],
    queryFn:  () => fetchLogs({ page, limit, date: dateFilter, status: statusFilter }),
    keepPreviousData: true,
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 1
  const today = new Date().toISOString().slice(0,10)
  const displayDate = dateFilter || today

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <h1 style={{ fontSize:'1.1rem' }}>Lịch sử ra vào</h1>

      {/* Breadcrumb hint */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem' }}>
        <span style={{ background:'var(--text)', color:'var(--surface)', padding:'0.2rem 0.7rem', borderRadius:99, fontWeight:500 }}>
          1. Lịch sử ra vào
        </span>
        <span style={{ color:'var(--text-3)' }}>→</span>
        <span style={{ color:'var(--text-3)' }}>2. Ấn vào dòng</span>
        <span style={{ color:'var(--text-3)' }}>→</span>
        <span style={{ color:'var(--text-3)' }}>3. Xem ảnh + chi tiết</span>
      </div>

      {/* Filter row */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
        <input type="date" className="input" style={{ width:'auto' }}
          value={dateFilter} onChange={e=>{setDateFilter(e.target.value);setPage(1)}}/>
        <select className="input" style={{ width:'auto' }}
          value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}}>
          <option value="">Tất cả kết quả</option>
          <option value="granted">Vào được</option>
          <option value="denied">Từ chối</option>
          <option value="unknown">Không rõ</option>
        </select>
        {(dateFilter || statusFilter) && (
          <button className="btn btn-outline" style={{ fontSize:'0.8rem' }}
            onClick={()=>{setDateFilter('');setStatusFilter('');setPage(1)}}>
            Xóa bộ lọc
          </button>
        )}
        <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text-3)' }}>
          {data?.total ?? 0} bản ghi
        </span>
      </div>

      {/* Log card */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'0.75rem 1rem', borderBottom:'1px solid var(--border)',
        }}>
          <p style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)' }}>
            Lịch sử ra vào — {displayDate.split('-').reverse().join('/')}
          </p>
          <p style={{ fontSize:'0.75rem', color:'var(--text-3)' }}>
            Ấn vào dòng bất kỳ để xem ảnh
          </p>
        </div>

        <div style={{ padding:'0 0.25rem' }}>
          {isLoading
            ? Array.from({length:6}).map((_,i)=>(
                <div key={i} style={{ height:58, margin:'0.5rem', borderRadius:8, background:'var(--surface-2)', animation:'pulseDot 1.5s infinite' }}/>
              ))
            : data?.items?.length > 0
              ? data.items.map(l => <LogRow key={l.id} log={l} onClick={()=>setSelected(l)}/>)
              : <p style={{ textAlign:'center', color:'var(--text-3)', padding:'2rem', fontSize:'0.875rem' }}>Không có dữ liệu</p>
          }
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', alignItems:'center' }}>
          <button className="btn btn-outline" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Trước</button>
          <span style={{ fontSize:'0.82rem', color:'var(--text-2)', padding:'0 0.5rem' }}>
            {page} / {totalPages}
          </span>
          <button className="btn btn-outline" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Sau →</button>
        </div>
      )}

      {selected && <DetailModal log={selected} onClose={()=>setSelected(null)}/>}
    </div>
  )
}
