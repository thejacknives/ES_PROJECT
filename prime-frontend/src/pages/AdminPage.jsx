// src/pages/AdminPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  listAllAppointments,
  customer_showed_up,
  repair_started,
  repair_completed
} from '../api/appointments';
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [error, setError]               = useState('');
  const [view, setView]                 = useState('started');
  const [showPopup, setShowPopup]       = useState(false);
  const [selectedApp, setSelectedApp]   = useState(null);
  const [popupMsg, setPopupMsg]         = useState(null); // { type:'success'|'error', text }

  // fetch helper:
  const fetchAppointments = () => {
    listAllAppointments()
      .then(r => setAppointments(r.data))
      .catch(() => setError('Failed to load appointments.'));
  };
  useEffect(() => { if (user?.user_id === 1) fetchAppointments(); }, [user]);
  if (user?.user_id !== 1) return <Navigate to="/login" replace />;

  const started = appointments.filter(a => a.state !== 'Ended');
  const past    = appointments.filter(a => a.state === 'Ended');
  const data    = view === 'started' ? started : past;

  const openManage = app => {
    setPopupMsg(null);
    setSelectedApp(app);
    setShowPopup(true);
  };

  const handleShowedUp = didShow => {
    customer_showed_up(selectedApp.id, didShow)
      .then(() => {
        setPopupMsg({ type:'success', text: didShow
          ? 'Presence recorded! Awaiting payment.'
          : 'No-show recorded.' });
        fetchAppointments();
      })
      .catch(() => setPopupMsg({ type:'error', text: 'Failed to record presence.' }));
  };

  const handleStart = () => {
    repair_started(selectedApp.id)
      .then(() => {
        setPopupMsg({ type:'success', text: 'Repair started.' });
        fetchAppointments();
      })
      .catch(() => setPopupMsg({ type:'error', text: 'Failed to start repair.' }));
  };

  const handleComplete = () => {
    repair_completed(selectedApp.id, true)
      .then(() => {
        setPopupMsg({ type:'success', text: 'Repair completed.' });
        fetchAppointments();
      })
      .catch(() => setPopupMsg({ type:'error', text: 'Failed to complete repair.' }));
  };

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      <div className="view-switch">
        <button className={view==='started'?'active':''} onClick={()=>setView('started')}>Started</button>
        <button className={view==='past'?'active':''}   onClick={()=>setView('past')}>Past</button>
      </div>

      <section>
        <h2>{view==='started'?'Started Repair Processes':'Past Repair Processes'}</h2>
        {data.length===0
          ? <p>No {view} appointments.</p>
          : <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>User ID</th><th>Service</th>
                  <th>Date &amp; Time</th><th>Urgent</th><th>State</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {data.map(a=>(
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.user_id}</td>
                    <td>{a.service}</td>
                    <td>{new Date(a.datetime).toLocaleString()}</td>
                    <td>{a.urgency?'Yes':'No'}</td>
                    <td>{a.state}</td>
                    <td>
                      <button className="manage-btn" onClick={()=>openManage(a)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </section>

      {showPopup && selectedApp && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Appointment #{selectedApp.id}</h3>
            <p>Current state: <strong>{selectedApp.state}</strong></p>

            {selectedApp.state === 'started' && (
              <>
                <p>Customer arrival?</p>
                <button className="popup-button" onClick={()=>handleShowedUp(true)}>
                  Customer Showed Up
                </button>
                <button className="popup-button" onClick={()=>handleShowedUp(false)}>
                  No Show
                </button>
              </>
            )}
            {selectedApp.state === 'Payment' && (
              <p className="popup-feedback success">
                Awaiting payment
              </p>
            )}
            {selectedApp.state === 'Approved' && (
              <>
                <p>Start Repair?</p>
                <button className="popup-button" onClick={()=>handleStart()}>
                  Start Repair
                </button>
              </>
            )}
            {selectedApp.state === 'Repair started' && (
              <>
                <button className="popup-button" onClick={handleComplete}>
                  Mark Repair Completed
                </button>
              </>
            )}

            {popupMsg && (
              <p className={`popup-feedback ${popupMsg.type}`}>
                {popupMsg.text}
              </p>
            )}

            <button
              className="popup-button close-btn"
              onClick={()=>setShowPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}