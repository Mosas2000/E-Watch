/**
 * Type definitions for contract service interactions.
 */

/** Data returned from a completed Stacks wallet transaction. */
export interface TransactionResult {
  txId: string;
  stacksTransaction?: unknown;
}

/** Parsed JSON representation of a Clarity value. */
export interface ClarityJsonValue {
  type: string;
  value: unknown;
}

/** Shape of a single event returned by the get-event read-only call. */
export interface EventReadResult {
  type: string;
  value: {
    'event-type': { type: string; value: string };
    data: { type: string; value: string };
    owner: { type: string; value: string };
    active: { type: string; value: boolean };
  } | null;
}

/** Shape of the event count response from get-event-count. */
export interface EventCountResult {
  type: string;
  value: {
    type: string;
    value: string;
  };
}
