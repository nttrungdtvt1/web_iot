/**
 * Settings.jsx — Cài đặt: đổi PIN, điều khiển thiết bị, trạng thái kết nối
 */
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/apiClient.js'
import toast from 'react-hot-toast'

const updatePin   = b  => apiClient.post('/pin/update', b).then(r=>r.data)
const stopAlarm   = () => apiClient.post('/device/stop-alarm').then(r=>r.data)
const lockDoor    = () => apiClient.post('/device/lock-door').then(r=>r.data)
const unlockDoor  = () => apiClient.post('/device/unlock-door').then(r=>r.data)
const fetchStatus = () => apiClient.get('/device/status').then(r=>r.data)

function Section({ title, children }) {
  return (
    <div className="card" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <p style={{ fontFamily:'Lora,serif', fontSize:'0.95rem', fontWeight:600, color:'var(--text)', margin:0 }}>{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'0.78rem', color:'var(--text-2)', marginBottom:4 }}>{label}</label>
      {children}
    </div>
  )
}

export default function Settings() {
  const [pin, setPin] = useState({ current:'', new1:'', new2:'' })
  const { data: status, refetch, isFetching } = useQuery({ queryKey:['device-status'], queryFn:fetchStatus, refetchInterval:30000 })

  const pinMut   = useMutation({ mutationFn: updatePin,   onSuccess: r => { toast.success(r.pi_synced ? 'PIN đã cập nhật và đồng bộ' : 'PIN đã lưu (chờ đồng bộ)'); setPin({current:'',new1:'',new2:''}) }, onError: e => toast.error(e.response?.data?.detail||'Lỗi cập nhật PIN') })
  const alarmMut = useMutation({ mutationFn: stopAlarm,   onSuccess: () => toast.success('Đã dừng alarm'),    onError: () => toast.error('Lỗi kết nối Pi') })
  const lockMut  = useMutation({ mutationFn: lockDoor,    onSuccess: () => toast.success('Đã khóa cửa'),      onError: () => toast.error('Lỗi kết nối Pi') })
  const unlockMut= useMutation({ mutationFn: unlockDoor,  onSuccess: () => toast.success('Đã mở khóa cửa'),   onError: () => toast.error('Lỗi kết nối Pi') })

  const handlePinSubmit = e => {
    e.preventDefault()
    if (pin.new1 !== pin.new2) return toast.error('Mã PIN mới không khớp')
    if (!/^\d{4,8}$/.test(pin.new1)) return toast.error('PIN phải gồm 4–8 chữ số')
    pinMut.mutate({ current_pin: pin.current, new_pin: pin.new1 })
  }

  const connItems = [
    { label:'Raspberry Pi', detail: status?.online ? '✓ Đang kết nối' : '✗ Offline',          ok: status?.online },
    { label:'STM32 UART',   detail: 'Ổn định',                                                   ok: true },
    { label:'Cloud Storage', detail: 'Bình thường',                                              ok: true },
    { label:'WebSocket',    detail: 'Live',                                                       ok: true },
  ]

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <h1 style={{ fontSize:'1.1rem' }}>Cài đặt</h1>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', alignItems:'start' }}>

        {/* PIN */}
        <Section title="🔑 Đổi mã PIN cửa">
          <p style={{ fontSize:'0.82rem', color:'var(--text-2)', margin:0 }}>
            Sau khi lưu, hệ thống sẽ đồng bộ PIN xuống STM32 qua Raspberry Pi → UART.
          </p>
          <form onSubmit={handlePinSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            <Field label="PIN hiện tại">
              <input className="input" type="password" inputMode="numeric" maxLength={8}
                value={pin.current} onChange={e=>setPin({...pin,current:e.target.value})}
                placeholder="••••" required/>
            </Field>
            <Field label="PIN mới (4–8 chữ số)">
              <input className="input" type="password" inputMode="numeric" maxLength={8}
                value={pin.new1} onChange={e=>setPin({...pin,new1:e.target.value})}
                placeholder="••••" required/>
            </Field>
            <Field label="Xác nhận PIN mới">
              <input className="input" type="password" inputMode="numeric" maxLength={8}
                value={pin.new2} onChange={e=>setPin({...pin,new2:e.target.value})}
                placeholder="••••" required/>
            </Field>
            <button type="submit" className="btn btn-primary" disabled={pinMut.isPending}>
              {pinMut.isPending ? 'Đang cập nhật...' : 'Cập nhật PIN'}
            </button>
          </form>
        </Section>

        {/* Device control */}
        <Section title="🎛 Điều khiển thiết bị">
          <p style={{ fontSize:'0.82rem', color:'var(--text-2)', margin:0 }}>
            Lệnh được gửi trực tiếp đến Raspberry Pi qua HTTP.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
            <button className="btn btn-danger" onClick={()=>alarmMut.mutate()} disabled={alarmMut.isPending}>
              {alarmMut.isPending ? '...' : '🔔 Dừng alarm'}
            </button>
            <button className="btn btn-primary" onClick={()=>lockMut.mutate()} disabled={lockMut.isPending}>
              {lockMut.isPending ? '...' : '🔒 Khóa cửa'}
            </button>
            <button className="btn btn-success" onClick={()=>unlockMut.mutate()} disabled={unlockMut.isPending}>
              {unlockMut.isPending ? '...' : '🔓 Mở khóa'}
            </button>
            <button className="btn btn-warning">
              🔊 Test buzzer
            </button>
          </div>

          {/* Device status */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <p style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-2)', margin:0 }}>Trạng thái thiết bị</p>
              <button onClick={()=>refetch()} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:'0.75rem' }}>
                {isFetching ? 'Đang tải...' : '↻ Làm mới'}
              </button>
            </div>
            {[
              ['Cửa', status?.door_locked===false ? 'Đang mở' : 'Đã khóa', status?.door_locked!==false],
              ['Alarm', status?.alarm_active ? 'Đang kêu' : 'Không hoạt động', !status?.alarm_active],
              ['Camera', status?.camera_active!==false ? 'Đang chạy' : 'Offline', status?.camera_active!==false],
            ].map(([k,v,ok])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem' }}>
                <span style={{ color:'var(--text-2)' }}>{k}</span>
                <span style={{ color: ok ? 'var(--green)' : 'var(--red)', fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Connection status */}
        <Section title="📡 Trạng thái kết nối">
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {connItems.map(it=>(
              <div key={it.label} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem 0.6rem', borderRadius:6, background:'var(--surface-2)' }}>
                <span className={`status-dot ${it.ok?'online':'offline'}`}/>
                <span style={{ flex:1, fontSize:'0.875rem' }}>{it.label}</span>
                <span style={{ fontSize:'0.78rem', color: it.ok ? 'var(--green)' : 'var(--red)', fontWeight:500 }}>
                  {it.detail}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* System info */}
        <Section title="ℹ️ Thông tin hệ thống">
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
            {[
              ['Phiên bản', 'v1.0.0'],
              ['Backend', 'FastAPI + SQLAlchemy'],
              ['Database', 'SQLite (Dev) / PostgreSQL (Prod)'],
              ['Cloud Storage', 'Cloudinary / S3'],
              ['Face recognition', 'face_recognition (dlib)'],
              ['Thông báo', 'Telegram Bot + FCM'],
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', padding:'0.3rem 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text-2)' }}>{k}</span>
                <span style={{ color:'var(--text)', fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
