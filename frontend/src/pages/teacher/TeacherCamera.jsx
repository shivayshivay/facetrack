import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { periodAPI, attendanceAPI, faceAPI, studentAPI } from '../../services/api'
import { Spinner, StatusBadge, Modal } from '../../components/shared/UI'
import toast from 'react-hot-toast'

export default function TeacherCamera() {
  const webcamRef  = useRef(null)
  const intervalRef = useRef(null)

  const [periods,       setPeriods]       = useState([])
  const [selectedPeriod,setSelectedPeriod]= useState(null)
  const [isLive,        setIsLive]        = useState(false)
  const [isScanning,    setIsScanning]    = useState(false)
  const [detected,      setDetected]      = useState([])
  const [lastMatch,     setLastMatch]     = useState(null)
  const [totalStudents, setTotalStudents] = useState(0)
  const [showOverride,  setShowOverride]  = useState(false)
  const [absentStudents,setAbsentStudents]= useState([])
  const [camError,      setCamError]      = useState(false)

  useEffect(() => {
    periodAPI.today().then(setPeriods).catch(() => {})
  }, [])

  // ── Auto-scan every 2.5 seconds while live ────────────────────────────────
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(scanOnce, 2500)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isLive, detected, selectedPeriod])

  // Reset camera error when switching periods
  useEffect(() => {
    if (selectedPeriod) setCamError(false)
  }, [selectedPeriod])

  const scanOnce = useCallback(async () => {
    if (!webcamRef.current || isScanning || !selectedPeriod) return
    setIsScanning(true)
    try {
      const screenshot = webcamRef.current.getScreenshot()
      if (!screenshot) return
      const b64 = screenshot.split(',')[1]
      const res = await faceAPI.match(b64)
      
      if (res.matched) {
        const alreadyMarked = detected.find(d => d.id === res.student.id)
        if (!alreadyMarked) {
          await attendanceAPI.mark({
            student_id: res.student.id,
            period_id:  selectedPeriod.id,
            subject:    selectedPeriod.subject,
            confidence: res.confidence,
          })
          setDetected(prev => [...prev, { ...res.student, confidence: res.confidence }])
          setLastMatch({ ...res.student, confidence: res.confidence, message: 'Attended marked ✓' })
          setTimeout(() => setLastMatch(null), 3000)
        }
      } else if (res.message) {
        // Show matching messages (e.g. "No face detected") as transient feedback
        setLastMatch({ error: true, message: res.message })
        setTimeout(() => setLastMatch(prev => prev?.error ? null : prev), 2500)
      }
    } catch (e) {
      if (e.message !== "Network Error") {
        toast.error(`Marking error: ${e}`);
      }
    } finally {
      setIsScanning(false)
    }
  }, [isScanning, detected, selectedPeriod])

  const startSession = () => {
    if (!selectedPeriod) { toast.error('Select a period first'); return }
    setCamError(false) // Force retry camera access
    setIsLive(true)
    setDetected([])
    setLastMatch(null)
    setTotalStudents(selectedPeriod.student_count || 0)
    toast.success(`📷 Scanning started for ${selectedPeriod.subject}`)
  }

  const endSession = async () => {
    clearInterval(intervalRef.current)
    setIsLive(false)
    try {
      const res = await attendanceAPI.closeSession({
        period_id:     selectedPeriod.id,
        class_section: selectedPeriod.class_section,
      })
      await periodAPI.end(selectedPeriod.id)
      toast.success(res.message)
      // Reload periods
      periodAPI.today().then(setPeriods)
    } catch (e) { toast.error(e) }
  }

  const loadAbsentStudents = async () => {
    try {
      const all      = await studentAPI.list({ class_section: selectedPeriod?.class_section, is_verified: true })
      const detectedIds = detected.map(d => d.id)
      setAbsentStudents((all || []).filter(s => !detectedIds.includes(s.id)))
    } catch (e) {}
  }

  const manualMark = async (student) => {
    try {
      await attendanceAPI.mark({
        student_id: student.id,
        period_id:  selectedPeriod.id,
        subject:    selectedPeriod.subject,
      })
      setDetected(prev => [...prev, student])
      setAbsentStudents(prev => prev.filter(s => s.id !== student.id))
      toast.success(`${student.name} marked present ✓`)
    } catch (e) { toast.error(e) }
  }

  const absentCount = Math.max(0, totalStudents - detected.length)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">📷 Attendance Scanner</h1>
        <p className="text-muted text-sm mt-1">Face recognition marks students present automatically</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera */}
        <div className="lg:col-span-2 space-y-4">
          {/* Period selector */}
          <div className="card p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted font-semibold uppercase tracking-wider mb-1.5 block">Select Period</label>
                <select className="select" disabled={isLive}
                  onChange={e => setSelectedPeriod(periods.find(p => p.id === e.target.value) || null)}>
                  <option value="">Choose period...</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>{p.subject} ({p.start_time}–{p.end_time})</option>
                  ))}
                </select>
              </div>
              {!isLive
                ? <button onClick={startSession} className="btn-green px-6 py-3 whitespace-nowrap">▶ Start</button>
                : <button onClick={endSession}   className="btn-danger px-6 py-3 whitespace-nowrap">■ End Session</button>
              }
            </div>
          </div>

          {/* Webcam view */}
          <div className="card overflow-hidden relative" style={{aspectRatio:'4/3'}}>
            {camError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
                <span className="text-5xl">📷</span>
                <p className="text-sm">Camera not available</p>
                <p className="text-xs text-dim">Allow camera access in browser and refresh</p>
                <button onClick={() => setCamError(false)} className="btn-ghost text-xs mt-2">Retry</button>
              </div>
            ) : (
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" mirrored
                className="w-full h-full object-cover"
                onUserMediaError={() => setCamError(true)}
                videoConstraints={{ facingMode: 'user' }} />
            )}

            {/* Live badge */}
            {isLive && !camError && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-bold">REC</span>
              </div>
            )}

            {/* Count badge */}
            {isLive && (
              <div className="absolute top-3 right-3 bg-black/70 text-green font-bold text-sm px-3 py-1.5 rounded-full font-mono">
                {detected.length} detected
              </div>
            )}

            {/* Scanning indicator */}
            {isScanning && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
                <Spinner size="sm" /> Scanning...
              </div>
            )}

            {/* Match popup */}
            {lastMatch && (
              <div className={`absolute bottom-3 left-3 right-3 p-3 rounded-xl flex items-center gap-3 animate-in shadow-lg ${lastMatch.error ? 'bg-orange/90 text-black' : 'bg-green/90 text-black'}`}>
                <span className="text-2xl">{lastMatch.error ? '⚠️' : '✅'}</span>
                <div>
                  <p className="font-bold text-sm">{lastMatch.name || 'System'}</p>
                  <p className="text-xs opacity-70">
                    {lastMatch.error ? lastMatch.message : `Roll #${lastMatch.roll_no} · ${lastMatch.confidence?.toFixed(1)}% match`}
                  </p>
                </div>
              </div>
            )}

            {/* Idle overlay */}
            {!isLive && !camError && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-full border-2 border-accent/50 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-accent animate-spin-slow" />
                </div>
                <p className="text-muted text-sm">Select a period and press Start</p>
              </div>
            )}
          </div>

          {/* Stats bar */}
          {isLive && (
            <div className="card p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green">{detected.length}</p>
                <p className="text-xs text-muted">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red">{absentCount}</p>
                <p className="text-xs text-muted">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{totalStudents}</p>
                <p className="text-xs text-muted">Total</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Manual override */}
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-3">✋ Manual Override</h3>
            <p className="text-xs text-muted mb-3">Mark present if face scan fails due to lighting or angle</p>
            <button disabled={!isLive}
              onClick={() => { loadAbsentStudents(); setShowOverride(true) }}
              className="btn-ghost w-full text-sm py-2.5 disabled:opacity-40">
              Open Override Panel
            </button>
          </div>

          {/* Detected students */}
          <div className="card p-4 flex-1">
            <h3 className="font-bold text-sm mb-3">✅ Detected ({detected.length})</h3>
            {detected.length === 0
              ? <p className="text-xs text-dim text-center py-6">No students detected yet</p>
              : <div className="space-y-2 max-h-64 overflow-y-auto">
                  {detected.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 bg-bg3 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-green/20 text-green flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                        <p className="text-xs text-muted">Roll #{s.roll_no}</p>
                      </div>
                      {s.confidence && <span className="text-xs text-green font-mono">{s.confidence.toFixed(0)}%</span>}
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>

      {/* Manual override modal */}
      <Modal open={showOverride} onClose={() => setShowOverride(false)} title="Manual Override">
        <p className="text-sm text-muted mb-4">Tap a student to mark them present</p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {absentStudents.length === 0
            ? <p className="text-center text-muted py-6 text-sm">All students are already marked!</p>
            : absentStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-bg3 rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-red/20 text-red flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted">Roll #{s.roll_no}</p>
                  </div>
                  <button onClick={() => manualMark(s)}
                    className="text-xs bg-green/10 text-green border border-green/30 hover:bg-green/20 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                    Mark Present
                  </button>
                </div>
              ))
          }
        </div>
      </Modal>
    </div>
  )
}
