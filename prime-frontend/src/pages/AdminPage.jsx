import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { listAllAppointments } from '../api/appointments';  // point to appointments.js
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('started'); // 'started' or 'past'
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (user?.user_id === 1) {
      listAllAppointments()
        .then(res => setAppointments(res.data))
        .catch(err => {
          console.error('Error fetching appointments', err);
          setError('Failed to load appointments.');
        });
    }
  }, [user]);

  if (user?.user_id !== 1) {
    return <Navigate to="/login" replace />;
  }

  const started = appointments.filter(a => a.state !== 'Ended');
  const past    = appointments.filter(a => a.state === 'Ended');
  const dataToShow = view === 'started' ? started : past;

  const renderTable = data => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>User ID</th>
          <th>Service</th>
          <th>Date & Time</th>
          <th>Urgency</th>
          <th>State</th>
          <th>Manage</th>
        </tr>
      </thead>
      <tbody>
        {data.map(a => (
          <tr key={a.id}>
            <td>{a.id}</td>
            <td>{a.user_id}</td>        {/* fixed from a.user */}
            <td>{a.service}</td>
            <td>{new Date(a.datetime).toLocaleString()}</td>
            <td>{a.urgency ? 'Yes' : 'No'}</td>
            <td>{a.state.charAt(0).toUpperCase() + a.state.slice(1)}</td>
            <td>
              <button
                className="manage-btn"
                onClick={() => setShowPopup(true)}
              >
                Manage
              </button>
            </td>
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
        <h2>
          {view === 'started'
            ? 'Started Repair Processes'
            : 'Past Repair Processes'}
        </h2>
        {dataToShow.length
          ? renderTable(dataToShow)
          : <p>No {view} appointments.</p>
        }
      </section>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <button
              className="popup-button"
              onClick={() => setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}