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
  const [error, setError] = useState('');
  const [view, setView] = useState('started');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [popupMsg, setPopupMsg] = useState(null);
  const [msgTimer, setMsgTimer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get status indicator class
  const getStatusClass = (state) => {
    const statusMap = {
      'started': 'status-started',
      'Approved': 'status-approved',
      'Payment': 'status-payment',
      'Repair started': 'status-repair',
      'Waiting pickup': 'status-completed',
      'Ended': 'status-ended'
    };
    return statusMap[state] || 'status-started';
  };

  // Helper to format state display
  const formatState = (state) => {
    const stateMap = {
      'started': 'Started',
      'Payment': 'Awaiting Payment',
      'Approved': 'Payment Approved',
      'Repair started': 'Repair In Progress',
      'Waiting pickup': 'Ready for Pickup',
      'Ended': 'Completed'
    };
    return stateMap[state] || state;
  };

  // Fetch helper with loading state
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await listAllAppointments();
      setAppointments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to clear popup message after delay
  const clearPopupMessage = () => {
    if (msgTimer) clearTimeout(msgTimer);
    const timer = setTimeout(() => setPopupMsg(null), 3000);
    setMsgTimer(timer);
  };

  // Helper to update the selected app with fresh data
  const updateSelectedApp = (appointments, selectedAppId) => {
    const updatedApp = appointments.find(app => app.id === selectedAppId);
    if (updatedApp) {
      setSelectedApp(updatedApp);
    }
  };

  useEffect(() => { 
    if (user?.user_id === 1) fetchAppointments(); 
  }, [user]);
  
  // Update selectedApp when appointments change (if popup is open)
  useEffect(() => {
    if (showPopup && selectedApp) {
      updateSelectedApp(appointments, selectedApp.id);
    }
  }, [appointments, showPopup, selectedApp?.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (msgTimer) clearTimeout(msgTimer);
    };
  }, [msgTimer]);

  if (user?.user_id !== 1) return <Navigate to="/login" replace />;

  const terminalStates = [
    'Ended',
    'No show',
    'Payment failed',
    'Approval failed',
    'Repair failed',
    'Pickup failed'
  ];

  const started = appointments.filter(a => !terminalStates.includes(a.state));
  const past = appointments.filter(a => terminalStates.includes(a.state));
  const data = view === 'started' ? started : past;

  // Sort: urgent first, then by ascending ID
  const sortedData = data.slice().sort((a, b) => {
    if (a.urgency === b.urgency) {
      return a.id - b.id;
    }
    return (b.urgency === true) - (a.urgency === true);
  });

  // Split into urgent and regular
  const urgentData = sortedData.filter(a => a.urgency);
  const regularData = sortedData.filter(a => !a.urgency);

  const openManage = app => {
    setPopupMsg(null);
    if (msgTimer) clearTimeout(msgTimer);
    setSelectedApp(app);
    setShowPopup(true);
  };

  const handleShowedUp = async (didShow) => {
    setIsLoading(true);
    try {
      await customer_showed_up(selectedApp.id, didShow);
      setPopupMsg({ 
        type: 'success', 
        text: didShow ? 'Presence recorded! Awaiting payment.' : 'No-show recorded.' 
      });
      clearPopupMessage();
      await fetchAppointments();
    } catch (err) {
      setPopupMsg({ type: 'error', text: 'Failed to record presence.' });
      clearPopupMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await repair_started(selectedApp.id);
      setPopupMsg({ type: 'success', text: 'Repair started successfully.' });
      clearPopupMessage();
      await fetchAppointments();
    } catch (err) {
      setPopupMsg({ type: 'error', text: 'Failed to start repair.' });
      clearPopupMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await repair_completed(selectedApp.id, true);
      setPopupMsg({ type: 'success', text: 'Repair completed successfully.' });
      clearPopupMessage();
      await fetchAppointments();
    } catch (err) {
      setPopupMsg({ type: 'error', text: 'Failed to complete repair.' });
      clearPopupMessage();
    } finally {
      setIsLoading(false);
    }
  };

  const renderAppointmentTable = (data, title) => (
    <>
      <h3>{title}</h3>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User ID</th>
              <th>Service</th>
              <th>Date & Time</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.id}>
                <td><strong>#{a.id}</strong></td>
                <td>{a.user_id}</td>
                <td>{a.service}</td>
                <td>{new Date(a.datetime).toLocaleString()}</td>
                <td>
                  <span className={`priority-badge ${a.urgency ? 'urgent' : 'regular'}`}>
                    {a.urgency ? 'Urgent' : 'Regular'}
                  </span>
                </td>
                <td>
                  <span className="status-badge">
                    <span className={`status-indicator ${getStatusClass(a.state)}`}></span>
                    {formatState(a.state)}
                  </span>
                </td>
                <td>
                  <button 
                    className="manage-btn" 
                    onClick={() => openManage(a)}
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="loading"></span> : 'Manage'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      
      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="view-switch">
        <button 
          className={view === 'started' ? 'active' : ''} 
          onClick={() => setView('started')}
          disabled={isLoading}
        >
          Active Processes ({started.length})
        </button>
        <button 
          className={view === 'past' ? 'active' : ''} 
          onClick={() => setView('past')}
          disabled={isLoading}
        >
          Completed ({past.length})
        </button>
      </div>

      <section>
        <h2>
          {view === 'started' ? 'Active Repair Processes' : 'Completed Repair Processes'}
        </h2>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading appointments...</p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {view === 'started' ? '📭' : '🎉'}
            </div>
            <p style={{ fontSize: '1.125rem' }}>
              No {view} appointments found.
            </p>
          </div>
        ) : (
          <>
            {urgentData.length > 0 && renderAppointmentTable(urgentData, 'Urgent Appointments')}
            {regularData.length > 0 && renderAppointmentTable(regularData, 'Regular Appointments')}
          </>
        )}
      </section>

      {showPopup && selectedApp && (
        <div className="popup-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (msgTimer) clearTimeout(msgTimer);
            setShowPopup(false);
          }
        }}>
          <div className="popup">
            <h3>Appointment #{selectedApp.id}</h3>
            <p>
              <strong>Current Status:</strong> 
              <span className="status-badge" style={{ marginLeft: '0.5rem' }}>
                <span className={`status-indicator ${getStatusClass(selectedApp.state)}`}></span>
                {formatState(selectedApp.state)}
              </span>
            </p>

            {selectedApp.state === 'started' && (
              <div className="action-section">
                <p style={{ marginBottom: '1rem' }}>👤 Has the customer arrived?</p>
                <button 
                  className="popup-button" 
                  onClick={() => handleShowedUp(true)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : '✅ Customer Showed Up'}
                </button>
                <button 
                  className="popup-button" 
                  onClick={() => handleShowedUp(false)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : '❌ No Show'}
                </button>
              </div>
            )}
            
            {selectedApp.state === 'Payment' && (
              <div className="popup-feedback success">
                💳 Awaiting payment confirmation...
              </div>
            )}
            
            {selectedApp.state === 'Approved' && (
              <div className="action-section">
                <p style={{ marginBottom: '1rem' }}>🔧 Ready to start repair?</p>
                <button 
                  className="popup-button" 
                  onClick={handleStart}
                  disabled={isLoading}
                >
                  Start Repair
                </button>
              </div>
            )}
            
            {selectedApp.state === 'Repair started' && (
              <div className="action-section">
                <p style={{ marginBottom: '1rem' }}>⚙️ Is the repair complete?</p>
                <button 
                  className="popup-button" 
                  onClick={handleComplete}
                  disabled={isLoading}
                >
                  ✅ Mark Repair Completed
                </button>
              </div>
            )}

            {popupMsg && (
              <div className={`popup-feedback ${popupMsg.type}`}>
                {popupMsg.type === 'success' ? '✅' : '⚠️'} {popupMsg.text}
              </div>
            )}

            <button
              className="popup-button close-btn"
              onClick={() => {
                if (msgTimer) clearTimeout(msgTimer);
                setShowPopup(false);
              }}
              disabled={isLoading}
            >
              Close
            </button>

            
          </div>
        </div>
      )}
    </div>
  );
}