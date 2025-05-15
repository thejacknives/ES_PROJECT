import axios from 'axios';

export async function registerUser(data) {
  return axios.post(`${process.env.REACT_APP_API_URL}register/`, data);
}