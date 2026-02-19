import { describe, it, expect, beforeEach } from "vitest";

/**
 * Migration Scenario Tests
 *
 * End-to-end validation of the v1 -> v2 migration workflow.
 * Covers the full lifecycle: pre-migration state capture,
 * pause, data transfer, counter alignment, verification,
 * unpause, and post-migration normal operations.
 */

// ── Simulated v1 state ───────────────────────────────────

interface EventEntry {
  owner: string;
  "event-type": string;
  timestamp: number;
  data: string;
  active: boolean;
}

let v1Events: Map<number, EventEntry>;
let v1Counter: number;

let v2Events: Map<number, EventEntry>;
let v2Counter: number;
let v2Paused: boolean;
let v2Admin: string;

const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const WALLET_1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const WALLET_2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const WALLET_3 = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

// ── v1 contract simulation ───────────────────────────────

function v1RegisterEvent(caller: string, eventType: string, data: string) {
  const id = v1Counter;
  v1Events.set(id, {
    owner: caller,
    "event-type": eventType,
    timestamp: 50000 + id,
    data,
    active: true,
  });
  v1Counter = id + 1;
  return { ok: id };
}

function v1DeactivateEvent(caller: string, eventId: number) {
  const ev = v1Events.get(eventId);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  v1Events.set(eventId, { ...ev, active: false });
  return { ok: true };
}

// ── v2 contract simulation ───────────────────────────────

function v2PauseContract(caller: string) {
  if (caller !== v2Admin) return { err: 403 };
  v2Paused = true;
  return { ok: true };
}

function v2UnpauseContract(caller: string) {
  if (caller !== v2Admin) return { err: 403 };
  v2Paused = false;
  return { ok: true };
}

function v2MigrateEvent(
  caller: string,
  eventId: number,
  owner: string,
  eventType: string,
  timestamp: number,
  data: string,
  active: boolean
) {
  if (caller !== v2Admin) return { err: 403 };
  v2Events.set(eventId, {
    owner,
    "event-type": eventType,
    timestamp,
    data,
    active,
  });
  if (eventId >= v2Counter) {
    v2Counter = eventId + 1;
  }
  return { ok: eventId };
}

function v2SetEventCounter(caller: string, counter: number) {
  if (caller !== v2Admin) return { err: 403 };
  v2Counter = counter;
  return { ok: true };
}

function v2RegisterEvent(caller: string, eventType: string, data: string) {
  if (v2Paused) return { err: 503 };
  const id = v2Counter;
  v2Events.set(id, {
    owner: caller,
    "event-type": eventType,
    timestamp: 60000 + id,
    data,
    active: true,
  });
  v2Counter = id + 1;
  return { ok: id };
}

function v2GetEvent(eventId: number) {
  return v2Events.get(eventId);
}

function v2GetEventCount() {
  return { ok: v2Counter };
}

function v2UpdateEvent(caller: string, eventId: number, newData: string) {
  if (v2Paused) return { err: 503 };
  const ev = v2Events.get(eventId);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  if (!ev.active) return { err: 410 };
  v2Events.set(eventId, { ...ev, data: newData });
  return { ok: true };
}

// ── Setup ────────────────────────────────────────────────

beforeEach(() => {
  v1Events = new Map();
  v1Counter = 0;
  v2Events = new Map();
  v2Counter = 0;
  v2Paused = false;
  v2Admin = DEPLOYER;
});

// ── Helper: seed v1 with realistic data ──────────────────

function seedV1Data() {
  v1RegisterEvent(WALLET_1, "fire-alarm", "sector-4-building-B");
  v1RegisterEvent(WALLET_2, "intrusion", "gate-7-perimeter");
  v1RegisterEvent(WALLET_1, "equipment-failure", "pump-station-12");
  v1RegisterEvent(WALLET_3, "weather-alert", "wind-speed-exceeds-threshold");
  v1RegisterEvent(WALLET_2, "maintenance", "quarterly-inspection-hvac");
  v1DeactivateEvent(WALLET_2, 1); // deactivate intrusion event
}

// ── Migration: pre-migration snapshot ────────────────────

describe("migration :: pre-migration state capture", () => {
  it("records v1 event count before migration", () => {
    seedV1Data();
    expect(v1Counter).toBe(5);
  });

  it("captures all event data including inactive entries", () => {
    seedV1Data();
    const activeCount = Array.from(v1Events.values()).filter((e) => e.active).length;
    const inactiveCount = Array.from(v1Events.values()).filter((e) => !e.active).length;
    expect(activeCount).toBe(4);
    expect(inactiveCount).toBe(1);
  });

  it("preserves ownership across all events", () => {
    seedV1Data();
    expect(v1Events.get(0)!.owner).toBe(WALLET_1);
    expect(v1Events.get(1)!.owner).toBe(WALLET_2);
    expect(v1Events.get(3)!.owner).toBe(WALLET_3);
  });
});

// ── Migration: pause-then-transfer flow ──────────────────

describe("migration :: pause and transfer", () => {
  it("pauses v2 before data import begins", () => {
    v2PauseContract(DEPLOYER);
    expect(v2Paused).toBe(true);
  });

  it("blocks registrations during migration window", () => {
    v2PauseContract(DEPLOYER);
    const result = v2RegisterEvent(WALLET_1, "alert", "data");
    expect(result).toEqual({ err: 503 });
  });

  it("transfers all v1 events to v2 while paused", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);

    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(
        DEPLOYER,
        id,
        ev.owner,
        ev["event-type"],
        ev.timestamp,
        ev.data,
        ev.active
      );
    }

    expect(v2GetEventCount().ok).toBe(v1Counter);
  });

  it("preserves event data field-by-field after transfer", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);

    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(DEPLOYER, id, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    }

    for (const [id, v1Ev] of v1Events.entries()) {
      const v2Ev = v2GetEvent(id);
      expect(v2Ev).toBeDefined();
      expect(v2Ev!.owner).toBe(v1Ev.owner);
      expect(v2Ev!["event-type"]).toBe(v1Ev["event-type"]);
      expect(v2Ev!.timestamp).toBe(v1Ev.timestamp);
      expect(v2Ev!.data).toBe(v1Ev.data);
      expect(v2Ev!.active).toBe(v1Ev.active);
    }
  });
});

// ── Migration: counter alignment ─────────────────────────

describe("migration :: counter alignment", () => {
  it("counter matches v1 total after sequential migration", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);
    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(DEPLOYER, id, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    }
    expect(v2GetEventCount().ok).toBe(5);
  });

  it("explicit counter set overrides auto-increment", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);
    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(DEPLOYER, id, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    }
    v2SetEventCounter(DEPLOYER, 100);
    expect(v2GetEventCount().ok).toBe(100);
  });

  it("out-of-order migration still yields correct counter", () => {
    v2PauseContract(DEPLOYER);
    v2MigrateEvent(DEPLOYER, 3, WALLET_1, "a", 100, "d", true);
    v2MigrateEvent(DEPLOYER, 0, WALLET_1, "b", 100, "d", true);
    v2MigrateEvent(DEPLOYER, 7, WALLET_1, "c", 100, "d", true);
    v2MigrateEvent(DEPLOYER, 2, WALLET_1, "d", 100, "d", true);
    expect(v2GetEventCount().ok).toBe(8);
  });
});

// ── Migration: unpause and resume ────────────────────────

describe("migration :: unpause and resume operations", () => {
  it("new events start from migrated counter", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);
    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(DEPLOYER, id, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    }
    v2UnpauseContract(DEPLOYER);
    const result = v2RegisterEvent(WALLET_1, "new-alert", "post-migration");
    expect(result).toEqual({ ok: 5 });
  });

  it("migrated events are editable by original owners", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);
    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(DEPLOYER, id, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    }
    v2UnpauseContract(DEPLOYER);
    const result = v2UpdateEvent(WALLET_1, 0, "updated-after-migration");
    expect(result).toEqual({ ok: true });
    expect(v2GetEvent(0)!.data).toBe("updated-after-migration");
  });

  it("migrated inactive events remain non-editable", () => {
    seedV1Data();
    v2PauseContract(DEPLOYER);
    for (const [id, ev] of v1Events.entries()) {
      v2MigrateEvent(DEPLOYER, id, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    }
    v2UnpauseContract(DEPLOYER);
    const result = v2UpdateEvent(WALLET_2, 1, "try-update-inactive");
    expect(result).toEqual({ err: 410 });
  });

  it("full workflow: seed, pause, migrate, align, unpause, register", () => {
    // 1. Seed v1 state
    seedV1Data();
    expect(v1Counter).toBe(5);

    // 2. Pause v2
    v2PauseContract(DEPLOYER);
    expect(v2Paused).toBe(true);

    // 3. Transfer each event
    for (const [id, ev] of v1Events.entries()) {
      const result = v2MigrateEvent(
        DEPLOYER, id, ev.owner, ev["event-type"],
        ev.timestamp, ev.data, ev.active
      );
      expect(result.ok).toBe(id);
    }

    // 4. Align counter
    v2SetEventCounter(DEPLOYER, v1Counter);
    expect(v2GetEventCount().ok).toBe(5);

    // 5. Verify data integrity
    for (const [id, v1Ev] of v1Events.entries()) {
      const v2Ev = v2GetEvent(id);
      expect(v2Ev!.owner).toBe(v1Ev.owner);
      expect(v2Ev!["event-type"]).toBe(v1Ev["event-type"]);
    }

    // 6. Unpause
    v2UnpauseContract(DEPLOYER);
    expect(v2Paused).toBe(false);

    // 7. Register a new event
    const reg = v2RegisterEvent(WALLET_3, "post-migration", "system-normal");
    expect(reg).toEqual({ ok: 5 });
    expect(v2GetEventCount().ok).toBe(6);
  });
});

// ── Migration: edge cases ────────────────────────────────

describe("migration :: edge cases", () => {
  it("empty v1 contract migration produces zero events", () => {
    v2PauseContract(DEPLOYER);
    v2SetEventCounter(DEPLOYER, 0);
    v2UnpauseContract(DEPLOYER);
    expect(v2GetEventCount().ok).toBe(0);
    expect(v2GetEvent(0)).toBeUndefined();
  });

  it("single event migration works correctly", () => {
    v1RegisterEvent(WALLET_1, "solo", "only-event");
    v2PauseContract(DEPLOYER);
    const ev = v1Events.get(0)!;
    v2MigrateEvent(DEPLOYER, 0, ev.owner, ev["event-type"], ev.timestamp, ev.data, ev.active);
    v2SetEventCounter(DEPLOYER, 1);
    v2UnpauseContract(DEPLOYER);
    expect(v2GetEvent(0)!.data).toBe("only-event");
    expect(v2GetEventCount().ok).toBe(1);
  });

  it("large batch migration preserves all entries", () => {
    v2PauseContract(DEPLOYER);
    const batchSize = 50;
    for (let i = 0; i < batchSize; i++) {
      v2MigrateEvent(DEPLOYER, i, WALLET_1, `type-${i}`, 10000 + i, `data-${i}`, true);
    }
    v2SetEventCounter(DEPLOYER, batchSize);
    expect(v2GetEventCount().ok).toBe(batchSize);
    for (let i = 0; i < batchSize; i++) {
      expect(v2GetEvent(i)).toBeDefined();
      expect(v2GetEvent(i)!["event-type"]).toBe(`type-${i}`);
    }
  });

  it("migration with gaps in event IDs still works", () => {
    v2PauseContract(DEPLOYER);
    v2MigrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d0", true);
    v2MigrateEvent(DEPLOYER, 5, WALLET_1, "b", 100, "d5", true);
    v2MigrateEvent(DEPLOYER, 10, WALLET_1, "c", 100, "d10", true);

    expect(v2GetEvent(0)).toBeDefined();
    expect(v2GetEvent(1)).toBeUndefined();
    expect(v2GetEvent(5)).toBeDefined();
    expect(v2GetEvent(10)).toBeDefined();
    expect(v2GetEventCount().ok).toBe(11);
  });
});
