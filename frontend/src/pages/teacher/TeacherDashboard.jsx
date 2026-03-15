import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { periodAPI, studentAPI } from '../../services/api'
import { StatCard, StatusBadge, Spinner, Empty } from '../../components/shared/UI'
import toast from 'react-hot-toast'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [periods,  setPeriods]  = useState([])
  const [pending,  setPending]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ subject:'', start_time:'08:30', end_time:'09:30', class_section: user?.class_section || '' })

  const load = async () => {
    setLoading(true)
    try {
      const [p, pend] = await Promise.all([periodAPI.today(), studentAPI.pending()])
      setPeriods(p); setPending(pend)
    } catch (e) { toast.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const createPeriod = async e => {
    e.preventDefault()
    setCreating(true)
    try {
      await periodAPI.create(form)
      toast.success('Period started!')
      setForm(p => ({...p, subject:''}))
      load()
    } catch (e) { toast.error(e) }
    finally { setCreating(false) }
  }

  const approve = async id => {
    try { await studentAPI.approve(id); toast.success('Student approved ✓'); load() }
    catch(e) { toast.error(e) }
  }
  const reject = async id => {
    try { await studentAPI.reject(id); toast.success('Rejected'); load() }
    catch(e) { toast.error(e) }
  }

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const subjects = ['Mathematics','Physics','Chemistry','English','CS Lab','History','Biology']

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">{greet()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted mt-1 text-sm">{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's Periods"   value={periods.length}            color="text-accent" sub="scheduled today" />
        <StatCard label="Active Periods"    value={periods.filter(p=>p.is_active).length} color="text-green" sub="live now" />
        <StatCard label="Pending Approvals" value={pending.length}            color="text-orange" sub="need review" />
        <StatCard label="Class Section"     value={user?.class_section||'—'}  color="text-purple" sub="your class" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Period */}
        <div className="card p-6">
          <h2 className="font-bold text-base mb-4">➕ Start New Period</h2>
          <form onSubmit={createPeriod} className="space-y-3">
            <select className="select" required value={form.subject}
              onChange={e => setForm(p => ({...p, subject:e.target.value}))}>
              <option value="">Select Subject...</option>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Start Time</label>
                <input className="input" type="time" required value={form.start_time}
                  onChange={e=>setForm(p=>({...p,start_time:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">End Time</label>
                <input className="input" type="time" required value={form.end_time}
                  onChange={e=>setForm(p=>({...p,end_time:e.target.value}))} />
              </div>
            </div>
            <input className="input" placeholder="Class Section (e.g. CSE-B)" required
              value={form.class_section} onChange={e=>setForm(p=>({...p,class_section:e.target.value}))} />
            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {creating ? <Spinner size="sm"/> : '▶ Start Period'}
            </button>
          </form>
        </div>

        {/* Today's periods */}
        <div className="card p-6">
          <h2 className="font-bold text-base mb-4">📅 Today's Schedule</h2>
          {loading ? <div className="flex justify-center py-8"><Spinner /></div>
            : periods.length === 0 ? <Empty icon="📅" message="No periods today — create one!" />
            : <div className="space-y-3">
                {periods.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-bg3 rounded-xl border border-white/[0.06]">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.is_active ? 'bg-green animate-pulse' : 'bg-dim'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.subject}</p>
                      <p className="text-xs text-muted">{p.start_time} – {p.end_time}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-green font-semibold">{p.present_count}/{p.student_count}</p>
                      <span className={`text-xs font-semibold ${p.is_active ? 'text-green' : 'text-dim'}`}>
                        {p.is_active ? 'Live' : 'Done'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Approval queue */}
        {pending.length > 0 && (
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-bold text-base mb-4">🔔 Pending Approvals <span className="ml-2 bg-red/20 text-red text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span></h2>
            <div className="space-y-3">
              {pending.map(s => (
                <div key={s.id} className="flex items-center gap-4 p-4 bg-bg3 rounded-xl border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-xl bg-purple/20 text-purple flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted">📱 {s.phone} · {s.class_section}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approve(s.id)} className="text-xs bg-green/10 hover:bg-green/20 text-green border border-green/30 px-3 py-1.5 rounded-lg font-semibold transition-colors">✓ Approve</button>
                    <button onClick={() => reject(s.id)}  className="text-xs bg-red/10  hover:bg-red/20  text-red  border border-red/30  px-3 py-1.5 rounded-lg font-semibold transition-colors">✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
