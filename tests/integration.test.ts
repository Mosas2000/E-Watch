import { describe, it, expect, beforeEach } from "vitest";
import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl, cvToJSON } from "@stacks/transactions";

/**
 * Integration Tests
 *
 * Validates cross-function contract behavior where multiple
 * operations interact. Each test exercises a realistic user
 * workflow rather than isolated function calls.
 */

let simnet: any;
const DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const ALICE = "ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";
const BOB = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";
const CAROL = "ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC";

beforeEach(async () => {
  simnet = await initSimnet();
});

function registerEvent(caller: string, eventType: string, data: string) {
  return simnet.callPublicFn(
    "ewatch-v2",
    "register-event",
    [Cl.stringAscii(eventType), Cl.stringAscii(data)],
    caller
  );
}

function getEvent(id: number) {
  return simnet.callReadOnlyFn("ewatch-v2", "get-event", [Cl.uint(id)], DEPLOYER);
}

function updateEvent(caller: string, id: number, newData: string) {
  return simnet.callPublicFn(
    "ewatch-v2",
    "update-event",
    [Cl.uint(id), Cl.stringAscii(newData)],
    caller
  );
}

function deactivateEvent(caller: string, id: number) {
  return simnet.callPublicFn("ewatch-v2", "deactivate-event", [Cl.uint(id)], caller);
}

function pauseContract(caller: string) {
  return simnet.callPublicFn("ewatch-v2", "pause-contract", [], caller);
}

function unpauseContract(caller: string) {
  return simnet.callPublicFn("ewatch-v2", "unpause-contract", [], caller);
}

function getEventCount() {
  return simnet.callReadOnlyFn("ewatch-v2", "get-event-count", [], DEPLOYER);
}

// ── Full registration and query flow ─────────────────────

describe("integration :: registration and query flow", () => {
  it("register then immediately retrieve returns matching data", () => {
    const reg = registerEvent(ALICE, "temperature", "sensor-42-high");
    expect(cvToJSON(reg.result).value.value).toBe("0");

    const evResult = getEvent(0);
    const ev = cvToJSON(evResult.result).value.value;

    expect(ev.owner.value).toBe(ALICE);
    expect(ev["event-type"].value).toBe("temperature");
    expect(ev.data.value).toBe("sensor-42-high");
    expect(ev.active.value).toBe(true);
  });

  it("register, update, then retrieve shows updated data", () => {
    registerEvent(ALICE, "pressure", "valve-3-normal");
    const updateResult = updateEvent(ALICE, 0, "valve-3-critical");
    expect(cvToJSON(updateResult.result).value.value).toBe(true);

    const evResult = getEvent(0);
    const ev = cvToJSON(evResult.result).value.value;
    expect(ev.data.value).toBe("valve-3-critical");
    expect(ev["event-type"].value).toBe("pressure");
  });

  it("register, deactivate, then confirm inactive status", () => {
    registerEvent(ALICE, "maintenance", "scheduled-check");
    deactivateEvent(ALICE, 0);

    const evResult = getEvent(0);
    const ev = cvToJSON(evResult.result).value.value;
    expect(ev.active.value).toBe(false);
    expect(ev.data.value).toBe("scheduled-check");
  });

  it("register, update, deactivate yields final consistent state", () => {
    registerEvent(BOB, "alert", "initial-reading");
    updateEvent(BOB, 0, "corrected-reading");
    deactivateEvent(BOB, 0);

    const evResult = getEvent(0);
    const ev = cvToJSON(evResult.result).value.value;
    expect(ev.data.value).toBe("corrected-reading");
    expect(ev.active.value).toBe(false);
    expect(ev.owner.value).toBe(BOB);
  });
});

// ── Concurrent registrations ─────────────────────────────

describe("integration :: concurrent registrations", () => {
  it("three users register sequentially and get unique IDs", () => {
    const r1 = registerEvent(ALICE, "fire", "zone-1");
    const r2 = registerEvent(BOB, "flood", "zone-2");
    const r3 = registerEvent(CAROL, "gas-leak", "zone-3");

    expect(cvToJSON(r1.result).value.value).toBe("0");
    expect(cvToJSON(r2.result).value.value).toBe("1");
    expect(cvToJSON(r3.result).value.value).toBe("2");
  });

  it("each registration preserves its own owner", () => {
    registerEvent(ALICE, "fire", "z1");
    registerEvent(BOB, "flood", "z2");
    registerEvent(CAROL, "gas-leak", "z3");

    expect(cvToJSON(getEvent(0).result).value.value.owner.value).toBe(ALICE);
    expect(cvToJSON(getEvent(1).result).value.value.owner.value).toBe(BOB);
    expect(cvToJSON(getEvent(2).result).value.value.owner.value).toBe(CAROL);
  });

  it("counter reflects total after multiple registrations", () => {
    registerEvent(ALICE, "a", "d");
    registerEvent(BOB, "b", "d");
    registerEvent(CAROL, "c", "d");
    registerEvent(ALICE, "d", "d");
    registerEvent(BOB, "e", "d");

    expect(cvToJSON(getEventCount().result).value.value).toBe("5");
  });

  it("same user can register multiple events", () => {
    registerEvent(ALICE, "alert-1", "data-1");
    registerEvent(ALICE, "alert-2", "data-2");
    registerEvent(ALICE, "alert-3", "data-3");

    expect(cvToJSON(getEvent(0).result).value.value["event-type"].value).toBe("alert-1");
    expect(cvToJSON(getEvent(1).result).value.value["event-type"].value).toBe("alert-2");
    expect(cvToJSON(getEvent(2).result).value.value["event-type"].value).toBe("alert-3");
  });
});

// ── Access control enforcement ───────────────────────────

describe("integration :: access control enforcement", () => {
  it("owner can update own event but not another user's", () => {
    registerEvent(ALICE, "sensor", "temp-high");
    registerEvent(BOB, "sensor", "humidity-low");

    expect(cvToJSON(updateEvent(ALICE, 0, "temp-normal").result).value.value).toBe(true);
    expect(cvToJSON(updateEvent(ALICE, 1, "hijacked").result).value.value).toBe("403");

    expect(cvToJSON(getEvent(1).result).value.value.data.value).toBe("humidity-low");
  });

  it("owner can deactivate own event but not another user's", () => {
    registerEvent(ALICE, "alarm", "building-A");
    registerEvent(BOB, "alarm", "building-B");

    expect(cvToJSON(deactivateEvent(ALICE, 0).result).value.value).toBe(true);
    expect(cvToJSON(deactivateEvent(ALICE, 1).result).value.value).toBe("403");

    expect(cvToJSON(getEvent(1).result).value.value.active.value).toBe(true);
  });

  it("deactivated event cannot be updated even by owner", () => {
    registerEvent(ALICE, "alert", "initial");
    deactivateEvent(ALICE, 0);
    const result = updateEvent(ALICE, 0, "try-update");
    expect(cvToJSON(result.result).value.value).toBe("410");

    expect(cvToJSON(getEvent(0).result).value.value.data.value).toBe("initial");
  });

  it("admin pause blocks all user operations uniformly", () => {
    registerEvent(ALICE, "alert", "data-1");
    registerEvent(BOB, "alert", "data-2");

    expect(cvToJSON(pauseContract(DEPLOYER).result).value.value).toBe(true);

    expect(cvToJSON(registerEvent(CAROL, "new", "d").result).value.value).toBe("503");
    expect(cvToJSON(updateEvent(ALICE, 0, "new").result).value.value).toBe("503");
    expect(cvToJSON(deactivateEvent(BOB, 1).result).value.value).toBe("503");
  });

  it("non-admin cannot pause or unpause", () => {
    expect(cvToJSON(pauseContract(ALICE).result).value.value).toBe("403");

    pauseContract(DEPLOYER); // Success
    expect(cvToJSON(unpauseContract(BOB).result).value.value).toBe("403");
  });
});

// ── Event deactivation lifecycle ─────────────────────────

describe("integration :: event deactivation lifecycle", () => {
  it("deactivation preserves all fields except active flag", () => {
    registerEvent(ALICE, "equipment-failure", "pump-7-offline");
    deactivateEvent(ALICE, 0);

    const ev = cvToJSON(getEvent(0).result).value.value;
    expect(ev.owner.value).toBe(ALICE);
    expect(ev["event-type"].value).toBe("equipment-failure");
    expect(ev.data.value).toBe("pump-7-offline");
    expect(ev.active.value).toBe(false);
  });

  it("deactivation of one event does not affect others", () => {
    registerEvent(ALICE, "fire", "zone-1");
    registerEvent(ALICE, "flood", "zone-2");
    registerEvent(ALICE, "gas", "zone-3");

    deactivateEvent(ALICE, 1);

    expect(cvToJSON(getEvent(0).result).value.value.active.value).toBe(true);
    expect(cvToJSON(getEvent(1).result).value.value.active.value).toBe(false);
    expect(cvToJSON(getEvent(2).result).value.value.active.value).toBe(true);
  });

  it("cannot deactivate a nonexistent event", () => {
    const result = deactivateEvent(ALICE, 99);
    expect(cvToJSON(result.result).value.value).toBe("404");
  });

  it("pause, unpause, then deactivate succeeds", () => {
    registerEvent(ALICE, "alert", "data");

    pauseContract(DEPLOYER);
    expect(cvToJSON(deactivateEvent(ALICE, 0).result).value.value).toBe("503");

    unpauseContract(DEPLOYER);
    expect(cvToJSON(deactivateEvent(ALICE, 0).result).value.value).toBe(true);
  });
});
