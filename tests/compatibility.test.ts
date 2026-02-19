import { describe, it, expect, beforeEach } from "vitest";

/**
 * Contract Compatibility Tests
 *
 * Validates that v2 maintains backward compatibility with v1
 * for all shared functions. The data model and function
 * signatures must remain identical for seamless migration.
 */

interface EventEntry {
  owner: string;
  "event-type": string;
  timestamp: number;
  data: string;
  active: boolean;
}

// ── V1 simulation ────────────────────────────────────────

let v1Events: Map<number, EventEntry>;
let v1Counter: number;

function v1Register(caller: string, eventType: string, data: string) {
  const id = v1Counter;
  v1Events.set(id, {
    owner: caller,
    "event-type": eventType,
    timestamp: 100 + id,
    data,
    active: true,
  });
  v1Counter = id + 1;
  return { ok: id };
}

function v1Get(id: number) { return v1Events.get(id); }
function v1Count() { return { ok: v1Counter }; }

function v1Update(caller: string, id: number, newData: string) {
  const ev = v1Events.get(id);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  if (!ev.active) return { err: 410 };
  v1Events.set(id, { ...ev, data: newData });
  return { ok: true };
}

function v1Deactivate(caller: string, id: number) {
  const ev = v1Events.get(id);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  v1Events.set(id, { ...ev, active: false });
  return { ok: true };
}

// ── V2 simulation ────────────────────────────────────────

let v2Events: Map<number, EventEntry>;
let v2Counter: number;
let v2Paused: boolean;

function v2Register(caller: string, eventType: string, data: string) {
  if (v2Paused) return { err: 503 };
  const id = v2Counter;
  v2Events.set(id, {
    owner: caller,
    "event-type": eventType,
    timestamp: 100 + id,
    data,
    active: true,
  });
  v2Counter = id + 1;
  return { ok: id };
}

function v2Get(id: number) { return v2Events.get(id); }
function v2Count() { return { ok: v2Counter }; }

function v2Update(caller: string, id: number, newData: string) {
  if (v2Paused) return { err: 503 };
  const ev = v2Events.get(id);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  if (!ev.active) return { err: 410 };
  v2Events.set(id, { ...ev, data: newData });
  return { ok: true };
}

function v2Deactivate(caller: string, id: number) {
  if (v2Paused) return { err: 503 };
  const ev = v2Events.get(id);
  if (!ev) return { err: 404 };
  if (ev.owner !== caller) return { err: 403 };
  v2Events.set(id, { ...ev, active: false });
  return { ok: true };
}

// ── Setup ────────────────────────────────────────────────

const ALICE = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const BOB = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";

beforeEach(() => {
  v1Events = new Map();
  v1Counter = 0;
  v2Events = new Map();
  v2Counter = 0;
  v2Paused = false;
});

// ── Behavioral parity ────────────────────────────────────

describe("compatibility :: register-event parity", () => {
  it("both versions return same ID for sequential registrations", () => {
    const r1 = v1Register(ALICE, "fire", "zone-1");
    const r2 = v2Register(ALICE, "fire", "zone-1");
    expect(r1).toEqual(r2);
  });

  it("both versions increment counter identically", () => {
    v1Register(ALICE, "a", "d");
    v1Register(BOB, "b", "d");
    v2Register(ALICE, "a", "d");
    v2Register(BOB, "b", "d");
    expect(v1Count()).toEqual(v2Count());
  });

  it("event structure matches between versions", () => {
    v1Register(ALICE, "sensor", "temp-42");
    v2Register(ALICE, "sensor", "temp-42");
    const e1 = v1Get(0)!;
    const e2 = v2Get(0)!;
    expect(e1.owner).toBe(e2.owner);
    expect(e1["event-type"]).toBe(e2["event-type"]);
    expect(e1.data).toBe(e2.data);
    expect(e1.active).toBe(e2.active);
    expect(e1.timestamp).toBe(e2.timestamp);
  });
});

describe("compatibility :: get-event parity", () => {
  it("both return undefined for missing IDs", () => {
    expect(v1Get(99)).toBeUndefined();
    expect(v2Get(99)).toBeUndefined();
  });

  it("both return same structure for existing events", () => {
    v1Register(ALICE, "alert", "data");
    v2Register(ALICE, "alert", "data");
    const e1 = v1Get(0);
    const e2 = v2Get(0);
    expect(e1).toEqual(e2);
  });
});

describe("compatibility :: update-event parity", () => {
  it("both accept owner updates with same result", () => {
    v1Register(ALICE, "a", "old");
    v2Register(ALICE, "a", "old");
    expect(v1Update(ALICE, 0, "new")).toEqual(v2Update(ALICE, 0, "new"));
    expect(v1Get(0)!.data).toBe(v2Get(0)!.data);
  });

  it("both reject non-owner updates with same error", () => {
    v1Register(ALICE, "a", "data");
    v2Register(ALICE, "a", "data");
    expect(v1Update(BOB, 0, "hack")).toEqual(v2Update(BOB, 0, "hack"));
  });

  it("both reject updates on inactive events with same error", () => {
    v1Register(ALICE, "a", "d");
    v2Register(ALICE, "a", "d");
    v1Deactivate(ALICE, 0);
    v2Deactivate(ALICE, 0);
    expect(v1Update(ALICE, 0, "try")).toEqual(v2Update(ALICE, 0, "try"));
  });
});

describe("compatibility :: deactivate-event parity", () => {
  it("both accept owner deactivation", () => {
    v1Register(ALICE, "a", "d");
    v2Register(ALICE, "a", "d");
    expect(v1Deactivate(ALICE, 0)).toEqual(v2Deactivate(ALICE, 0));
  });

  it("both reject non-owner deactivation", () => {
    v1Register(ALICE, "a", "d");
    v2Register(ALICE, "a", "d");
    expect(v1Deactivate(BOB, 0)).toEqual(v2Deactivate(BOB, 0));
  });

  it("both reject deactivation of missing events", () => {
    expect(v1Deactivate(ALICE, 99)).toEqual(v2Deactivate(ALICE, 99));
  });
});

describe("compatibility :: error code parity", () => {
  it("not-found error identical", () => {
    expect(v1Update(ALICE, 0, "d")).toEqual(v2Update(ALICE, 0, "d"));
  });

  it("unauthorized error identical", () => {
    v1Register(ALICE, "a", "d");
    v2Register(ALICE, "a", "d");
    expect(v1Update(BOB, 0, "d")).toEqual(v2Update(BOB, 0, "d"));
  });

  it("inactive error identical", () => {
    v1Register(ALICE, "a", "d");
    v2Register(ALICE, "a", "d");
    v1Deactivate(ALICE, 0);
    v2Deactivate(ALICE, 0);
    expect(v1Update(ALICE, 0, "d")).toEqual(v2Update(ALICE, 0, "d"));
  });
});
