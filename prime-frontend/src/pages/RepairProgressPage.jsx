import React, { useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import { submit_payment, repair_started, repair_completed } from '../api/appointments';
import './RepairProgressPage.css';

const steps = [
  'Diagnostic Fee',
  'Diagnosis',
  'Quote Approval',
  'Repair Process',
  'Final Payment & Pickup'
];

export default function RepairProgressPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const amountDue = 30.0;
  const { appointmentId } = useParams();
  const [stage, setStage]   = useState('Payment');    // current step
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');


  const handlePayment = async () => {
  console.log('🔍 paying appointmentId (type=%s):', typeof appointmentId, appointmentId)
  setLoading(true);
  setError('');
  try {
    await submit_payment(appointmentId, true);
    setStage('RepairStarted');
  } catch (e) {
    console.error('Payment failed:', e);
    setError('Payment failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <h2>Diagnostic Fee Payment</h2>
            <p>Please pay the diagnostic fee to proceed:</p>
            <div className="payment-box">
              <span className="currency">€</span>
              <span className="amount">{amountDue.toFixed(2)}</span>
            </div>
            <button
              onClick={async () => {
              handlePayment();
              setCurrentStep(1);
              }}
              className="action-btn"
            >
              Pay Now
            </button>
          </div>
        );
      // ... other cases ...
      default:
        return null;
    }
  };

  const fillPercent = (currentStep / (steps.length - 1)) * 100;

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
              className={`progress-step ${idx <= currentStep ? 'active' : ''}`}
              style={{ left: `${(idx / (steps.length - 1)) * 100}%` }}
            />
          ))}
        </div>
      </div>
      {renderStepContent()}
    </div>
  );
}