import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { listAllAppointments } from '../api/appointments';
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  // Always declare hooks at top-level
  useEffect(() => {
    // Only fetch if logged in as user_id 1
    if (user && user.user_id === 1) {
      listAllAppointments()
        .then(res => setAppointments(res.data))
        .catch(err => {
          console.error('Error fetching appointments', err);
          setError('Failed to load appointments.');
        });
    }
  }, [user]);

  // Then conditionally redirect non-admins
  if (!user || user.user_id !== 1) {
    return <Navigate to="/login" replace />;
  }

  const now = new Date();
  const ongoing = appointments.filter(a =>
    new Date(a.appointment_datetime) >= now && !a.completed
  );
  const past = appointments.filter(a =>
    new Date(a.appointment_datetime) < now || a.completed
  );

  const renderTable = data => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User</th>
          <th>Service</th>
          <th>Date & Time</th>
          <th>Urgent</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody>
        {data.map(a => (
          <tr key={a.id}>
            <td>{a.id}</td>
            <td>{a.user_name || a.user_id}</td>
            <td>{a.service_name || a.service_id}</td>
            <td>{new Date(a.appointment_datetime).toLocaleString()}</td>
            <td>{a.urgency ? 'Yes' : 'No'}</td>
            <td>{a.completed ? 'Yes' : 'No'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      <section>
        <h2>Ongoing Appointments</h2>
        {ongoing.length ? renderTable(ongoing) : <p>No ongoing appointments.</p>}
      </section>

      <section>
        <h2>Past Appointments</h2>
        {past.length ? renderTable(past) : <p>No past appointments.</p>}
      </section>
    </div>
  );
}