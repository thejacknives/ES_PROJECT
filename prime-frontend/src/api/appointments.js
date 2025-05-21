// src/api/appointments.js
import api from './auth';

/**
 * Fetch available slots for a given date (YYYY-MM-DD).
 */
export function getAvailableSlots(date) {
  return api.get(`/available-slots/?date=${date}`);
}

/**
 * Submit a new repair request to the backend.
 * Uses the `submit_repair_request` endpoint.
 * Payload should include:
 *   {
 *     service_id: number,
 *     date:       string,    // "YYYY-MM-DD"
 *     slot:       string,    // e.g. "09:30"
 *     urgent:     boolean
 *   }
 */
export function bookAppointment(data) {
  return api.post('/start-repair/', data);
}