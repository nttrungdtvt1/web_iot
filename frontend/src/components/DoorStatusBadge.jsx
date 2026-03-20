/**
 * components/DoorStatusBadge.jsx
 * Visual badge showing LOCKED / OPEN / ALARM door status.
 * Also accepts alarm prop for flashing red state.
 */

import { Lock, LockOpen, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'

const STATUS_MAP = {
  locked: {
    label: 'LOCKED',
    icon: Lock,
    className: 'bg-green-900/40 border-green-700 text-green-400',
    dotClass: 'bg-green-400',
  },
  open: {
    label: 'OPEN',
    icon: LockOpen,
    className: 'bg-cyan-900/40 border-cyan-700 text-cyan-400',
    dotClass: 'bg-cyan-400',
  },
  alarm: {
    label: 'ALARM',
    icon: ShieldAlert,
    className: 'bg-red-900/40 border-red-700 text-red-400 animate-pulse',
    dotClass: 'bg-red-400 animate-ping',
  },
}

export default function DoorStatusBadge({ status = 'locked', alarm = false, size = 'md' }) {
  const resolvedStatus = alarm ? 'alarm' : status
  const config = STATUS_MAP[resolvedStatus] || STATUS_MAP.locked
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border font-bold tracking-widest',
        config.className,
        sizeClasses[size]
      )}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-75', config.dotClass)} />
        <span className={clsx('relative inline-flex rounded-full h-2.5 w-2.5', config.dotClass.replace(' animate-ping', ''))} />
      </span>
      <Icon size={size === 'sm' ? 12 : size === 'lg' ? 20 : 15} />
      <span>{config.label}</span>
    </div>
  )
}
