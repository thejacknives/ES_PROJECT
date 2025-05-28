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

export function listAllAppointments() {
  return api.get('/list-appointments/');
}

export function customer_showed_up(appointment_id, showed_up) {
  return api.post('/workflow/customer-showup/', { appointment_id, customer_showed_up: showed_up });
}

export function submit_payment(appointment_id, paid) {
  return api.post('/workflow/submit-payment/', {
    appointment_id: Number(appointment_id),   // coerce to integer
    payment_received: paid                    // boolean flag
  });
}

export function submit_approval(appointment_id, approval_data) {
  return api.post('/workflow/submit-approval/', { appointment_id, approval_data });
}

export function repair_started(appointment_id, start) {
  return api.post('/workflow/repair-started/', { appointment_id, repair_started: start });
}

export function repair_completed(appointment_id, complete) {
  return api.post('/workflow/repair-completed/', { appointment_id, repair_completed: complete });
}