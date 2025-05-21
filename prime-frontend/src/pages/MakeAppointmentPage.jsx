import React, { useState, useEffect, useContext } from 'react';
import './MakeAppointmentPage.css';
import { list_services } from '../api/auth';
import { getAvailableSlots, bookAppointment } from '../api/appointments';
import { AuthContext } from '../contexts/AuthContext';

export default function MakeAppointmentPage() {
  const { user } = useContext(AuthContext); // user now contains { token, message, user_id }
  const [services, setServices]   = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate]           = useState('');
  const [slots, setSlots]         = useState([]);
  const [slot, setSlot]           = useState('');
  const [urgency, setUrgency]     = useState(false);
  const [message, setMessage]     = useState('');

  // Load services on mount
  useEffect(() => {
    list_services()
      .then(res => setServices(res.data))
      .catch(err => console.error('Error loading services', err));
  }, []);

  // When date changes, fetch slots
  useEffect(() => {
    if (date) {
      getAvailableSlots(date)
        .then(res => {
          const arr = Array.isArray(res.data.available_slots)
            ? res.data.available_slots
            : [];
          setSlots(arr);
        })
        .catch(err => {
          console.error('Error fetching slots', err);
          setSlots([]);
        });
    } else {
      setSlots([]);
    }
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceId || !date || !slot) {
      setMessage('Please select service, date, and slot.');
      return;
    }
    if (!user?.user_id) {
      setMessage('User ID not found. Please log in again.');
      return;
    }

    // Build ISO datetime string
    const appointment_datetime = `${date}T${slot}:00Z`;

    const payload = {
      user_id:            user.user_id,
      service_id:         parseInt(serviceId, 10),
      appointment_datetime,
      urgency:            urgency,
      customer_showed_up: true,
    };

    try {
      await bookAppointment(payload);
      setMessage('Appointment booked successfully!');
    } catch (err) {
      console.error('Booking error:', err.response?.status, err.response?.data);
      const serverMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to book appointment.';
      setMessage(serverMsg);
    }
  };

  return (
    <div className="appoint-page">
      <h1>Make an Appointment</h1>
      <form className="appoint-form" onSubmit={handleSubmit}>
        <label>
          Service
          <select
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
            required
          >
            <option value="">— pick a service —</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (€{parseFloat(s.base_price).toFixed(2)})
              </option>
            ))}
          </select>
        </label>

        <label>
          Pick a date
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </label>

        {date && (
          <label>
            Available Slots
            <select
              value={slot}
              onChange={e => setSlot(e.target.value)}
              required
            >
              <option value="">— select a time —</option>
              {slots.length > 0 ? (
                slots.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))
              ) : (
                <option disabled>No slots available</option>
              )}
            </select>
          </label>
        )}

        <label className="urgent-label">
          <input
            type="checkbox"
            checked={urgency}
            onChange={e => setUrgency(e.target.checked)}
          />
          Mark as urgent
        </label>

        <button type="submit">Book Appointment</button>
      </form>

      {message && <p className="appoint-message">{message}</p>}
    </div>
  );
}