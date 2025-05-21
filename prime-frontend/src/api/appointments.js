// src/api/appointments.js
import api from './auth';

// Fetch available slots for a given date (YYYY-MM-DD)
export function getAvailableSlots(date) {
  return api.get(`/available-slots/?date=${date}`);
}

// Book a new appointment
export function bookAppointment(data) {
  return api.post('/appointments/book/', data);
}