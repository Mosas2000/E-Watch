import { useState } from 'react';
import { registerEvent } from '../services/contractService';

export const EventRegistration = () => {
  const [eventType, setEventType] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    setLoading(true);
    try {
      const response = await registerEvent(eventType, data);
      setSuccess(`Event registered successfully. Transaction ID: ${response.txid}`);
      setEventType('');
      setData('');
    } catch (err: any) {
      setError(`Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-registration">
      <h2>Register New Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="eventType">Event Type</label>
          <input
            id="eventType"
            type="text"
            placeholder="e.g., transfer, mint, burn"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            maxLength={50}
            disabled={loading}
          />
          <small>{eventType.length}/50 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="data">Event Data</label>
          <textarea
            id="data"
            placeholder="Enter event data in JSON or text format"
            value={data}
            onChange={(e) => setData(e.target.value)}
            maxLength={500}
            rows={6}
            disabled={loading}
          />
          <small>{data.length}/500 characters</small>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register Event'}
        </button>
      </form>
    </div>
  );
};
