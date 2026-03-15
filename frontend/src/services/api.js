import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data?.error || 'Something went wrong')
  }
)

export const authAPI = {
  login:    d => api.post('/auth/login', d).then(r => r.data),
  register: d => api.post('/auth/register', d).then(r => r.data),
  me:       () => api.get('/auth/me').then(r => r.data),
}
export const studentAPI = {
  list:        p  => api.get('/students', { params: p }).then(r => r.data),
  pending:     () => api.get('/students/pending').then(r => r.data),
  get:         id => api.get(`/students/${id}`).then(r => r.data),
  add:         d  => api.post('/students', d).then(r => r.data),
  bulkUpload:  f  => api.post('/students/bulk-upload', f, { headers: {'Content-Type':'multipart/form-data'} }).then(r => r.data),
  approve:     id => api.put(`/students/${id}/approve`, {}).then(r => r.data),
  reject:      id => api.put(`/students/${id}/reject`, {}).then(r => r.data),
  update:      (id,d) => api.put(`/students/${id}`, d).then(r => r.data),
  delete:      id => api.delete(`/students/${id}`).then(r => r.data),
  uploadPhoto: (id,b64) => api.put(`/students/${id}/photo`, {image_base64:b64}).then(r => r.data),
}
export const periodAPI = {
  create: d  => api.post('/periods', d).then(r => r.data),
  today:  () => api.get('/periods/today').then(r => r.data),
  list:   p  => api.get('/periods', { params: p }).then(r => r.data),
  end:    id => api.put(`/periods/${id}/end`, {}).then(r => r.data),
}
export const attendanceAPI = {
  mark:         d      => api.post('/attendance/mark', d).then(r => r.data),
  closeSession: d      => api.post('/attendance/close-session', d).then(r => r.data),
  byPeriod:     id     => api.get(`/attendance/period/${id}`).then(r => r.data),
  byStudent:    id     => api.get(`/attendance/student/${id}`).then(r => r.data),
  stats:        id     => api.get(`/attendance/student/${id}/stats`).then(r => r.data),
  update:       (id,d) => api.put(`/attendance/update/${id}`, d).then(r => r.data),
}
export const faceAPI = {
  setupCollection: () => api.post('/face/setup-collection').then(r => r.data),
  enroll:  (sid,b64)  => api.post('/face/enroll', {student_id:sid, image_base64:b64}).then(r => r.data),
  match:   b64        => api.post('/face/match', {image_base64:b64}).then(r => r.data),
  remove:  id         => api.delete(`/face/remove/${id}`).then(r => r.data),
}
export const leaveAPI = {
  submit: d       => api.post('/leaves', d).then(r => r.data),
  list: p => api.get('/leaves/', { params: p }).then(r => r.data),
  review: (id,st) => api.put(`/leaves/${id}/review`, {status:st}).then(r => r.data),
}
export const reportAPI = {
  weekly:        cls => api.get('/reports/weekly', { params:{class_section:cls} }).then(r => r.data),
  sendToParents: cls => api.post('/reports/send-to-parents', {class_section:cls}).then(r => r.data),
  notifications: ()  => api.get('/reports/notifications').then(r => r.data),
}
export default api
