/**
 * AlertPanel.jsx — Toast alerts for critical security events (warm beige style)
 */
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import useSystemStore from '../store/systemStore.js'

const CRITICAL = new Set(['alarm_triggered','face_unknown','door_forced','motion_detected'])

const CONFIGS = {
  alarm_triggered: { emoji:'🚨', title:'Alarm kích hoạt!',        msg:'Hệ thống báo động đang hoạt động', dur:8000 },
  face_unknown:    { emoji:'⚠️',  title:'Khuôn mặt không nhận ra', msg:'Phát hiện người lạ tại cửa',       dur:6000 },
  door_forced:     { emoji:'🔴', title:'Cửa bị mở cưỡng bức!',    msg:'Cửa bị mở mà không xác thực',      dur:8000 },
  motion_detected: { emoji:'📷', title:'Phát hiện chuyển động',   msg:'Có người tiếp cận khu vực cửa',     dur:3000 },
}

export default function AlertPanel() {
  const latestEvent = useSystemStore(s => s.latestEvent)
  const lastId = useRef(null)

  useEffect(() => {
    if (!latestEvent || latestEvent.id === lastId.current) return
    if (!CRITICAL.has(latestEvent.event)) return
    lastId.current = latestEvent.id

    const cfg = CONFIGS[latestEvent.event]
    if (!cfg) return

    const isDanger = latestEvent.event !== 'motion_detected'

    toast.custom(t => (
      <div style={{
        display:'flex', alignItems:'flex-start', gap:'0.75rem',
        background:'var(--surface)', border:`1px solid ${isDanger ? '#e0c0c0' : '#e0d8b0'}`,
        borderLeft:`3px solid ${isDanger ? 'var(--red)' : 'var(--amber)'}`,
        borderRadius:10, padding:'0.9rem 1rem',
        boxShadow:'var(--shadow-lg)', maxWidth:320, width:'100%',
        opacity: t.visible ? 1 : 0,
        transform: t.visible ? 'translateX(0)' : 'translateX(20px)',
        transition:'all 0.3s ease',
      }}>
        <span style={{ fontSize:'1.1rem', flexShrink:0, lineHeight:1.3 }}>{cfg.emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text)', marginBottom:2 }}>{cfg.title}</p>
          <p style={{ fontSize:'0.78rem', color:'var(--text-2)', lineHeight:1.4 }}>{cfg.msg}</p>
          {latestEvent.data?.image_url && (
            <img src={latestEvent.data.image_url} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:6, marginTop:6, border:'1px solid var(--border)' }}/>
          )}
        </div>
        <button onClick={()=>toast.dismiss(t.id)} style={{
          background:'none', border:'none', cursor:'pointer',
          color:'var(--text-3)', fontSize:'1rem', padding:0, flexShrink:0, lineHeight:1,
        }}>✕</button>
      </div>
    ), { duration: cfg.dur, position:'top-right' })
  }, [latestEvent])

  return null
}
