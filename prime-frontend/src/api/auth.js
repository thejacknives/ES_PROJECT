import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function loginUser(data) {
  return api.post('/login/credentials/', data);
}

export function loginUserFace(data) {
  return api.post('/login/face/', data);
}

export function registerUser(data) {
  return api.post('/register/', data);
}

export function list_services() {
  return api.get('/services/');
}