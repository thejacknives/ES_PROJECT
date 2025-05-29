import React, { useState, useEffect, useContext } from 'react';
import './MakeAppointmentPage.css';
import { list_services } from '../api/auth';
import { getAvailableSlots, bookAppointment } from '../api/appointments';
import { AuthContext } from '../contexts/AuthContext';

export default function MakeAppointmentPage() {
  const { user } = useContext(AuthContext);
  const [services, setServices]   = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [date, setDate]           = useState('');
  const [slots, setSlots]         = useState([]);
  const [slot, setSlot]           = useState('');
  const [urgency, setUrgency]     = useState(false);
  const [message, setMessage]     = useState('');

  useEffect(() => {
    list_services()
      .then(res => setServices(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!date) return setSlots([]);
    getAvailableSlots(date)
      .then(res => {
        setSlots(Array.isArray(res.data.available_slots) ? res.data.available_slots : []);
      })
      .catch(console.error);
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName || !date || !slot) {
      return setMessage('Please select service, date, and slot.');
    }
    const payload = {
      user_id: user.user_id,
      service: serviceName,
      price: services.find(s => s.name === serviceName).base_price,
      appointment_datetime: `${date}T${slot}:00Z`,
      urgency
    };
    try {
      await bookAppointment(payload);
      setMessage('Appointment booked successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to book appointment.');
    }
  };

  return (
    <div className="appoint-page">
      <h1>Make an Appointment</h1>
      <form onSubmit={handleSubmit} className="appoint-form">
        <label>
          Service
          <select
            value={serviceName}
            onChange={e => setServiceName(e.target.value)}
            required
          >
            <option value="">— pick a service —</option>
            {services.map(s => (
              <option key={s.id} value={s.name}>
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
              {slots.length
                ? slots.map(t => <option key={t} value={t}>{t}</option>)
                : <option disabled>No slots available</option>}
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