// src/pages/RepairProgressPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Navigate, redirect, useParams, useNavigate }                from 'react-router-dom';
import { AuthContext }                         from '../contexts/AuthContext';
import { listAllAppointments, submit_payment, submit_approval, submit_pickup } from '../api/appointments';
import './RepairProgressPage.css';

const steps = [
  'Waiting for Drop-off',
  'Diagnostic Fee',
  'Quote Approval',
  'Repair Process',
  'Final Payment & Pickup',
  'Repair Finished'
];

export default function RepairProgressPage() {
  const { user }          = useContext(AuthContext);
  const { appointmentId } = useParams();
  const [ appointment, setAppointment ] = useState(null);
  const [ loading, setLoading ]         = useState(true);
  const [ error, setError ]             = useState('');
  const [ paying, setPaying ]           = useState(false);
  const [ approving, setApproving ]     = useState(false);
  const [ pickingup, setPickup]         = useState(false);
  const navigate          = useNavigate();
  const DiagnosticFee = 20;
  const UrgentFee = 30;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    listAllAppointments()
      .then(res => {
        const appt = res.data.find(a => a.id === Number(appointmentId));
        if (!appt) throw new Error();
        setAppointment(appt);
      })
      .catch(() => setError('Could not load your appointment.'))
      .finally(() => setLoading(false));
  }, [user, appointmentId]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (loading) {
    return <p className="loading">Loading…</p>;
  }
  if (error || !appointment) {
    return <p className="error">{error || 'Appointment not found.'}</p>;
  }

  const stateLower = appointment.state.toLowerCase();
  const price = Number(appointment.price);
  const when = new Date(appointment.datetime).toLocaleString('pt-PT', {
    dateStyle: 'short', timeStyle: 'short'
  });

  // Compute step index directly from state
  let stepIndex = 0;
  if (stateLower === 'started')           stepIndex = 0;
  else if (stateLower === 'payment')      stepIndex = 1;
  else if (stateLower === 'approval')     stepIndex = 2;
  else if (stateLower === 'approved')     stepIndex = 3;
  else if (stateLower === 'waiting pickup') stepIndex = 4;
  else if (stateLower === 'ended')        stepIndex = 5;

  const handlePayment = async () => {
    setPaying(true);
    setError('');
    try {
      await submit_payment(appointment.id, true);
      fetchAppointment(); // refresh appointment state
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const handleAcceptQuote = async () => {
    setApproving(true);
    setError('');
    try {
      await submit_approval(appointment.id, true);
      fetchAppointment(); // refresh appointment state
    } catch {
      setError('Quote acceptance failed. Please try again.');
    } 
    finally {
      setApproving(false);
    }
  };

  const handlePickup = async () => {
    setPickup(true);
    setError('');
    try {
      await submit_pickup(appointment.id, true);
      fetchAppointment(); // refresh appointment state
    } catch {
      setError('Pickup confirmation failed. Please try again.');
    } 
    finally {
      setPickup(false);
    }
  };

  // Fetch helper
  const fetchAppointment = async () => {
    try {
      const res = await listAllAppointments();
      const appt = res.data.find(a => a.id === Number(appointmentId));
      if (!appt) throw new Error('Appointment not found');
      setAppointment(appt);
    } catch (err) {
      console.error(err);
      setError('Failed to load appointment details.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (stepIndex) {
      case 0: // Waiting for drop-off
        return (
          <div className="step-content">
            <h2>Waiting for Drop-off</h2>
            <p><strong>Scheduled for {when}</strong></p>
            <p>Please bring your device to our repair center at the scheduled time.</p>
            <p>Your repair has started and we're waiting for you to drop off your device.</p>
          </div>
        );
      case 1: // Payment
        return (
          <div className="step-content">
            <h2>Diagnostic Fee Payment</h2>
            <p>Please pay the diagnostic fee to proceed:</p>
            <div className="payment-box">
              <span className="currency">€</span>
              <span className="amount">{DiagnosticFee.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePayment}
              disabled={paying}
              className="action-btn"
            >
              {paying ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        );
      case 2: // Quote Approval
        return (
          <div className="step-content">
            <h2>Quote Approval</h2>
            <p>Please approve your repair quote.</p>
            <div className="payment-box">
              <span className="currency">€</span>
              <span className="amount">{price.toFixed(2)}</span>
            </div>
            <button
              onClick={handleAcceptQuote}
              disabled={approving}
              className="action-btn"
            >
              {approving ? 'Processing...' : 'Accept Quote'}
            </button>
          </div>
        );
      case 3: // Repair Process
        return (
          <div className="step-content">
            <h2>Repair in Progress</h2>
            <p>Your device is currently being repaired.</p>
            <p>We'll notify you once the repair is complete and ready for pickup.</p>
          </div>
        );
      case 4: // Final Payment & Pickup
        const totalPrice = parseFloat(appointment.price) || 0;
        const urgentFee = appointment.urgency ? UrgentFee : 0;
        const totalWithUrgent = totalPrice + urgentFee;
        const remaining = Math.max(0, totalWithUrgent - DiagnosticFee);
        
        return (
          <div className="step-content">
            <h2>Final Payment & Pickup</h2>
            <p>Repair is complete! Please settle the remaining balance and pick up your device.</p>
            <div className="billing-box">
              <div>Repair Quote: {totalPrice.toFixed(2)}€</div>
              {appointment.urgency && (
                <div>Urgent Service Fee: {urgentFee.toFixed(2)}€</div>
              )}
              <div>Diagnostic Fee Paid: -{DiagnosticFee.toFixed(2)}€</div>
              <hr/>
              <div><strong>Amount Due: €{remaining.toFixed(2)}</strong></div>
            </div>
            {error && <p className="error">{error}</p>}
            <button
              onClick={handlePickup}
              disabled={pickingup}
              className="action-btn"
            >
              {pickingup ? 'Processing…' : `Pay Remaining €${remaining.toFixed(2)} & Pickup`}
            </button>
          </div>
        );
      case 5: // Ended
        return (
          <div className="step-content">
            <h2>Repair Completed</h2>
            <p>You have paid your invoice and picked up your device.</p>
            <p>Thank you for using our service!</p>
            <button 
              onClick={() => navigate('/my-repairs/')} 
              className="action-btn"
            >
              Go Back
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const fillPercent = (stepIndex / (steps.length - 1)) * 100;

  return (
    <div className="repair-page">
      <h1 className="title">Repair Progress</h1>

      <div className="progress-container">
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <div className="progress-steps">
          {steps.map((stepName, idx) => (
            <div key={idx} className="progress-step-container">
              <div
                className={`progress-step ${
                  idx < stepIndex ? 'completed' : idx === stepIndex ? 'active' : ''
                }`}
              />
              <div
                className={`step-label ${
                  idx < stepIndex ? 'completed' : idx === stepIndex ? 'active' : ''
                }`}
              >
                {stepName}
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderStepContent()}
    </div>
  );
}