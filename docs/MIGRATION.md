# Contract Migration Guide: v1 to v2

This document describes the procedure for migrating the E-Watch
smart contract from v1 (`ewatch.clar`) to v2 (`ewatch-v2.clar`).

---

## Overview

The v2 contract introduces:

- **Admin controls**: pause, unpause, admin transfer
- **Migration functions**: `migrate-event`, `set-event-counter`
- **Version tracking**: `get-version` returns `u2`
- **Pause-gated writes**: all mutating operations check `contract-paused`

The data model (events map, counter) is unchanged. Existing event
data can be imported into v2 without structural transformation.

---

## Prerequisites

1. Deploy `ewatch-v2.clar` to mainnet using the same deployer
   principal that controls the v1 contract.
2. Confirm the v2 contract is accessible and the deployer is set
   as admin (automatic on deployment).
3. Prepare a list of all event IDs and their data from v1. This
   can be obtained by querying `get-event` for each ID from 0 to
   `get-event-count - 1`.

---

## Migration Steps

### Step 1: Snapshot v1 State

Read all events from the v1 contract:

```
for each id in 0..(get-event-count - 1):
    record = get-event(id)
    store record locally
```

Record the final `event-count` value. This is the counter baseline
for v2.

### Step 2: Pause v2

Call `pause-contract` on the v2 contract to prevent external
registrations during the import window.

```clarity
(contract-call? .ewatch-v2 pause-contract)
```

Verify pause status:

```clarity
(contract-call? .ewatch-v2 is-paused)
;; Expected: (ok true)
```

### Step 3: Import Events

For each event recorded in Step 1, call `migrate-event`:

```clarity
(contract-call? .ewatch-v2 migrate-event
    u<event-id>
    '<owner-principal>
    "<event-type>"
    u<timestamp>
    "<data>"
    <active: true|false>
)
```

Process events sequentially. The `migrate-event` function
automatically advances the counter past the highest imported ID.

### Step 4: Align Counter

After all events are imported, explicitly set the counter to
match the v1 final count:

```clarity
(contract-call? .ewatch-v2 set-event-counter u<v1-event-count>)
```

This guarantees new registrations continue from the correct ID
even if events were imported out of order.

### Step 5: Verify Data Integrity

For each imported event, compare the v2 record against the v1
snapshot:

- `owner` must match
- `event-type` must match  
- `timestamp` must match
- `data` must match
- `active` must match

Also verify:

```clarity
(contract-call? .ewatch-v2 get-event-count)
;; Must equal v1 final count
```

### Step 6: Unpause v2

Once verification passes, resume normal operation:

```clarity
(contract-call? .ewatch-v2 unpause-contract)
```

### Step 7: Update Frontend Configuration

Point the frontend `contractService.ts` to the v2 contract
address and contract name. Update the `CONTRACT_ADDRESS` and
`CONTRACT_NAME` constants.

### Step 8: Deprecate v1

The v1 contract remains on-chain (Clarity contracts are
immutable). Mark it as deprecated in documentation and remove
references from the frontend.

---

## Verification Checklist

| Check                                    | Expected                |
|------------------------------------------|-------------------------|
| `get-version` on v2                      | `(ok u2)`               |
| `get-event-count` on v2                  | matches v1 final count  |
| `get-event(0)` on v2                     | matches v1 event 0      |
| `is-paused` on v2                        | `(ok false)` after step 6|
| New `register-event` on v2               | returns next sequential ID|
| `update-event` on migrated event by owner| `(ok true)`             |
| `update-event` on migrated event by non-owner| `(err u403)`        |

---

## Timing Considerations

- **Migration window**: The v2 contract is paused during import,
  blocking new registrations. Plan the migration during low-traffic
  periods.
- **Transaction costs**: Each `migrate-event` call is a separate
  on-chain transaction. Budget for gas costs proportional to the
  number of events.
- **Nonce sequencing**: Submit migration transactions with
  sequential nonces to avoid gaps or rejections.

---

## Failure Recovery

If migration fails partway through, refer to [ROLLBACK.md](ROLLBACK.md)
for recovery procedures. The v2 contract can be re-paused and
events can be re-imported to correct any issues since
`migrate-event` uses `map-set` (upsert semantics).
