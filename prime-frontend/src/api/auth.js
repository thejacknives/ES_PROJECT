import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api'; // Update if your backend uses another path

export async function registerUser(data) {
  return axios.post(`${BASE_URL}/register/`, data);
}

export async function loginUser(data) {
  return axios.post(`${BASE_URL}/login/`, data);
}