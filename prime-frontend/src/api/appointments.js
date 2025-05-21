// src/api/appointments.js
import api from './auth';

/**
 * Fetch available slots for a given date (YYYY-MM-DD).
 */
export function getAvailableSlots(date) {
  return api.get(`/available-slots/?date=${date}`);
}

/**
 * Submit a new repair request to the backend via /start-repair/
 * Expects payload:
 *   {
 *     user_id:             number,
 *     service_id:          number,
 *     appointment_datetime:string,  // "YYYY-MM-DDTHH:mm:00Z"
 *     urgency:             boolean,
 *     customer_showed_up:   boolean
 *   }
 */
export function bookAppointment(data) {
  return api.post('/start-repair/', data);
}