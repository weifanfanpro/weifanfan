import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE || '/api',
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      const err = new Error(res.message || '请求失败')
      err.code = res.code
      return Promise.reject(err)
    }
    return res.data
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function get(url, params) {
  return service.get(url, { params })
}

export function post(url, data) {
  return service.post(url, data)
}

export function put(url, data) {
  return service.put(url, data)
}

export function del(url) {
  return service.delete(url)
}

export default service
