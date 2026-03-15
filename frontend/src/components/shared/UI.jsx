// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = 'text-accent' }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-3xl font-bold leading-none ${color}`}>{value}</p>
      {sub && <p className="text-xs text-dim mt-1">{sub}</p>}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    present: 'badge-present', absent: 'badge-absent',
    leave:   'badge-leave',   pending: 'badge-pending',
    approved:'badge-present', rejected:'badge-absent',
  }
  return <span className={map[status] || 'badge-pending'}>{status}</span>
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = '', size = 'md', color = 'bg-accent/20 text-accent' }) {
  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-xl' }
  return (
    <div className={`${sizes[size]} ${color} rounded-xl flex items-center justify-center font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={`${s[size]} border-2 border-accent/20 border-t-accent rounded-full animate-spin`} />
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', message = 'Nothing here yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = 'bg-accent', className = '' }) {
  const clr = value < 75 ? 'bg-orange' : value >= 90 ? 'bg-green' : color
  return (
    <div className={`h-2 bg-bg3 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full ${clr} rounded-full transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-accent text-sm font-semibold hover:text-accent/80 transition-colors">
          {action}
        </button>
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg2 border border-white/10 rounded-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Chip ──────────────────────────────────────────────────────────────────────
export function Chip({ label, color = 'bg-accent/10 text-accent border-accent/20' }) {
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${color}`}>{label}</span>
  )
}
