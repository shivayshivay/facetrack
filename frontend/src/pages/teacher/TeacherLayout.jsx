import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const nav = [
  { to: '/teacher',          label: 'Dashboard', icon: '🏠', end: true },
  { to: '/teacher/camera',   label: 'Camera Scan', icon: '📷' },
  { to: '/teacher/students', label: 'Students',    icon: '👥' },
  { to: '/teacher/leaves',   label: 'Leave Requests', icon: '📝' },
  { to: '/teacher/reports',  label: 'Reports',    icon: '📊' },
  { to: '/teacher/settings', label: 'Settings',   icon: '⚙️' },
]

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-bg2 border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple flex items-center justify-center text-xl">👁️</div>
            <div>
              <p className="font-bold text-base leading-none">FaceTrack</p>
              <p className="text-xs text-muted mt-0.5">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                 ${isActive ? 'bg-accent/15 text-accent border border-accent/20' : 'text-muted hover:text-white hover:bg-white/[0.05]'}`
              }>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="text-muted hover:text-red transition-colors text-lg">⏏</button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
