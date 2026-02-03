import { useState, useEffect } from 'react';
import { getEvent, getEventCount } from '../services/contractService';

interface Event {
  owner: string;
  eventType: string;
  timestamp: number;
  data: string;
  active: boolean;
}

export const EventDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadEventCount();
  }, []);

  const loadEventCount = async () => {
    try {
      const count = await getEventCount();
      setTotalEvents(count.value);
    } catch (error) {
      console.error('Failed to load event count:', error);
    }
  };

  const fetchEvent = async () => {
    if (!searchId) return;

    setLoading(true);
    try {
      const result = await getEvent(Number(searchId));
      if (result.value) {
        setEvents([result.value]);
      } else {
        setEvents([]);
        alert('Event not found');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      alert('Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (events: Event[]) => {
    if (activeFilter === 'all') return events;
    return events.filter(e => 
      activeFilter === 'active' ? e.active : !e.active
    );
  };

  const filteredEvents = filterEvents(events);

  return (
    <div className="event-dashboard">
      <h2>Event Dashboard</h2>
      
      <div className="dashboard-stats">
        <p>Total Events: {totalEvents}</p>
      </div>

      <div className="search-section">
        <input
          type="number"
          placeholder="Enter Event ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          min="0"
        />
        <button onClick={fetchEvent} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="filter-section">
        <label>Filter by status:</label>
        <select 
          value={activeFilter} 
          onChange={(e) => setActiveFilter(e.target.value as any)}
        >
          <option value="all">All Events</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <div className="events-list">
        {filteredEvents.length === 0 ? (
          <p>No events to display</p>
        ) : (
          filteredEvents.map((event, index) => (
            <div key={index} className="event-card">
              <div className="event-header">
                <span className="event-type">{event.eventType}</span>
                <span className={`event-status ${event.active ? 'active' : 'inactive'}`}>
                  {event.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="event-details">
                <p><strong>Owner:</strong> {event.owner}</p>
                <p><strong>Timestamp:</strong> {event.timestamp}</p>
                <p><strong>Data:</strong> {event.data}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
