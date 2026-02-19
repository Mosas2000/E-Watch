import { describe, it, expect, beforeEach } from "vitest";

/**
 * E-Watch v2 Contract Unit Tests
 *
 * Validates all new functionality added in the v2 contract upgrade:
 *   - Admin management and role transfer
 *   - Contract pause and unpause mechanics
 *   - Migration functions (migrate-event, set-event-counter)
 *   - Version tracking
 *   - Pause-gated write operations
 *   - Error code correctness for new failure modes
 */

// ── Simulated contract state for unit testing ─────────────

interface EventEntry {
  owner: string;
  "event-type": string;
  timestamp: number;
  data: string;
  active: boolean;
}

let events: Map<number, EventEntry>;
let eventCounter: number;
let contractVersion: number;
let contractPaused: boolean;
let admin: string;

const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const WALLET_1 = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const WALLET_2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";

beforeEach(() => {
  events = new Map();
  eventCounter = 0;
  contractVersion = 2;
  contractPaused = false;
  admin = DEPLOYER;
});

// ── Helpers ───────────────────────────────────────────────

function getVersion() {
  return { ok: contractVersion };
}

function isPaused() {
  return { ok: contractPaused };
}

function getAdmin() {
  return { ok: admin };
}

function setAdmin(caller: string, newAdmin: string) {
  if (caller !== admin) return { err: 403 };
  admin = newAdmin;
  return { ok: true };
}

function pauseContract(caller: string) {
  if (caller !== admin) return { err: 403 };
  contractPaused = true;
  return { ok: true };
}

function unpauseContract(caller: string) {
  if (caller !== admin) return { err: 403 };
  contractPaused = false;
  return { ok: true };
}

function migrateEvent(
  caller: string,
  eventId: number,
  owner: string,
  eventType: string,
  timestamp: number,
  data: string,
  active: boolean
) {
  if (caller !== admin) return { err: 403 };
  events.set(eventId, {
    owner,
    "event-type": eventType,
    timestamp,
    data,
    active,
  });
  if (eventId >= eventCounter) {
    eventCounter = eventId + 1;
  }
  return { ok: eventId };
}

function setEventCounter(caller: string, newCounter: number) {
  if (caller !== admin) return { err: 403 };
  eventCounter = newCounter;
  return { ok: true };
}

function registerEvent(caller: string, eventType: string, data: string) {
  if (contractPaused) return { err: 503 };
  const id = eventCounter;
  events.set(id, {
    owner: caller,
    "event-type": eventType,
    timestamp: 100,
    data,
    active: true,
  });
  eventCounter = id + 1;
  return { ok: id };
}

function getEvent(eventId: number): EventEntry | undefined {
  return events.get(eventId);
}

function getEventCount() {
  return { ok: eventCounter };
}

function updateEvent(caller: string, eventId: number, newData: string) {
  if (contractPaused) return { err: 503 };
  const ev = events.get(eventId);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  if (!ev.active) return { err: 410 };
  events.set(eventId, { ...ev, data: newData });
  return { ok: true };
}

function deactivateEvent(caller: string, eventId: number) {
  if (contractPaused) return { err: 503 };
  const ev = events.get(eventId);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  events.set(eventId, { ...ev, active: false });
  return { ok: true };
}

// ── Version tracking ──────────────────────────────────────

describe("ewatch-v2 :: version tracking", () => {
  it("reports version 2", () => {
    const result = getVersion();
    expect(result.ok).toBe(2);
  });

  it("version is a positive integer", () => {
    expect(getVersion().ok).toBeGreaterThan(0);
  });
});

// ── Admin management ──────────────────────────────────────

describe("ewatch-v2 :: admin management", () => {
  it("deployer is initial admin", () => {
    expect(getAdmin().ok).toBe(DEPLOYER);
  });

  it("admin can transfer ownership", () => {
    const result = setAdmin(DEPLOYER, WALLET_1);
    expect(result).toEqual({ ok: true });
    expect(getAdmin().ok).toBe(WALLET_1);
  });

  it("non-admin cannot transfer ownership", () => {
    const result = setAdmin(WALLET_1, WALLET_2);
    expect(result).toEqual({ err: 403 });
    expect(getAdmin().ok).toBe(DEPLOYER);
  });

  it("new admin can transfer again", () => {
    setAdmin(DEPLOYER, WALLET_1);
    const result = setAdmin(WALLET_1, WALLET_2);
    expect(result).toEqual({ ok: true });
    expect(getAdmin().ok).toBe(WALLET_2);
  });

  it("old admin loses authority after transfer", () => {
    setAdmin(DEPLOYER, WALLET_1);
    const result = setAdmin(DEPLOYER, WALLET_2);
    expect(result).toEqual({ err: 403 });
  });
});

// ── Pause / unpause ──────────────────────────────────────

describe("ewatch-v2 :: pause mechanism", () => {
  it("contract starts unpaused", () => {
    expect(isPaused().ok).toBe(false);
  });

  it("admin can pause", () => {
    const result = pauseContract(DEPLOYER);
    expect(result).toEqual({ ok: true });
    expect(isPaused().ok).toBe(true);
  });

  it("admin can unpause", () => {
    pauseContract(DEPLOYER);
    const result = unpauseContract(DEPLOYER);
    expect(result).toEqual({ ok: true });
    expect(isPaused().ok).toBe(false);
  });

  it("non-admin cannot pause", () => {
    const result = pauseContract(WALLET_1);
    expect(result).toEqual({ err: 403 });
    expect(isPaused().ok).toBe(false);
  });

  it("non-admin cannot unpause", () => {
    pauseContract(DEPLOYER);
    const result = unpauseContract(WALLET_1);
    expect(result).toEqual({ err: 403 });
    expect(isPaused().ok).toBe(true);
  });
});

// ── Pause-gated operations ───────────────────────────────

describe("ewatch-v2 :: pause-gated writes", () => {
  it("register-event blocked while paused", () => {
    pauseContract(DEPLOYER);
    const result = registerEvent(WALLET_1, "alert", "sensor-1");
    expect(result).toEqual({ err: 503 });
  });

  it("update-event blocked while paused", () => {
    registerEvent(WALLET_1, "alert", "initial");
    pauseContract(DEPLOYER);
    const result = updateEvent(WALLET_1, 0, "updated");
    expect(result).toEqual({ err: 503 });
  });

  it("deactivate-event blocked while paused", () => {
    registerEvent(WALLET_1, "alert", "data");
    pauseContract(DEPLOYER);
    const result = deactivateEvent(WALLET_1, 0);
    expect(result).toEqual({ err: 503 });
  });

  it("operations resume after unpause", () => {
    pauseContract(DEPLOYER);
    unpauseContract(DEPLOYER);
    const result = registerEvent(WALLET_1, "alert", "sensor-1");
    expect(result).toEqual({ ok: 0 });
  });

  it("pause does not affect read operations", () => {
    registerEvent(WALLET_1, "checkpoint", "data-1");
    pauseContract(DEPLOYER);
    const ev = getEvent(0);
    expect(ev).toBeDefined();
    expect(ev!["event-type"]).toBe("checkpoint");
    const count = getEventCount();
    expect(count.ok).toBe(1);
  });
});

// ── Migration: migrate-event ─────────────────────────────

describe("ewatch-v2 :: migrate-event", () => {
  it("admin can import a v1 event", () => {
    const result = migrateEvent(
      DEPLOYER,
      0,
      WALLET_1,
      "fire",
      50000,
      "building-A",
      true
    );
    expect(result).toEqual({ ok: 0 });
    const ev = getEvent(0);
    expect(ev).toBeDefined();
    expect(ev!.owner).toBe(WALLET_1);
    expect(ev!["event-type"]).toBe("fire");
    expect(ev!.timestamp).toBe(50000);
    expect(ev!.data).toBe("building-A");
    expect(ev!.active).toBe(true);
  });

  it("non-admin cannot import events", () => {
    const result = migrateEvent(
      WALLET_1,
      0,
      WALLET_1,
      "fire",
      50000,
      "building-A",
      true
    );
    expect(result).toEqual({ err: 403 });
    expect(getEvent(0)).toBeUndefined();
  });

  it("migration preserves inactive status", () => {
    migrateEvent(DEPLOYER, 5, WALLET_2, "flood", 40000, "zone-3", false);
    const ev = getEvent(5);
    expect(ev!.active).toBe(false);
  });

  it("counter advances past highest migrated ID", () => {
    migrateEvent(DEPLOYER, 0, WALLET_1, "a", 100, "d1", true);
    migrateEvent(DEPLOYER, 4, WALLET_1, "b", 200, "d2", true);
    migrateEvent(DEPLOYER, 2, WALLET_1, "c", 300, "d3", true);
    expect(getEventCount().ok).toBe(5);
  });

  it("multiple events can be migrated sequentially", () => {
    for (let i = 0; i < 5; i++) {
      migrateEvent(DEPLOYER, i, WALLET_1, `type-${i}`, 1000 + i, `data-${i}`, true);
    }
    expect(getEventCount().ok).toBe(5);
    for (let i = 0; i < 5; i++) {
      const ev = getEvent(i);
      expect(ev).toBeDefined();
      expect(ev!["event-type"]).toBe(`type-${i}`);
    }
  });

  it("migrated event can be overwritten by another migration", () => {
    migrateEvent(DEPLOYER, 0, WALLET_1, "v1-type", 100, "old", true);
    migrateEvent(DEPLOYER, 0, WALLET_2, "v1-type-corrected", 100, "corrected", true);
    const ev = getEvent(0);
    expect(ev!.owner).toBe(WALLET_2);
    expect(ev!.data).toBe("corrected");
  });
});

// ── Migration: set-event-counter ─────────────────────────

describe("ewatch-v2 :: set-event-counter", () => {
  it("admin can set counter to specific value", () => {
    const result = setEventCounter(DEPLOYER, 100);
    expect(result).toEqual({ ok: true });
    expect(getEventCount().ok).toBe(100);
  });

  it("non-admin cannot set counter", () => {
    const result = setEventCounter(WALLET_1, 100);
    expect(result).toEqual({ err: 403 });
    expect(getEventCount().ok).toBe(0);
  });

  it("new registrations use the updated counter", () => {
    setEventCounter(DEPLOYER, 50);
    const result = registerEvent(WALLET_1, "alert", "test-data");
    expect(result).toEqual({ ok: 50 });
    expect(getEventCount().ok).toBe(51);
  });

  it("counter can be reset to zero", () => {
    setEventCounter(DEPLOYER, 100);
    setEventCounter(DEPLOYER, 0);
    expect(getEventCount().ok).toBe(0);
  });
});

// ── New error codes ──────────────────────────────────────

describe("ewatch-v2 :: error codes", () => {
  it("ERR-PAUSED uses status 503", () => {
    pauseContract(DEPLOYER);
    const result = registerEvent(WALLET_1, "test", "data");
    expect(result).toEqual({ err: 503 });
  });

  it("ERR-UNAUTHORIZED uses status 403", () => {
    const result = pauseContract(WALLET_1);
    expect(result).toEqual({ err: 403 });
  });

  it("ERR-NOT-FOUND uses status 404", () => {
    const result = updateEvent(WALLET_1, 999, "data");
    expect(result).toEqual({ err: 404 });
  });

  it("ERR-INACTIVE uses status 410", () => {
    registerEvent(WALLET_1, "alert", "data");
    deactivateEvent(WALLET_1, 0);
    const result = updateEvent(WALLET_1, 0, "new-data");
    expect(result).toEqual({ err: 410 });
  });
});

// ── Post-migration registrations ─────────────────────────

describe("ewatch-v2 :: post-migration registration", () => {
  it("registration works after migration completes", () => {
    migrateEvent(DEPLOYER, 0, WALLET_1, "old", 100, "legacy", true);
    migrateEvent(DEPLOYER, 1, WALLET_1, "old", 101, "legacy", true);
    setEventCounter(DEPLOYER, 2);
    const result = registerEvent(WALLET_2, "new-event", "fresh-data");
    expect(result).toEqual({ ok: 2 });
    const ev = getEvent(2);
    expect(ev!.owner).toBe(WALLET_2);
    expect(ev!["event-type"]).toBe("new-event");
  });

  it("migrated events remain readable after new registrations", () => {
    migrateEvent(DEPLOYER, 0, WALLET_1, "migrated", 500, "old-data", true);
    registerEvent(WALLET_2, "fresh", "new-data");
    const migrated = getEvent(0);
    const fresh = getEvent(1);
    expect(migrated!["event-type"]).toBe("migrated");
    expect(fresh!["event-type"]).toBe("fresh");
  });

  it("update and deactivate work on migrated events", () => {
    migrateEvent(DEPLOYER, 0, WALLET_1, "alert", 100, "original", true);
    const updateResult = updateEvent(WALLET_1, 0, "modified");
    expect(updateResult).toEqual({ ok: true });
    expect(getEvent(0)!.data).toBe("modified");
    const deactivateResult = deactivateEvent(WALLET_1, 0);
    expect(deactivateResult).toEqual({ ok: true });
    expect(getEvent(0)!.active).toBe(false);
  });
});
