import React, { useState, useEffect } from 'react';
import './MakeAppointmentPage.css'; 
import { list_services } from '../api/auth';
import { getAvailableSlots, bookAppointment } from '../api/auth';

export default function MakeAppointmentPage() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate]           = useState('');
  const [slots, setSlots]         = useState([]);
  const [slot, setSlot]           = useState('');
  const [urgent, setUrgent]       = useState(false);
  const [message, setMessage]     = useState('');

  // Load services on mount
  useEffect(() => {
    list_services().then(res => setServices(res.data));
  }, []);

  // When date changes, fetch slots
  useEffect(() => {
    if (date) {
      getAvailableSlots(date)
        .then(res => setSlots(res.data))
        .catch(() => setSlots([]));
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
    try {
      await bookAppointment({ service_id: serviceId, date, slot, urgent });
      setMessage('Appointment booked successfully!');
    } catch (err) {
      setMessage('Failed to book appointment.');
    }
  };

  return (
    <div className="appoint-page">
      <h1>Make an Appointment</h1>
      <form className="appoint-form" onSubmit={handleSubmit}>
        {/* Service selector */}
        <label>
          Service
          <select value={serviceId} onChange={e => setServiceId(e.target.value)} required>
            <option value="">— pick a service —</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (€{parseFloat(s.base_price).toFixed(2)})
              </option>
            ))}
          </select>
        </label>

        {/* Date picker */}
        <label>
          Pick a date
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
          />
        </label>

        {/* Available slots */}
        {date && (
          <label>
            Available Slots
            <select value={slot} onChange={e => setSlot(e.target.value)} required>
              <option value="">— select a time —</option>
              {slots.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}

        {/* Urgent checkbox */}
        <label className="urgent-label">
          <input 
            type="checkbox" 
            checked={urgent} 
            onChange={e => setUrgent(e.target.checked)} 
          />
          Mark as urgent
        </label>

        <button type="submit">Book Appointment</button>
      </form>

      {message && <p className="appoint-message">{message}</p>}
    </div>
  );
}