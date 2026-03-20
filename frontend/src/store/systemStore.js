import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useSystemStore = create(devtools((set, get) => ({
  doorStatus:    'locked',
  alarmActive:   false,
  cameraSnapshot: null,
  cameraActive:  true,
  latestEvent:   null,
  recentEvents:  [],
  wsConnected:   false,
  alertCount:    0,

  setDoorStatus:    s  => set({ doorStatus: s }),
  setAlarmActive:   a  => set({ alarmActive: a, doorStatus: a ? 'alarm' : 'locked' }),
  setCameraSnapshot: u => set({ cameraSnapshot: u }),
  setWsConnected:   c  => set({ wsConnected: c }),
  resetAlertCount:  () => set({ alertCount: 0 }),

  handleEvent: msg => {
    const { event, data, timestamp } = msg
    const entry = { event, data, timestamp, id: Date.now(), image_url: data?.image_url || null }
    set(s => ({ latestEvent: entry, recentEvents: [entry, ...s.recentEvents].slice(0,50) }))

    switch (event) {
      case 'door_opened':    set({ doorStatus:'open' }); break
      case 'door_closed':
      case 'door_locked':    set({ doorStatus:'locked' }); break
      case 'alarm_triggered': set({ alarmActive:true, doorStatus:'alarm', alertCount: get().alertCount+1 }); break
      case 'alarm_stopped':  set({ alarmActive:false, doorStatus:'locked' }); break
      case 'motion_detected':
      case 'face_unknown':
      case 'door_forced':    set({ alertCount: get().alertCount+1 });
        if (data?.image_url) set({ cameraSnapshot: data.image_url }); break
      case 'face_recognized': if (data?.image_url) set({ cameraSnapshot: data.image_url }); break
      case 'system_online':  set({ cameraActive: true });  break
      case 'system_offline': set({ cameraActive: false }); break
    }
  },
}), { name:'SystemStore' }))

export default useSystemStore
