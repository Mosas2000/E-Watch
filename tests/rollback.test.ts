import { describe, it, expect, beforeEach } from "vitest";

/**
 * Rollback Scenario Tests
 *
 * Validates recovery procedures described in docs/ROLLBACK.md.
 * Each test group simulates a migration failure mode and
 * confirms the rollback path restores a usable state.
 */

interface EventEntry {
  owner: string;
  "event-type": string;
  timestamp: number;
  data: string;
  active: boolean;
}

let events: Map<number, EventEntry>;
let counter: number;
let paused: boolean;
let admin: string;

const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const WALLET_1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";

beforeEach(() => {
  events = new Map();
  counter = 0;
  paused = false;
  admin = DEPLOYER;
});

function migrateEvent(
  caller: string, id: number, owner: string,
  eventType: string, ts: number, data: string, active: boolean
) {
  if (caller !== admin) return { err: 403 };
  events.set(id, { owner, "event-type": eventType, timestamp: ts, data, active });
  if (id >= counter) counter = id + 1;
  return { ok: id };
}

function setCounter(caller: string, val: number) {
  if (caller !== admin) return { err: 403 };
  counter = val;
  return { ok: true };
}

function pause(caller: string) {
  if (caller !== admin) return { err: 403 };
  paused = true;
  return { ok: true };
}

function unpause(caller: string) {
  if (caller !== admin) return { err: 403 };
  paused = false;
  return { ok: true };
}

function register(caller: string, eventType: string, data: string) {
  if (paused) return { err: 503 };
  const id = counter;
  events.set(id, { owner: caller, "event-type": eventType, timestamp: 100, data, active: true });
  counter = id + 1;
  return { ok: id };
}

function getEvent(id: number) { return events.get(id); }
function getCount() { return { ok: counter }; }

// ── Scenario 1: Partial import recovery ──────────────────

describe("rollback :: partial import recovery", () => {
  it("re-importing missing events fills gaps", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d0", true);
    migrateEvent(DEPLOYER, 2, WALLET_1, "c", 100, "d2", true);
    // event 1 was missed
    expect(getEvent(1)).toBeUndefined();

    // re-run for event 1
    migrateEvent(DEPLOYER, 1, WALLET_1, "b", 100, "d1", true);
    expect(getEvent(1)).toBeDefined();
    expect(getEvent(1)!["event-type"]).toBe("b");
  });

  it("counter remains correct after gap fill", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d0", true);
    migrateEvent(DEPLOYER, 4, WALLET_1, "e", 100, "d4", true);
    expect(getCount().ok).toBe(5);

    migrateEvent(DEPLOYER, 1, WALLET_1, "b", 100, "d1", true);
    migrateEvent(DEPLOYER, 2, WALLET_1, "c", 100, "d2", true);
    migrateEvent(DEPLOYER, 3, WALLET_1, "d", 100, "d3", true);
    // counter still 5 since highest ID was already 4
    expect(getCount().ok).toBe(5);
  });
});

// ── Scenario 2: Data correction via re-import ────────────

describe("rollback :: data correction", () => {
  it("overwrite incorrect data with correct values", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "wrong-type", 100, "wrong-data", false);

    // correct it
    migrateEvent(DEPLOYER, 0, WALLET_1, "correct-type", 200, "correct-data", true);
    const ev = getEvent(0)!;
    expect(ev["event-type"]).toBe("correct-type");
    expect(ev.timestamp).toBe(200);
    expect(ev.data).toBe("correct-data");
    expect(ev.active).toBe(true);
  });

  it("correction does not affect other events", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d0", true);
    migrateEvent(DEPLOYER, 1, WALLET_1, "b", 100, "d1", true);

    migrateEvent(DEPLOYER, 0, WALLET_1, "a-fixed", 100, "d0-fixed", true);
    expect(getEvent(1)!["event-type"]).toBe("b");
    expect(getEvent(1)!.data).toBe("d1");
  });
});

// ── Scenario 3: Counter misalignment fix ─────────────────

describe("rollback :: counter misalignment", () => {
  it("explicit counter set corrects drift", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d", true);
    // counter auto-advanced to 1, but we need 10
    expect(getCount().ok).toBe(1);
    setCounter(DEPLOYER, 10);
    expect(getCount().ok).toBe(10);
  });

  it("registrations use corrected counter", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d", true);
    setCounter(DEPLOYER, 10);
    unpause(DEPLOYER);
    const result = register(WALLET_1, "new", "data");
    expect(result).toEqual({ ok: 10 });
  });
});

// ── Scenario 4: Full abort ───────────────────────────────

describe("rollback :: full abort", () => {
  it("pausing permanently blocks all writes", () => {
    pause(DEPLOYER);
    // do not unpause
    expect(register(WALLET_1, "test", "data")).toEqual({ err: 503 });
  });

  it("imported data remains readable after permanent pause", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "alert", 100, "data-0", true);
    // contract stays paused
    expect(getEvent(0)).toBeDefined();
    expect(getEvent(0)!["event-type"]).toBe("alert");
  });

  it("re-pause after accidental unpause", () => {
    pause(DEPLOYER);
    unpause(DEPLOYER);
    // realize abort needed, re-pause
    pause(DEPLOYER);
    expect(register(WALLET_1, "test", "data")).toEqual({ err: 503 });
  });
});

// ── Scenario 5: Re-migration after abort ─────────────────

describe("rollback :: re-migration after abort", () => {
  it("existing data can be overwritten in fresh migration", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "old", 100, "stale", true);
    // abort, then re-migrate with fresh data
    migrateEvent(DEPLOYER, 0, WALLET_1, "fresh", 200, "current", true);
    expect(getEvent(0)!.data).toBe("current");
  });

  it("counter can be reset to zero for clean start", () => {
    pause(DEPLOYER);
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d", true);
    setCounter(DEPLOYER, 0);
    expect(getCount().ok).toBe(0);
  });
});
