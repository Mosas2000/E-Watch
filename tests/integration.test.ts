import { describe, it, expect, beforeEach } from "vitest";

/**
 * Integration Tests
 *
 * Validates cross-function contract behavior where multiple
 * operations interact. Each test exercises a realistic user
 * workflow rather than isolated function calls.
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
const ALICE = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const BOB = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const CAROL = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

beforeEach(() => {
  events = new Map();
  counter = 0;
  paused = false;
  admin = DEPLOYER;
});

function registerEvent(caller: string, eventType: string, data: string) {
  if (paused) return { err: 503 };
  const id = counter;
  events.set(id, {
    owner: caller,
    "event-type": eventType,
    timestamp: 100 + id,
    data,
    active: true,
  });
  counter = id + 1;
  return { ok: id };
}

function getEvent(id: number) {
  return events.get(id);
}

function updateEvent(caller: string, id: number, newData: string) {
  if (paused) return { err: 503 };
  const ev = events.get(id);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  if (!ev.active) return { err: 410 };
  events.set(id, { ...ev, data: newData });
  return { ok: true };
}

function deactivateEvent(caller: string, id: number) {
  if (paused) return { err: 503 };
  const ev = events.get(id);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  events.set(id, { ...ev, active: false });
  return { ok: true };
}

function pauseContract(caller: string) {
  if (caller !== admin) return { err: 403 };
  paused = true;
  return { ok: true };
}

function unpauseContract(caller: string) {
  if (caller !== admin) return { err: 403 };
  paused = false;
  return { ok: true };
}

// ── Full registration and query flow ─────────────────────

describe("integration :: registration and query flow", () => {
  it("register then immediately retrieve returns matching data", () => {
    const reg = registerEvent(ALICE, "temperature", "sensor-42-high");
    expect(reg).toEqual({ ok: 0 });
    const ev = getEvent(0);
    expect(ev).toBeDefined();
    expect(ev!.owner).toBe(ALICE);
    expect(ev!["event-type"]).toBe("temperature");
    expect(ev!.data).toBe("sensor-42-high");
    expect(ev!.active).toBe(true);
  });

  it("register, update, then retrieve shows updated data", () => {
    registerEvent(ALICE, "pressure", "valve-3-normal");
    updateEvent(ALICE, 0, "valve-3-critical");
    const ev = getEvent(0);
    expect(ev!.data).toBe("valve-3-critical");
    expect(ev!["event-type"]).toBe("pressure");
  });

  it("register, deactivate, then confirm inactive status", () => {
    registerEvent(ALICE, "maintenance", "scheduled-check");
    deactivateEvent(ALICE, 0);
    const ev = getEvent(0);
    expect(ev!.active).toBe(false);
    expect(ev!.data).toBe("scheduled-check");
  });

  it("register, update, deactivate yields final consistent state", () => {
    registerEvent(BOB, "alert", "initial-reading");
    updateEvent(BOB, 0, "corrected-reading");
    deactivateEvent(BOB, 0);
    const ev = getEvent(0);
    expect(ev!.data).toBe("corrected-reading");
    expect(ev!.active).toBe(false);
    expect(ev!.owner).toBe(BOB);
  });
});

// ── Concurrent registrations ─────────────────────────────

describe("integration :: concurrent registrations", () => {
  it("three users register sequentially and get unique IDs", () => {
    const r1 = registerEvent(ALICE, "fire", "zone-1");
    const r2 = registerEvent(BOB, "flood", "zone-2");
    const r3 = registerEvent(CAROL, "gas-leak", "zone-3");
    expect(r1).toEqual({ ok: 0 });
    expect(r2).toEqual({ ok: 1 });
    expect(r3).toEqual({ ok: 2 });
  });

  it("each registration preserves its own owner", () => {
    registerEvent(ALICE, "fire", "z1");
    registerEvent(BOB, "flood", "z2");
    registerEvent(CAROL, "gas-leak", "z3");
    expect(getEvent(0)!.owner).toBe(ALICE);
    expect(getEvent(1)!.owner).toBe(BOB);
    expect(getEvent(2)!.owner).toBe(CAROL);
  });

  it("counter reflects total after multiple registrations", () => {
    registerEvent(ALICE, "a", "d");
    registerEvent(BOB, "b", "d");
    registerEvent(CAROL, "c", "d");
    registerEvent(ALICE, "d", "d");
    registerEvent(BOB, "e", "d");
    expect(counter).toBe(5);
  });

  it("same user can register multiple events", () => {
    registerEvent(ALICE, "alert-1", "data-1");
    registerEvent(ALICE, "alert-2", "data-2");
    registerEvent(ALICE, "alert-3", "data-3");
    expect(getEvent(0)!["event-type"]).toBe("alert-1");
    expect(getEvent(1)!["event-type"]).toBe("alert-2");
    expect(getEvent(2)!["event-type"]).toBe("alert-3");
  });
});

// ── Access control enforcement ───────────────────────────

describe("integration :: access control enforcement", () => {
  it("owner can update own event but not another user's", () => {
    registerEvent(ALICE, "sensor", "temp-high");
    registerEvent(BOB, "sensor", "humidity-low");

    expect(updateEvent(ALICE, 0, "temp-normal")).toEqual({ ok: true });
    expect(updateEvent(ALICE, 1, "hijacked")).toEqual({ err: 403 });
    expect(getEvent(1)!.data).toBe("humidity-low");
  });

  it("owner can deactivate own event but not another user's", () => {
    registerEvent(ALICE, "alarm", "building-A");
    registerEvent(BOB, "alarm", "building-B");

    expect(deactivateEvent(ALICE, 0)).toEqual({ ok: true });
    expect(deactivateEvent(ALICE, 1)).toEqual({ err: 403 });
    expect(getEvent(1)!.active).toBe(true);
  });

  it("deactivated event cannot be updated even by owner", () => {
    registerEvent(ALICE, "alert", "initial");
    deactivateEvent(ALICE, 0);
    const result = updateEvent(ALICE, 0, "try-update");
    expect(result).toEqual({ err: 410 });
    expect(getEvent(0)!.data).toBe("initial");
  });

  it("admin pause blocks all user operations uniformly", () => {
    registerEvent(ALICE, "alert", "data-1");
    registerEvent(BOB, "alert", "data-2");
    pauseContract(DEPLOYER);

    expect(registerEvent(CAROL, "new", "d")).toEqual({ err: 503 });
    expect(updateEvent(ALICE, 0, "new")).toEqual({ err: 503 });
    expect(deactivateEvent(BOB, 1)).toEqual({ err: 503 });
  });

  it("non-admin cannot pause or unpause", () => {
    expect(pauseContract(ALICE)).toEqual({ err: 403 });
    pauseContract(DEPLOYER);
    expect(unpauseContract(BOB)).toEqual({ err: 403 });
  });
});

// ── Event deactivation lifecycle ─────────────────────────

describe("integration :: event deactivation lifecycle", () => {
  it("deactivation preserves all fields except active flag", () => {
    registerEvent(ALICE, "equipment-failure", "pump-7-offline");
    deactivateEvent(ALICE, 0);
    const ev = getEvent(0)!;
    expect(ev.owner).toBe(ALICE);
    expect(ev["event-type"]).toBe("equipment-failure");
    expect(ev.data).toBe("pump-7-offline");
    expect(ev.active).toBe(false);
  });

  it("deactivation of one event does not affect others", () => {
    registerEvent(ALICE, "fire", "zone-1");
    registerEvent(ALICE, "flood", "zone-2");
    registerEvent(ALICE, "gas", "zone-3");
    deactivateEvent(ALICE, 1);

    expect(getEvent(0)!.active).toBe(true);
    expect(getEvent(1)!.active).toBe(false);
    expect(getEvent(2)!.active).toBe(true);
  });

  it("cannot deactivate a nonexistent event", () => {
    const result = deactivateEvent(ALICE, 99);
    expect(result).toEqual({ err: 404 });
  });

  it("pause, unpause, then deactivate succeeds", () => {
    registerEvent(ALICE, "alert", "data");
    pauseContract(DEPLOYER);
    expect(deactivateEvent(ALICE, 0)).toEqual({ err: 503 });
    unpauseContract(DEPLOYER);
    expect(deactivateEvent(ALICE, 0)).toEqual({ ok: true });
  });
});
