import { useState, useRef } from 'react';
import { registerEvent, invalidateCache } from '../services/contractService';
import { useApp } from '../contexts/AppContext';

export const EventRegistration = () => {
  const { isAuthenticated, userAddress } = useApp();
  const [eventType, setEventType] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastSubmitTime = useRef(0);
  const SUBMIT_COOLDOWN_MS = 10_000; // 10 second cooldown between submissions

  const validateForm = () => {
    if (!eventType || eventType.length === 0) {
      setError('Event type is required');
      return false;
    }
    if (eventType.length > 50) {
      setError('Event type must be 50 characters or less');
      return false;
    }
    if (!data || data.length === 0) {
      setError('Event data is required');
      return false;
    }
    if (data.length > 500) {
      setError('Event data must be 500 characters or less');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    // Enforce cooldown between submissions to prevent accidental double-sends
    const now = Date.now();
    const elapsed = now - lastSubmitTime.current;
    if (elapsed < SUBMIT_COOLDOWN_MS) {
      const waitSec = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000);
      setError(`Please wait ${waitSec} seconds before submitting again.`);
      return;
    }

    setLoading(true);
    lastSubmitTime.current = Date.now();
    try {
      const response = await registerEvent(eventType, data);
      setSuccess(`Event registered successfully. Transaction ID: ${response.txid}`);
      setEventType('');
      setData('');
      // Invalidate caches so the dashboard shows the new event
      invalidateCache();
    } catch (err: any) {
      setError(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !userAddress) {
    return (
      <section className="event-registration" aria-labelledby="registration-heading">
        <h2 id="registration-heading">Register New Event</h2>
        <p className="warning" role="alert">Please connect your wallet to register events.</p>
      </section>
    );
  }

  return (
    <section className="event-registration" aria-labelledby="registration-heading">
      <h2 id="registration-heading">Register New Blockchain Event</h2>
      <p className="section-description">
        Write events directly to the Stacks mainnet through the E-Watch Clarity smart contract. Each registration creates
        a permanent on-chain record tied to your wallet address. Event types are limited to 50 characters and data payloads
        to 500 characters. A small STX transaction fee applies.
      </p>
      <form onSubmit={handleSubmit} aria-label="Event registration form">
        <div className="form-group">
          <label htmlFor="eventType">
            Event Type <span className="required" aria-label="required">*</span>
          </label>
          <input
            id="eventType"
            type="text"
            placeholder="e.g., transfer, mint, burn"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            maxLength={50}
            disabled={loading}
            aria-required="true"
            aria-invalid={error.includes('Event type') ? 'true' : 'false'}
            aria-describedby="eventType-help"
          />
          <small id="eventType-help" className="help-text">
            {eventType.length}/50 characters - Brief identifier for your event
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="data">
            Event Data <span className="required" aria-label="required">*</span>
          </label>
          <textarea
            id="data"
            placeholder="Enter event data in JSON or text format"
            value={data}
            onChange={(e) => setData(e.target.value)}
            maxLength={500}
            rows={6}
            disabled={loading}
            aria-required="true"
            aria-invalid={error.includes('Event data') ? 'true' : 'false'}
            aria-describedby="data-help"
          />
          <small id="data-help" className="help-text">
            {data.length}/500 characters - Detailed information about the event
          </small>
        </div>

        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message" role="status" aria-live="polite">
            {success}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          aria-busy={loading ? 'true' : 'false'}
        >
          {loading ? 'Registering...' : 'Register Event'}
        </button>
      </form>
    </section>
  );
};
