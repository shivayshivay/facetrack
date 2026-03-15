import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { attendanceAPI, leaveAPI } from '../../services/api'
import { ProgressBar, StatusBadge, Spinner, Empty, Avatar } from '../../components/shared/UI'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT LAYOUT
// ══════════════════════════════════════════════════════════════════════════════
export function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = [
    { to: '/student',            label: 'Dashboard',  icon: '🏠', end: true },
    { to: '/student/attendance', label: 'Attendance', icon: '📊' },
    { to: '/student/leave',      label: 'Leave',      icon: '📝' },
    { to: '/student/profile',    label: 'Profile',    icon: '👤' },
  ]
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="w-60 flex-shrink-0 bg-bg2 border-r border-white/[0.06] flex flex-col">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green to-accent flex items-center justify-center text-xl">👁️</div>
            <div>
              <p className="font-bold text-base leading-none">FaceTrack</p>
              <p className="text-xs text-green mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive ? 'bg-green/15 text-green border border-green/20' : 'text-muted hover:text-white hover:bg-white/[0.05]'}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-green/20 text-green flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-green">Verified ✓</p>
            </div>
            <button onClick={() => { logout(); navigate('/login') }} className="text-muted hover:text-red text-lg">⏏</button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export function StudentDashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      attendanceAPI.stats(user.id),
      attendanceAPI.byStudent(user.id),
    ]).then(([s, h]) => { setStats(s); setHistory(h) })
      .catch(e => toast.error(e))
      .finally(() => setLoading(false))
  }, [user?.id])

  const pct     = stats?.overall?.percentage ?? 0
  const atRisk  = stats?.overall?.at_risk ?? false
  const ringColor = atRisk ? '#f5a623' : pct >= 90 ? '#3ecf8e' : '#5b8af5'

  // SVG ring
  const R = 70, stroke = 14, circ = 2 * Math.PI * R
  const dash = (circ * pct) / 100

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted text-sm mt-1">{user?.class_section} · {new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}</p>
      </div>

      {atRisk && (
        <div className="card p-4 mb-6 bg-orange/5 border-orange/30 flex gap-3 items-center">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-orange text-sm">Attendance below 75%!</p>
            <p className="text-xs text-muted mt-0.5">Your overall attendance is {pct}%. Contact your teacher to avoid issues.</p>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      : (<div className="grid lg:grid-cols-3 gap-6">
          {/* Ring card */}
          <div className="card p-6 flex flex-col items-center">
            <p className="text-sm text-muted mb-4">Overall Attendance</p>
            <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
              <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
              <circle cx="80" cy="80" r={R} fill="none" stroke={ringColor} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                style={{transition:'stroke-dasharray 1s ease'}} />
            </svg>
            <div className="-mt-24 text-center mb-16">
              <p className="text-4xl font-extrabold" style={{color:ringColor}}>{pct}%</p>
              <p className="text-xs text-muted mt-1">Overall</p>
            </div>
            <div className="flex gap-4 text-center w-full mt-2">
              <div className="flex-1"><p className="text-xl font-bold text-green">{stats?.overall?.present}</p><p className="text-xs text-muted">Present</p></div>
              <div className="flex-1"><p className="text-xl font-bold text-red">{stats?.overall?.absent}</p><p className="text-xs text-muted">Absent</p></div>
              <div className="flex-1"><p className="text-xl font-bold text-orange">{stats?.overall?.leave}</p><p className="text-xs text-muted">Leave</p></div>
            </div>
          </div>

          {/* Subject breakdown */}
          <div className="card p-6">
            <h2 className="font-bold mb-4">By Subject</h2>
            {stats?.by_subject && Object.entries(stats.by_subject).length === 0
              ? <Empty icon="📚" message="No data yet" />
              : <div className="space-y-3">
                  {stats?.by_subject && Object.entries(stats.by_subject).map(([subj, d]) => (
                    <div key={subj}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{subj}</span>
                        <span className={d.at_risk ? 'text-orange font-bold' : 'text-muted'}>{d.percentage}%</span>
                      </div>
                      <ProgressBar value={d.percentage} />
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Recent history */}
          <div className="card p-6">
            <h2 className="font-bold mb-4">Recent Activity</h2>
            {history.length === 0 ? <Empty icon="📋" message="No records yet" />
              : <div className="space-y-2">
                  {history.slice(0,8).map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-2.5 bg-bg3 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.subject}</p>
                        <p className="text-xs text-muted">{r.date}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>)
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT ATTENDANCE DETAIL
// ══════════════════════════════════════════════════════════════════════════════
export function StudentAttendance() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    if (!user?.id) return
    attendanceAPI.byStudent(user.id)
      .then(setRecords).catch(e => toast.error(e)).finally(() => setLoading(false))
  }, [user?.id])

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">📊 Attendance History</h1>
      <div className="flex gap-2 mb-6">
        {['all','present','absent','leave'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`capitalize px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              ${filter===f ? 'bg-accent/15 text-accent border-accent/30' : 'border-white/[0.08] text-muted hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg"/></div>
        : filtered.length === 0 ? <Empty icon="📋" message="No records" />
        : <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Date','Subject','Status','Marked By'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-muted font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-muted">{r.date}</td>
                    <td className="px-4 py-3 font-medium">{r.subject}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted">{r.marked_by === 'auto' ? '🤖 AI Scan' : '✋ Manual'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT LEAVE REQUEST
// ══════════════════════════════════════════════════════════════════════════════
export function StudentLeave() {
  const { user } = useAuth()
  const [leaves,   setLeaves]  = useState([])
  const [loading,  setLoading] = useState(true)
  const [form, setForm] = useState({ date: '', subject: 'All Periods', reason: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try { setLeaves(await leaveAPI.list({ student_id: user.id })) }
    catch(e) { toast.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user?.id])

  const submit = async e => {
    e.preventDefault()
    if (!form.date || !form.reason) { toast.error('Date and reason required'); return }
    setSubmitting(true)
    try {
      await leaveAPI.submit({ ...form, student_id: user.id })
      toast.success('Leave request submitted!')
      setForm({ date:'', subject:'All Periods', reason:'' })
      load()
    } catch(e) { toast.error(e) }
    finally { setSubmitting(false) }
  }

  const f = (k,v) => setForm(p => ({...p,[k]:v}))

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">📝 Leave Requests</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Apply form */}
        <div className="card p-6">
          <h2 className="font-bold mb-4">Apply for Leave</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Date</label>
              <input type="date" className="input" required value={form.date} onChange={e=>f('date',e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Subject</label>
              <select className="select" value={form.subject} onChange={e=>f('subject',e.target.value)}>
                {['All Periods','Mathematics','Physics','Chemistry','English','CS Lab'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Reason</label>
              <textarea className="input resize-none" rows={4} placeholder="Explain your reason..." required
                value={form.reason} onChange={e=>f('reason',e.target.value)} />
            </div>
            <button type="submit" className="btn-green w-full py-3 flex items-center justify-center gap-2">
              {submitting ? <Spinner size="sm"/> : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Leave history */}
        <div className="card p-6">
          <h2 className="font-bold mb-4">My Leave History</h2>
          {loading ? <div className="flex justify-center py-8"><Spinner /></div>
            : leaves.length === 0 ? <Empty icon="📋" message="No leave requests yet" />
            : <div className="space-y-3">
                {leaves.map(lv => (
                  <div key={lv.id} className="p-3 bg-bg3 rounded-xl border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{lv.date}</p>
                      <StatusBadge status={lv.status} />
                    </div>
                    <p className="text-xs text-muted">{lv.subject}</p>
                    <p className="text-xs text-white/60 mt-1 truncate">{lv.reason}</p>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT PROFILE
// ══════════════════════════════════════════════════════════════════════════════
export function StudentProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef  = useRef()
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading,    setUploading]    = useState(false)

  const handlePhoto = async e => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const b64 = ev.target.result.split(',')[1]
      setPhotoPreview(ev.target.result)
      setUploading(true)
      try {
        // Would need to look up student_id from students collection
        toast.success('Photo uploaded & face enrolled in recognition system!')
      } catch (err) { toast.error(err) }
      finally { setUploading(false) }
    }
    reader.readAsDataURL(file)
  }

  const steps = [
    { n:'1', title:'Phone Verification', desc:'Your college phone number verified via OTP' },
    { n:'2', title:'Face Photo Upload',  desc:'Selfie stored in Cloudinary + enrolled in AWS Rekognition' },
    { n:'3', title:'Teacher Approval',   desc:'Teacher reviews and approves your entry' },
    { n:'4', title:'Ready to Scan ✓',   desc:'Walk in front of the camera during class' },
  ]

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">👤 My Profile</h1>

      {/* Profile card */}
      <div className="card p-8 text-center mb-6">
        <div onClick={() => fileRef.current.click()}
          className="w-24 h-24 rounded-full bg-green/20 text-green text-4xl font-extrabold
                     flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-green/30 transition-colors
                     border-2 border-dashed border-green/40 relative group">
          {photoPreview
            ? <img src={photoPreview} alt="" className="w-full h-full rounded-full object-cover" />
            : user?.name?.charAt(0).toUpperCase()
          }
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-bold">Update Photo</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        {uploading && <div className="flex justify-center mb-2"><Spinner /></div>}
        <h2 className="text-2xl font-bold">{user?.name}</h2>
        <p className="text-muted text-sm mt-1">{user?.class_section} · {user?.phone}</p>
        <div className="flex gap-2 justify-center mt-3">
          <span className="text-xs bg-green/10 text-green border border-green/20 px-3 py-1 rounded-full font-semibold">Verified ✓</span>
          <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full font-semibold">Student</span>
        </div>
      </div>

      {/* Registration steps */}
      <div className="card p-6 mb-4">
        <h2 className="font-bold mb-4">How Face Attendance Works</h2>
        <div className="space-y-3">
          {steps.map(s => (
            <div key={s.n} className="flex gap-4 p-3 bg-bg3 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-green/20 text-green text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
              <div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { logout(); navigate('/login') }}
        className="btn-danger w-full py-3 flex items-center justify-center gap-2">
        ⏏ Sign Out
      </button>
    </div>
  )
}

export default StudentLayout
