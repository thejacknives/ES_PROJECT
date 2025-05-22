import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { listAllAppointments } from '../api/appointments';
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('started'); // 'started' or 'past'

  // Fetch all appointments when the user is confirmed as admin
  useEffect(() => {
    if (user && user.user_id === 1) {
      listAllAppointments()
        .then(res => setAppointments(res.data))
        .catch(err => {
          console.error('Error fetching appointments', err);
          setError('Failed to load appointments.');
        });
    }
  }, [user]);

  // Redirect non-admin users
  if (!user || user.user_id !== 1) {
    return <Navigate to="/login" replace />;
  }

  // Split by state
  const started = appointments.filter(a => a.state !== 'completed');
  const past    = appointments.filter(a => a.state === 'completed');

  const dataToShow = view === 'started' ? started : past;

  const renderTable = data => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Service ID</th>
          <th>Date & Time</th>
          <th>Urgency</th>
          <th>State</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        {data.map(a => (
          <tr key={a.id}>
            <td>{a.id}</td>
            <td>{a.user_id}</td>
            <td>{a.service_id}</td>
            <td>{new Date(a.datetime).toLocaleString()}</td>
            <td>{a.urgency ? 'Yes' : 'No'}</td>
            <td>{a.state}</td>
            <td>{a.price != null ? `€${a.price.toFixed(2)}` : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      <div className="view-switch">
        <button
          className={view === 'started' ? 'active' : ''}
          onClick={() => setView('started')}
        >
          Started
        </button>
        <button
          className={view === 'past' ? 'active' : ''}
          onClick={() => setView('past')}
        >
          Past
        </button>
      </div>

      <section>
        <h2>{view === 'started' ? 'started Repair Processes' : 'Past Repair Processes'}</h2>
        {dataToShow.length ? renderTable(dataToShow) : <p>No {view} appointments.</p>}
      </section>
    </div>
  );
}