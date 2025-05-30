import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { listAllAppointments } from '../api/appointments';
import './MyRepairsPage.css';

export default function MyRepairsPage() {
  const { user } = useContext(AuthContext);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    listAllAppointments()
      .then(res => {
        // Only keep those where appointment.user_id === logged-in user
        const mine = res.data.filter(a => a.user_id === user.user_id);
        // Sort by ID in ascending order
        mine.sort((a, b) => a.id - b.id);
        setLoading(false);
        setRepairs(mine);
        setError('');
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load your repairs.');
        setLoading(false);
      });
  }, [user]);

  const getStatusInfo = (state) => {
    const stateLower = state?.toLowerCase() || '';
    
    if (stateLower === 'started') return { class: 'status-pending', text: 'Waiting Drop-off' };
    if (stateLower === 'payment') return { class: 'status-pending', text: 'Payment Due' };
    if (stateLower === 'approval') return { class: 'status-pending', text: 'Awaiting Approval' };
    if (stateLower === 'approved') return { class: 'status-in-progress', text: 'In Progress' };
    if (stateLower === 'waiting pickup') return { class: 'status-completed', text: 'Ready for Pickup' };
    if (stateLower === 'ended') return { class: 'status-completed', text: 'Completed' };
    
    return { class: 'status-pending', text: 'Scheduled' };
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!user) {
    return (
      <div className="my-repairs-page">
        <h1>My Active Repairs</h1>
        <div className="login-prompt">
          <div className="empty-state-icon">🔒</div>
          <h2>Please log in to see your repairs</h2>
          <p>You need to be logged in to view your repair appointments and track their progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-repairs-page">
      <h1>My Active Repairs</h1>
      
      {loading && (
        <div className="loading">
          Loading your repairs...
        </div>
      )}
      
      {error && <div className="error">{error}</div>}

      {!loading && !error && repairs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔧</div>
          <h2>No Active Repairs</h2>
          <p>You don't have any scheduled repair appointments at the moment.</p>
          <p>Ready to fix your device? Schedule an appointment to get started!</p>
        </div>
      )}

      {!loading && repairs.length > 0 && (
        <ul className="repair-list">
          {repairs.map(r => {
            const statusInfo = getStatusInfo(r.state);
            return (
              <li key={r.id} className="repair-item">
                <div className="repair-id">#{r.id}</div>
                
                <div className="repair-service">
                  {r.service}
                  <span className={`status-indicator ${statusInfo.class}`}>
                    {statusInfo.text}
                  </span>
                </div>
                
                <div className="repair-date">
                  Scheduled for: {formatDate(r.datetime)}
                </div>
                
                <button
                  className="view-btn"
                  onClick={() => navigate(`/repair-progress/${r.id}`)}
                >
                  View Progress
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}