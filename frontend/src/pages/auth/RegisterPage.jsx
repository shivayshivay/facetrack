import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/shared/UI'

export default function RegisterPage() {
  const navigate  = useNavigate()
  const [role,    setRole]    = useState('teacher')
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', password:'', class_section:'' })
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { name: form.name,email: form.email, phone: form.phone, password: form.password, role }
      if (role === 'teacher') { payload.email = form.email; payload.class_section = form.class_section }
      else                    { payload.phone = form.phone }
      const data = await authAPI.register(payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user',  JSON.stringify(data.user))
      toast.success('Account created!')
      navigate(role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (k,v) => setForm(p => ({...p, [k]:v}))

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-accent to-purple mb-4">
            <span className="text-3xl">👁️</span>
          </div>
          <h1 className="text-3xl font-extrabold">Create Account</h1>
          <p className="text-muted mt-1 text-sm">Join FaceTrack</p>
        </div>

        <div className="card p-8">
          <div className="flex bg-bg3 rounded-xl p-1 mb-6">
            {['teacher','student'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize
                  ${role===r ? (r==='teacher'?'bg-accent text-white':'bg-green text-bg') : 'text-muted'}`}>
                {r === 'teacher' ? '🧑‍🏫 Teacher' : '🎓 Student'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input className="input" placeholder="Your full name" required value={form.name} onChange={e=>f('name',e.target.value)} />
            </div>
            {role === 'teacher' ? (<>
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
                <input className="input" type="email" placeholder="teacher@college.edu" required value={form.email} onChange={e=>f('email',e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Class Section</label>
                <input className="input" placeholder="e.g. CSE-B" value={form.class_section} onChange={e=>f('class_section',e.target.value)} />
              </div>
            </>) : (
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">College Phone Number</label>
                <input className="input" type="tel" placeholder="10-digit number registered with college" required value={form.phone} onChange={e=>f('phone',e.target.value)} />
                <p className="text-xs text-dim mt-1">Must match the number your teacher added to the system</p>
              </div>
            )}
            <div>
              <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" required minLength={6} value={form.password} onChange={e=>f('password',e.target.value)} />
            </div>
            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                ${role==='teacher' ? 'btn-primary' : 'btn-green'}`}>
              {loading ? <Spinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
