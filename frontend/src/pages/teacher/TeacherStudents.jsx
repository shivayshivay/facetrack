import { useState, useEffect, useRef } from 'react'
import { studentAPI, leaveAPI, reportAPI } from '../../services/api'
import { StatusBadge, Spinner, Empty, Modal, ProgressBar, SectionHeader, Avatar } from '../../components/shared/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'

// ══════════════════════════════════════════════════════════════════════════════
// STUDENTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function TeacherStudents() {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [form, setForm] = useState({ name:'', roll_no:'', phone:'', class_section:'', parent_name:'', parent_phone:'' })
  const [adding, setAdding] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try { setStudents(await studentAPI.list()) }
    catch(e) { toast.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const addStudent = async (e) => {
  e.preventDefault()
  setAdding(true)

  try {
    await studentAPI.add(form)
    toast.success('Student added!')
    setShowAdd(false)
    load()
  } 
  catch(e) {
    toast.error(e)
  } 
  finally {
    setAdding(false)
  }
 }

  const bulkUpload = async e => {
    const file = e.target.files[0]; if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await studentAPI.bulkUpload(fd)
      toast.success(r.message)
      load()
    } catch(e) { toast.error(e) }
    e.target.value = ''
  }

  const deleteStudent = async id => {
    if (!confirm('Delete this student?')) return
    try { await studentAPI.delete(id); toast.success('Deleted'); load() }
    catch(e) { toast.error(e) }
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.includes(search) ||
    s.phone?.includes(search))

  const f = (k,v) => setForm(p => ({...p,[k]:v}))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">👥 Students</h1>
          <p className="text-muted text-sm mt-1">{students.length} total students</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fileRef.current.click()} className="btn-ghost text-sm">📤 Bulk CSV Upload</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">+ Add Student</button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={bulkUpload} />
        </div>
      </div>

      {/* CSV hint */}
      <div className="card p-4 mb-6 bg-accent/5 border-accent/20">
        <p className="text-xs text-accent">📋 CSV format: <span className="font-mono bg-bg3 px-2 py-0.5 rounded">name, roll_no, phone, class_section, parent_name, parent_phone</span></p>
      </div>

      {/* Search */}
      <input className="input mb-4" placeholder="🔍 Search by name, roll number or phone..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {/* Table */}
      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : filtered.length === 0 ? <Empty icon="👥" message="No students found" />
        : <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wider">Roll No</th>
                  <th className="px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs text-muted font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s,i) => (
                  <tr key={s.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${i%2===0?'':'bg-white/[0.01]'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted font-mono">{s.roll_no}</td>
                    <td className="px-4 py-3 text-muted">{s.phone}</td>
                    <td className="px-4 py-3 text-muted">{s.class_section}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.is_verified ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                        {s.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteStudent(s.id)} className="text-xs text-muted hover:text-red transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }

      {/* Add student modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Student">
        <form onSubmit={addStudent} className="space-y-3">
          {[['name','Full Name'],['roll_no','Roll Number'],['phone','Phone'],['class_section','Class Section'],['parent_name','Parent Name'],['parent_phone','Parent Phone']].map(([k,l]) => (
            <input key={k} className="input" placeholder={l} required={['name','roll_no','phone','class_section'].includes(k)}
              value={form[k]} onChange={e=>f(k,e.target.value)} />
          ))}
          <button type="submit" className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
            {adding ? <Spinner size="sm"/> : 'Add Student'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LEAVES PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function TeacherLeaves() {
  const [leaves, setLeaves] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setLeaves(await leaveAPI.list({ status: filter })) }
    catch(e) { toast.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filter])

  const review = async (id, status) => {
    try {
      await leaveAPI.review(id, status)
      toast.success(`Leave ${status}`)
      load()
    } catch(e) { toast.error(e) }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-2">📝 Leave Requests</h1>
      <p className="text-muted text-sm mb-6">Review and approve student leave applications</p>

      <div className="flex gap-2 mb-6">
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`capitalize px-4 py-2 rounded-xl text-sm font-semibold border transition-all
              ${filter===s ? 'bg-accent/15 text-accent border-accent/30' : 'border-white/[0.08] text-muted hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : leaves.length === 0 ? <Empty icon="📝" message={`No ${filter} requests`} />
        : <div className="space-y-3">
            {leaves.map(lv => (
              <div key={lv.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={lv.student_name || '?'} color="bg-purple/20 text-purple" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{lv.student_name}</p>
                      <StatusBadge status={lv.status} />
                    </div>
                    <p className="text-sm text-muted">{lv.date} · {lv.subject}</p>
                    <p className="text-sm text-white/80 mt-2 bg-bg3 px-3 py-2 rounded-lg">{lv.reason}</p>
                    {lv.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => review(lv.id,'approved')} className="text-xs bg-green/10 text-green border border-green/30 hover:bg-green/20 px-4 py-2 rounded-lg font-semibold">✓ Approve</button>
                        <button onClick={() => review(lv.id,'rejected')} className="text-xs bg-red/10 text-red border border-red/30 hover:bg-red/20 px-4 py-2 rounded-lg font-semibold">✕ Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function TeacherReports() {
  const [cls,      setCls]     = useState('')
  const [report,   setReport]  = useState(null)
  const [loading,  setLoading] = useState(false)
  const [sending,  setSending] = useState(false)

  const load = async () => {
    if (!cls) { toast.error('Enter a class section'); return }
    setLoading(true)
    try { setReport(await reportAPI.weekly(cls)) }
    catch(e) { toast.error(e) }
    finally { setLoading(false) }
  }

  const sendReport = async () => {
    setSending(true)
    try { const r = await reportAPI.sendToParents(cls); toast.success(r.message) }
    catch(e) { toast.error(e) }
    finally { setSending(false) }
  }

  const chartColors = ['#5b8af5','#5b8af5','#3ecf8e','#f5a623','#5b8af5']

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-2">📊 Reports</h1>
      <p className="text-muted text-sm mb-6">Weekly attendance analytics by class section</p>

      <div className="flex gap-3 mb-6">
        <input className="input flex-1" placeholder="Class section (e.g. CSE-B)"
          value={cls} onChange={e => setCls(e.target.value)} onKeyDown={e => e.key==='Enter' && load()} />
        <button onClick={load} className="btn-primary px-6">Generate</button>
        {report && (
          <button onClick={sendReport} disabled={sending} className="btn-green px-6 flex items-center gap-2">
            {sending ? <Spinner size="sm"/> : '📨 Send to Parents'}
          </button>
        )}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        : !report ? (
          <div className="card p-12 text-center">
            <p className="text-5xl mb-4">📊</p>
            <p className="text-muted">Enter a class section to generate the weekly report</p>
          </div>
        ) : (<>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="stat-card"><p className="text-xs text-muted mb-1">Week Average</p><p className={`text-3xl font-bold ${report.week_average>=75?'text-green':'text-orange'}`}>{report.week_average}%</p></div>
            <div className="stat-card"><p className="text-xs text-muted mb-1">Week</p><p className="text-sm font-semibold leading-tight mt-1">{report.week}</p></div>
            <div className="stat-card"><p className="text-xs text-muted mb-1">At-Risk Students</p><p className="text-3xl font-bold text-red">{report.at_risk_students.length}</p><p className="text-xs text-dim mt-1">below 75%</p></div>
            <div className="stat-card"><p className="text-xs text-muted mb-1">Class</p><p className="text-2xl font-bold text-purple">{report.class_section}</p></div>
          </div>

          {/* Bar chart */}
          <div className="card p-6 mb-6">
            <h2 className="font-bold mb-4">Day-wise Attendance</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={report.day_stats} barSize={32}>
                <XAxis dataKey="date" tick={{fill:'#8890a8',fontSize:11}} tickFormatter={d=>new Date(d).toLocaleDateString('en',{weekday:'short'})} />
                <YAxis domain={[0,100]} tick={{fill:'#8890a8',fontSize:11}} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={v=>[`${v}%`,'Attendance']} contentStyle={{background:'#1e2235',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,color:'#e8eaf0'}} />
                <Bar dataKey="percentage" radius={[6,6,0,0]}>
                  {report.day_stats.map((d,i) => (
                    <Cell key={i} fill={d.percentage>=75?'#3ecf8e':d.percentage>=60?'#f5a623':'#e85d5d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* At-risk students */}
          {report.at_risk_students.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold mb-4 text-orange">⚠️ At-Risk Students (below 75%)</h2>
              <div className="space-y-3">
                {report.at_risk_students.map(s => (
                  <div key={s.roll_no} className="flex items-center gap-3 p-3 bg-orange/5 border border-orange/20 rounded-xl">
                    <Avatar name={s.name} color="bg-orange/20 text-orange" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted">Roll #{s.roll_no}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange">{s.percentage}%</p>
                      <ProgressBar value={s.percentage} className="w-24 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function TeacherSettings() {
  const [toggle, setToggle] = useState({ sms: true, fcm: true, weeklyReport: true, liveness: true, autoVerify: true, lowLight: false })
  const t = k => setToggle(p => ({...p,[k]:!p[k]}))

  const Row = ({ label, desc, k }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-none">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted mt-0.5">{desc}</p>
      </div>
      <button onClick={()=>t(k)}
        className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${toggle[k]?'bg-green':'bg-bg3 border border-white/[0.08]'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${toggle[k]?'translate-x-5':'translate-x-0.5'}`}/>
      </button>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">⚙️ Settings</h1>
      <div className="card p-6 mb-4">
        <h2 className="font-bold mb-2 text-muted text-xs uppercase tracking-wider">Notifications</h2>
        <Row label="Parent SMS Alerts"   desc="Send SMS via MSG91 when student is absent"    k="sms" />
        <Row label="Push Notifications"  desc="Firebase Cloud Messaging for in-app alerts"   k="fcm" />
        <Row label="Weekly Auto-Report"  desc="Share report every Friday evening"            k="weeklyReport" />
      </div>
      <div className="card p-6 mb-4">
        <h2 className="font-bold mb-2 text-muted text-xs uppercase tracking-wider">AI & Recognition</h2>
        <Row label="Liveness Detection"  desc="Anti-spoofing — blocks photo/video attacks"   k="liveness" />
        <Row label="Auto-Verification"   desc="Match student phone with college database"    k="autoVerify" />
        <Row label="Low-Light Mode"      desc="Improve detection in dimly lit classrooms"    k="lowLight" />
      </div>
      <div className="card p-6">
        <h2 className="font-bold mb-3 text-muted text-xs uppercase tracking-wider">System Info</h2>
        <div className="space-y-2 text-xs font-mono text-muted">
          {[['Backend','Flask + MongoDB'],['AI Engine','AWS Rekognition'],['Notifications','Firebase FCM + MSG91'],['Storage','Cloudinary'],['Version','FaceTrack v1.0']].map(([k,v])=>(
            <div key={k} className="flex justify-between"><span className="text-dim">{k}</span><span className="text-white/60">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeacherStudents
