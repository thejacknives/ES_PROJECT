import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { listAllAppointments } from '../api/appointments';
import './MyRepairsPage.css';

export default function MyRepairsPage() {
  const { user } = useContext(AuthContext);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    listAllAppointments(user.user_id)
      .then(res => {
        setRepairs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load your repairs.');
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return <p>Please log in to see your repairs.</p>;
  }

  return (
    <div className="my-repairs-page">
      <h1>My Active Repairs</h1>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !repairs.length && (
        <p>You have no ongoing repairs right now.</p>
      )}

      <ul className="repair-list">
        {repairs.map(r => (
          <li key={r.id} className="repair-item">
            <div>
              <strong>#{r.id}</strong> — {r.service}
            </div>
            <div>
              Scheduled for:{' '}
              {new Date(r.datetime).toLocaleString()}
            </div>
            <button
              className="view-btn"
              onClick={() => navigate(`/repair-progress/${r.id}`)}
            >
              View Progress
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}