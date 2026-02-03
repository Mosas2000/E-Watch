# E-Watch API Documentation

## Smart Contract Functions

### Public Functions

#### register-event
Registers a new event on-chain.

Parameters:
- event-type: string-ascii (max 50 chars)
- data: string-ascii (max 500 chars)

Returns: event ID (uint)

#### update-event
Updates an existing event's data.

Parameters:
- event-id: uint
- new-data: string-ascii (max 500 chars)

Returns: boolean

Errors:
- u404: Event not found
- u403: Unauthorized (not owner)
- u410: Event inactive

#### deactivate-event
Deactivates an event.

Parameters:
- event-id: uint

Returns: boolean

Errors:
- u404: Event not found
- u403: Unauthorized (not owner)

### Read-Only Functions

#### get-event
Retrieves event details by ID.

Parameters:
- event-id: uint

Returns: Event object or none

#### get-event-count
Returns total number of events registered.

Returns: uint

## Frontend API

### Contract Service

```typescript
import { registerEvent, getEvent, updateEvent, deactivateEvent } from './services/contractService';

await registerEvent('transfer', '{"amount": 100}');
const event = await getEvent(0);
await updateEvent(0, '{"amount": 200}');
await deactivateEvent(0);
```

## Error Codes

- u404: Resource not found
- u403: Unauthorized access
- u410: Resource inactive
