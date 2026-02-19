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
      setTotalEvents(count.value?.value || 0);
    } catch (error) {
      console.error('Failed to load event count:', error);
      setTotalEvents(0);
    }
  };

  const fetchEvent = async () => {
    if (!searchId) return;

    setLoading(true);
    try {
      const result = await getEvent(Number(searchId));
      if (result?.value) {
        const event = result.value;
        setEvents([{
          owner: event.owner?.value || '',
          eventType: event['event-type']?.value || '',
          timestamp: event.timestamp?.value || 0,
          data: event.data?.value || '',
          active: event.active?.value || false
        }]);
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
    <section className="event-dashboard" aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading">Event Dashboard</h2>
      <p className="section-description">
        Search blockchain events registered on the Stacks mainnet by their numeric ID. Filter results by active or inactive
        status to find specific on-chain records. Each event includes the registrant address, event type, timestamp, and
        stored data payload.
      </p>
      
      <div className="dashboard-stats" role="region" aria-label="Dashboard statistics">
        <p>
          <strong>Total Events:</strong> 
          <span className="stat-value" aria-label={`${totalEvents} total events`}>{totalEvents}</span>
        </p>
      </div>

      <div className="search-section" role="search" aria-label="Event search">
        <h3 className="sr-only">Search Events</h3>
        <label htmlFor="event-search" className="sr-only">
          Enter Event ID to search
        </label>
        <input
          id="event-search"
          type="number"
          placeholder="Enter Event ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          min="0"
          aria-describedby="search-help"
        />
        <small id="search-help" className="sr-only">
          Enter a numeric event ID to retrieve specific event details
        </small>
        <button 
          onClick={fetchEvent} 
          disabled={loading}
          aria-busy={loading ? 'true' : 'false'}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="filter-section" role="region" aria-label="Event filters">
        <label htmlFor="status-filter">Filter by status:</label>
        <select 
          id="status-filter"
          value={activeFilter} 
          onChange={(e) => setActiveFilter(e.target.value as any)}
          aria-label="Filter events by status"
        >
          <option value="all">All Events</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      <div className="events-list" role="region" aria-label="Event results" aria-live="polite">
        <h3 className="sr-only">Event Results</h3>
        {loading && (
          <p className="loading-indicator" role="status" aria-live="assertive">
            Searching for event...
          </p>
        )}
        {!loading && filteredEvents.length === 0 ? (
          <p className="no-results" role="status">
            No events to display. Try searching for an event ID or adjust your filters.
          </p>
        ) : (
          <ul className="events-container" role="list">
            {filteredEvents.map((event, index) => (
              <li key={index} className="event-card" role="article">
                <div className="event-header">
                  <h4 className="event-type" aria-label={`Event type: ${event.eventType}`}>
                    {event.eventType}
                  </h4>
                  <span 
                    className={`event-status ${event.active ? 'active' : 'inactive'}`}
                    role="status"
                    aria-label={`Status: ${event.active ? 'Active' : 'Inactive'}`}
                  >
                    {event.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <dl className="event-details">
                  <dt>Owner:</dt>
                  <dd>{event.owner}</dd>
                  
                  <dt>Timestamp:</dt>
                  <dd>
                    <time dateTime={new Date(event.timestamp * 1000).toISOString()}>
                      {new Date(event.timestamp * 1000).toLocaleString()}
                    </time>
                  </dd>
                  
                  <dt>Data:</dt>
                  <dd className="event-data">{event.data}</dd>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
