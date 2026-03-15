import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Teacher
import TeacherLayout   from './pages/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherCamera   from './pages/teacher/TeacherCamera'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherReports  from './pages/teacher/TeacherReports'
import TeacherLeaves   from './pages/teacher/TeacherLeaves'
import TeacherSettings from './pages/teacher/TeacherSettings'

// Student
import StudentLayout     from './pages/student/StudentLayout'
import StudentDashboard  from './pages/student/StudentDashboard'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentLeave      from './pages/student/StudentLeave'
import StudentProfile    from './pages/student/StudentProfile'

function PrivateRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e2235', color: '#e8eaf0', border: '1px solid rgba(255,255,255,0.08)' },
            success: { iconTheme: { primary: '#3ecf8e', secondary: '#0d1a12' } },
            error:   { iconTheme: { primary: '#e85d5d', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/"         element={<Navigate to="/login" replace />} />

          {/* Teacher */}
          <Route path="/teacher" element={
            <PrivateRoute role="teacher"><TeacherLayout /></PrivateRoute>
          }>
            <Route index              element={<TeacherDashboard />} />
            <Route path="camera"      element={<TeacherCamera />} />
            <Route path="students"    element={<TeacherStudents />} />
            <Route path="reports"     element={<TeacherReports />} />
            <Route path="leaves"      element={<TeacherLeaves />} />
            <Route path="settings"    element={<TeacherSettings />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={
            <PrivateRoute role="student"><StudentLayout /></PrivateRoute>
          }>
            <Route index               element={<StudentDashboard />} />
            <Route path="attendance"   element={<StudentAttendance />} />
            <Route path="leave"        element={<StudentLeave />} />
            <Route path="profile"      element={<StudentProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
