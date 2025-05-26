// src/pages/AdminPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { listAllAppointments, customer_showed_up } from '../api/appointments';
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [error, setError]               = useState('');
  const [view, setView]                 = useState('started');
  const [showPopup, setShowPopup]       = useState(false);
  const [selectedApp, setSelectedApp]   = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupError, setPopupError] = useState(false);

  useEffect(() => {
    if (user?.user_id === 1) {
      listAllAppointments()
        .then(res => setAppointments(res.data))
        .catch(err => {
          console.error(err);
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

  const openPopup = (app) => {
    setPopupMessage('');         // clear any old message
    setSelectedApp(app);
    setShowPopup(true);
  };

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
        {dataToShow.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Service</th>
                <th>Date &amp; Time</th>
                <th>Urgency</th>
                <th>State</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {dataToShow.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.user_id}</td>
                  <td>{a.service}</td>
                  <td>{new Date(a.datetime).toLocaleString()}</td>
                  <td>{a.urgency ? 'Yes' : 'No'}</td>
                  <td>{a.state}</td>
                  <td>
                    <button
                      className="manage-btn"
                      onClick={() => openPopup(a)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No {view} appointments.</p>
        )}
      </section>

      {showPopup && selectedApp && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Manage Appointment #{selectedApp.id}</h3>
            <p>Current status: <strong>{selectedApp.state}</strong></p>

            {/* Display feedback here */}
            {popupMessage && (
              <p className={`popup-feedback ${popupError ? 'error' : 'success'}`}>
                {popupMessage}
              </p>
            )}

            <button
              className="popup-button"
              onClick={() => {
                customer_showed_up({
                appointment_id: selectedApp.id,
                customer_showed_up: true
              })
                .then(() => {
                  setPopupError(false);
                  setPopupMessage('Presence recorded! Awaiting payment.');
                })
                .catch(() => {
                  setPopupError(true);
                  setPopupMessage('Failed to record presence.');
                });
              }}
            >
              Customer Showed Up
            </button>

            <button
              className="popup-button"
              onClick={() => {
                customer_showed_up({
                appointment_id: selectedApp.id,
                customer_showed_up: false
              })
                .then(() => {
                  setPopupError(false);
                  setPopupMessage('No-show recorded.');
                })
                .catch(() => {
                  setPopupError(true);
                  setPopupMessage('Failed to record no-show.');
                });
              }}
            >
              Customer Did Not Show
            </button>

            <button
              className="popup-button close-btn"
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