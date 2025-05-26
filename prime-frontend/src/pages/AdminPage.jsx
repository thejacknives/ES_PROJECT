// src/pages/AdminPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  listAllAppointments,
  customer_showed_up,
  repair_completed,
  repair_started,
} from '../api/appointments';
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('started');        // 'started' or 'past'
  const [showPopup, setShowPopup] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [popupMsg, setPopupMsg] = useState(null);     // success / error

  // Fetch appointments
  const fetchAppointments = () => {
    listAllAppointments()
      .then(res => setAppointments(res.data))
      .catch(err => {
        console.error(err);
        setError('Failed to load appointments.');
      });
  };

  useEffect(() => {
    if (user?.user_id === 1) {
      fetchAppointments();
    }
  }, [user]);

  // guard admin
  if (user?.user_id !== 1) {
    return <Navigate to="/login" replace />;
  }

  // split by state
  const started = appointments.filter(a => a.state !== 'Ended');
  const past    = appointments.filter(a => a.state === 'Ended');
  const dataToShow = view === 'started' ? started : past;

  // open modal
  const openManage = app => {
    setSelectedApp(app);
    setPopupMsg(null);
    setShowPopup(true);
  };

  // modal action for “customer showed up”
  const handleShowedUp = (didShow) => {
    customer_showed_up(selectedApp.id, didShow)
      .then(() => {
        setPopupMsg({ type: 'success', text: 'State updated—awaiting payment.' });
        fetchAppointments();
      })
      .catch(err => {
        console.error(err);
        setPopupMsg({ type: 'error', text: 'Failed to update state.' });
      });
  };

  const handleStartRepair = () => {
    repair_started(selectedApp.id, true)
      .then(() => {
        setPopupMsg({ type: 'success', text: 'Repair started.' });
        fetchAppointments();
      })
      .catch(() => {
        setPopupMsg({ type: 'error', text: 'Failed to start repair.' });
      });
  };


  // modal action for “repair completed”
  const handleRepairComplete = () => {
    repair_completed(selectedApp.id)
      .then(() => {
        setPopupMsg({ type: 'success', text: 'Repair marked completed.' });
        fetchAppointments();
      })
      .catch(err => {
        console.error(err);
        setPopupMsg({ type: 'error', text: 'Failed to complete repair.' });
      });
  };

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      <div className="view-switch">
        <button
          className={view === 'started' ? 'active' : ''}
          onClick={() => setView('started')}
        >Started</button>
        <button
          className={view === 'past' ? 'active' : ''}
          onClick={() => setView('past')}
        >Past</button>
      </div>

      <section>
        <h2>{view === 'started' ? 'Started Repair Processes' : 'Past Repair Processes'}</h2>
        {dataToShow.length === 0
          ? <p>No {view} appointments.</p>
          : (
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
                {dataToShow.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.user_id}</td>
                    <td>{a.service}</td>
                    <td>{new Date(a.datetime).toLocaleString()}</td>
                    <td>{a.urgency ? 'Yes' : 'No'}</td>
                    <td>{a.state}</td>
                    <td>
                      <button className="manage-btn" onClick={() => openManage(a)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </section>

      {showPopup && selectedApp && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Appointment {selectedApp.id}</h3>
            {/* dynamic content */}
            {selectedApp.state === 'started' && (
              <>
                <p>Customer arrival?</p>
                <button className="popup-button" onClick={() => handleShowedUp(true)}>
                  Customer Showed Up
                </button>
                <button className="popup-button" onClick={() => handleShowedUp(false)}>
                  No Show
                </button>
              </>
            )}
            {selectedApp.state === 'Payment' && (
              <p>Awaiting payment...</p>
            )}
            {selectedApp.state === 'Repair started' && (
              <button className="popup-button" onClick={handleStartRepair}>
                Start Repair
              </button>
            )}
            {/* only show if repair started */}
            {selectedApp.state === 'Repair completed' && (
              <button className="popup-button" onClick={handleRepairComplete}>
                Mark Repair Completed
              </button>
            )}
            {/* message */}
            {popupMsg && (
              <p className={popupMsg.type === 'success' ? 'popup-success' : 'popup-error'}>
                {popupMsg.text}
              </p>
            )}
            {/* close button */}
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}