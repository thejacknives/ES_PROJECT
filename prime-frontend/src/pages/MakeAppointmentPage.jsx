import React, { useState, useEffect, useContext } from 'react';
import './MakeAppointmentPage.css';
import { list_services } from '../api/auth';
import { getAvailableSlots, bookAppointment } from '../api/appointments';
import { AuthContext } from '../contexts/AuthContext';

export default function MakeAppointmentPage() {
  const { user } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState('');
  const [urgency, setUrgency] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    list_services()
      .then(res => setServices(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSlot('');
      return;
    }
    
    setSlotsLoading(true);
    getAvailableSlots(date)
      .then(res => {
        setSlots(Array.isArray(res.data.available_slots) ? res.data.available_slots : []);
        setSlot(''); // Reset selected slot when date changes
      })
      .catch(console.error)
      .finally(() => setSlotsLoading(false));
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName || !date || !slot) {
      setMessage('Please select service, date, and slot.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    const payload = {
      user_id: user.user_id,
      service: serviceName,
      price: services.find(s => s.name === serviceName).base_price,
      appointment_datetime: `${date}T${slot}:00Z`,
      urgency
    };

    try {
      await bookAppointment(payload);
      setMessage('🎉 Appointment booked successfully!');
      setMessageType('success');
      
      // Reset form after successful booking
      setTimeout(() => {
        setServiceName('');
        setDate('');
        setSlot('');
        setSlots([]);
        setUrgency(false);
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to book appointment. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

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
            disabled={isLoading}
          >
            <option value="">🔧 Pick a service</option>
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
            disabled={isLoading}
          />
        </label>

        {date && (
          <div className="slots-container">
            <label>
              Available Time Slots
              <select
                value={slot}
                onChange={e => setSlot(e.target.value)}
                required
                disabled={isLoading || slotsLoading}
              >
                <option value="">
                  {slotsLoading ? '⏳ Loading slots...' : '🕒 Select a time'}
                </option>
                {!slotsLoading && slots.length > 0
                  ? slots.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))
                  : !slotsLoading && (
                      <option disabled>❌ No slots available for this date</option>
                    )}
              </select>
            </label>
          </div>
        )}

        <label className="urgent-label">
          <input
            type="checkbox"
            checked={urgency}
            onChange={e => setUrgency(e.target.checked)}
            disabled={isLoading}
          />
          <span>Mark as urgent (+30€ fee)</span>
        </label>

        <button 
          type="submit" 
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>

      {message && (
        <div className={`appoint-message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}