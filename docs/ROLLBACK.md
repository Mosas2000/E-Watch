# Rollback Procedures

Recovery steps for partial or failed v1-to-v2 contract migration.

---

## When to Use This Guide

- Migration script failed mid-execution (partial event import)
- Data verification revealed mismatches after import
- Counter alignment produced incorrect starting ID
- Decision to abort migration and revert to v1

---

## Understanding Rollback Constraints

Clarity smart contracts are **immutable** once deployed. Neither
the v1 nor v2 contract can be deleted or modified on-chain. Rollback
in this context means:

1. Re-pausing v2 to prevent usage
2. Correcting imported data or re-importing from scratch
3. Pointing the frontend back to v1 if migration is abandoned

---

## Scenario 1: Partial Import (Some Events Missing)

### Symptoms

- `get-event-count` on v2 is lower than v1
- Some `get-event(id)` calls return `none` on v2

### Recovery

1. Pause v2 if not already paused:

   ```clarity
   (contract-call? .ewatch-v2 pause-contract)
   ```

2. Identify missing event IDs by comparing v1 snapshot against v2.

3. Re-run `migrate-event` for each missing ID. The function uses
   `map-set`, so existing entries are safely overwritten.

4. Re-align the counter:

   ```clarity
   (contract-call? .ewatch-v2 set-event-counter u<correct-count>)
   ```

5. Re-verify all events and unpause.

---

## Scenario 2: Data Mismatch After Import

### Symptoms

- Field values on v2 do not match v1 snapshot
- Ownership, type, or data strings differ

### Recovery

1. Identify mismatched event IDs.

2. Re-import the correct data using `migrate-event` with the
   accurate field values. Since `migrate-event` calls `map-set`,
   it overwrites the existing record completely.

3. There is no need to delete the incorrect record first.

4. Verify the corrected record:

   ```clarity
   (contract-call? .ewatch-v2 get-event u<event-id>)
   ```

---

## Scenario 3: Counter Misalignment

### Symptoms

- New registrations on v2 produce IDs that collide with
  existing events
- Gap between last migrated ID and first new registration

### Recovery

1. Pause v2:

   ```clarity
   (contract-call? .ewatch-v2 pause-contract)
   ```

2. Determine the correct counter value. It should equal the
   total number of events from v1 (not the highest ID, which
   may differ if IDs were sparse).

3. Set the correct counter:

   ```clarity
   (contract-call? .ewatch-v2 set-event-counter u<correct-value>)
   ```

4. If any events were registered with incorrect IDs during the
   misalignment window, those records already exist on-chain.
   They cannot be deleted but can be deactivated by the admin
   if needed (admin would need to be the owner, or the contract
   would need a future admin-deactivate function).

5. Unpause after verification.

---

## Scenario 4: Full Abort (Revert to v1)

### Steps

1. Pause v2 permanently:

   ```clarity
   (contract-call? .ewatch-v2 pause-contract)
   ```

2. Update the frontend configuration to point back to the v1
   contract address and name.

3. v1 continues to operate normally since it was never modified.

4. Document the v2 contract address as deprecated.

### Considerations

- The v2 contract and any imported data remain on-chain permanently.
- Gas spent on migration transactions is non-recoverable.
- Users who registered events on v2 during any unpaused window
  will have those events stranded on the deprecated contract.

---

## Scenario 5: Admin Key Compromise

If the deployer key is compromised during migration:

1. Immediately transfer admin to a secure principal:

   ```clarity
   (contract-call? .ewatch-v2 set-admin '<secure-principal>)
   ```

2. Pause the contract from the new admin.

3. Assess whether any unauthorized `migrate-event` calls were
   made. If data was corrupted, follow Scenario 2 to overwrite
   incorrect records.

4. Consider deploying a v3 contract with the secure principal as
   deployer if the v2 admin role is fully compromised.

---

## Prevention Checklist

| Practice                              | Purpose                    |
|---------------------------------------|----------------------------|
| Snapshot v1 state before starting     | Baseline for verification  |
| Pause v2 before any imports           | Prevent concurrent writes  |
| Import events in sequential batches   | Easier to track progress   |
| Verify after each batch               | Catch issues early         |
| Set counter explicitly after import   | Avoid auto-increment drift |
| Test full workflow on testnet first    | Identify issues safely     |
| Keep deployer key secure              | Prevent admin takeover     |

---

## Related Documentation

- [MIGRATION.md](MIGRATION.md) - Standard migration procedure
- [ewatch-v2.clar](../contracts/ewatch-v2.clar) - v2 contract source
