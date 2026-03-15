import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/shared/UI'

// ── Login Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [role,    setRole]    = useState('teacher')
  const [form,    setForm]    = useState({ email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const creds = role === 'teacher'
        ? { email: form.email, password: form.password }
        : { phone: form.phone, password: form.password }
      const user = await login(creds)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl
                          bg-gradient-to-br from-accent to-purple shadow-lg shadow-accent/30 mb-5">
            <span className="text-4xl">👁️</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">FaceTrack</h1>
          <p className="text-muted mt-2 text-sm">Smart Attendance System</p>
        </div>

        <div className="card p-8">
          {/* Role toggle */}
          <div className="flex bg-bg3 rounded-xl p-1 mb-7">
            {['teacher','student'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                  ${role===r ? (r==='teacher'?'bg-accent text-white':'bg-green text-bg') : 'text-muted hover:text-white'}`}>
                {r === 'teacher' ? '🧑‍🏫 Teacher' : '🎓 Student'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} className="space-y-4">
            {role === 'teacher' ? (
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Email</label>
                <input className="input" type="email" placeholder="teacher@college.edu" required
                  value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
            ) : (
              <div>
                <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Phone Number</label>
                <input className="input" type="tel" placeholder="10-digit mobile number" required
                  value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
              </div>
            )}
            <div>
              <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
              <input className="input" type="password" placeholder="••••••••" required minLength={6}
                value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
            </div>
            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm mt-2 flex items-center justify-center gap-2 transition-all
                ${role==='teacher' ? 'btn-primary' : 'btn-green'}`}>
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            No account?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
