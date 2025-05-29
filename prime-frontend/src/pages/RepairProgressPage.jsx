// src/pages/RepairProgressPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Navigate, redirect, useParams }                from 'react-router-dom';
import { AuthContext }                         from '../contexts/AuthContext';
import { listAllAppointments, submit_payment, submit_approval, submit_pickup } from '../api/appointments';
import { Link, useNavigate } from 'react-router-dom';
import './RepairProgressPage.css';

const steps = [
  'Diagnostic Fee',
  'Diagnosis',
  'Quote Approval',
  'Repair Process',
  'Final Payment & Pickup'
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
  const DiagnosticFee = 30;


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
  //statLower in a funtion to be called everytime change of state is expected
  
  const stateLower = appointment.state.toLowerCase();
  const price = Number(appointment.price);
  const when = new Date(appointment.datetime).toLocaleString('pt-PT', {
    dateStyle: 'short', timeStyle: 'short'
  });

  // 1) Still waiting for drop-off?
  if (stateLower === 'started') {
    return (
      <div className="repair-page">
        <h1 className="title">Repair Progress</h1>
        <div className="scheduled">
          <strong>Scheduled for {when}</strong> – Waiting for drop-off
        </div>
      </div>
    );
  }

  // 2) compute step index directly from state
  let stepIndex = 0;
  if (stateLower === 'started')  stepIndex = 0;
  else if (stateLower === 'payment')      stepIndex = 1;      
  else if (stateLower === 'diagnosis')     stepIndex = 2;
  else if (stateLower === 'approval')      stepIndex = 3;
  else if (stateLower === 'approved')       stepIndex = 4;
  else if (stateLower === 'waiting pickup') stepIndex = 5;
  else if (stateLower === 'ended')          stepIndex = 6;

  

  const handlePayment = async () => {
    setPaying(true);
    setError('');
    try {
      await submit_payment(appointment.id, true);
      // no local step state—backend flip will re-render us into next UI
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  //funtion to accept quote
  const handleAcceptQuote = async () => {
    setApproving(true);
    setError('');
    try {
      await submit_approval(appointment.id, true);
      // no local step state—backend flip will re-render us into next UI
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
      // no local step state—backend flip will re-render us into next UI
    } catch {
      setError('Quote acceptance failed. Please try again.');
    } 
    finally {
      setPickup(false);
    }
  };


  const renderStepContent = () => {
    switch (stepIndex) {
      case 0:
          return (
        <div className="repair-page">
          <h1 className="title">Repair Progress</h1>
          <div className="scheduled">
            <strong>Scheduled for {when}</strong> – Waiting for drop-off
          </div>
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
              onClick={async () => {
              handlePayment();
              }}
              className="action-btn"
            >
              Pay Now
            </button>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h2>Diagnosis</h2>
            <p>Your device is being diagnosed. We’ll notify you when it’s done.</p>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h2>Quote Approval</h2>
          
            <p>Please approve your repair quote.</p>
            <div className="payment-box">
              <span className="currency">€</span>
              <span className="amount">{price.toFixed(2)}</span>
            </div>
          
            <button
              onClick={async () => {
                handleAcceptQuote();
              }}
              className="action-btn"
            >
              Accept Quote
            </button>
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h2>Repair Process</h2>
            <p>Your device is currently under repair.</p>
          </div>
        );
      case 5:
        const totalPrice = parseFloat(appointment.price) || 0;
        const remaining  = Math.max(0, totalPrice - DiagnosticFee);
        return (
          <div className="step-content">
            <h2>Final Payment & Pickup</h2>
            <p>Repair is complete! Please settle the remaining balance and pick up your device.</p>
            <div className="billing-box">
              <div>Repair Quote: €{totalPrice.toFixed(2)}</div>
              <div>Diagnostic Fee Paid: €{DiagnosticFee.toFixed(2)}</div>
              <hr/>
              <div><strong>Amount Due: €{remaining.toFixed(2)}</strong></div>
            </div>
            {error && <p className="error">{error}</p>}
            <button
              onClick={() => handlePickup()}
              disabled={paying || remaining === 0}
              className="action-btn"
            >
              {paying ? 'Processing…' : `Pay Remaining €${remaining.toFixed(2)}`}
            </button>
          </div>
        );

        case 6:
        return (
          <div className="step-content">
            <h2>Reapair Ended</h2>
            <p>You have payed your invoice and picked-up your device.</p>
            <p>Thank you for using our service!</p>
            <Link to="/my-repairs/"> Go Back </Link>
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
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`progress-step ${idx <= stepIndex ? 'active' : ''}`}
              style={{ left: `${(idx / (steps.length - 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {renderStepContent()}
    </div>
  );
}