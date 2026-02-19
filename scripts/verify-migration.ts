import {
  callReadOnlyFunction,
  cvToValue,
  uintCV,
} from "@stacks/transactions";
import { StacksMainnet } from "@stacks/network";

/**
 * Post-Migration Verification Script
 *
 * Compares event data between v1 and v2 contracts to confirm
 * migration integrity. Run this after all migrate-event
 * transactions have confirmed on-chain.
 *
 * Usage:
 *   npx ts-node scripts/verify-migration.ts
 */

const V1_ADDRESS = "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T";
const V1_NAME = "ewatch";
const V2_ADDRESS = "SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T";
const V2_NAME = "ewatch-v2";

const network = new StacksMainnet();

interface VerificationResult {
  eventId: number;
  status: "match" | "mismatch" | "missing-v1" | "missing-v2";
  details?: string;
}

async function readEventCount(address: string, name: string): Promise<number> {
  const result = await callReadOnlyFunction({
    contractAddress: address,
    contractName: name,
    functionName: "get-event-count",
    functionArgs: [],
    network,
    senderAddress: address,
  });
  const value = cvToValue(result);
  return Number(value.value);
}

async function readEvent(
  address: string,
  name: string,
  eventId: number
): Promise<Record<string, any> | null> {
  const result = await callReadOnlyFunction({
    contractAddress: address,
    contractName: name,
    functionName: "get-event",
    functionArgs: [uintCV(eventId)],
    network,
    senderAddress: address,
  });
  const value = cvToValue(result);
  return value || null;
}

function normalize(raw: any): Record<string, string | number | boolean> {
  return {
    owner: raw.owner?.value || raw.owner,
    eventType: raw["event-type"]?.value || raw["event-type"],
    timestamp: Number(raw.timestamp?.value || raw.timestamp),
    data: raw.data?.value || raw.data,
    active:
      raw.active?.value !== undefined ? raw.active.value : raw.active,
  };
}

async function verify(): Promise<void> {
  console.log("E-Watch Migration Verification");
  console.log("==============================\n");

  const v1Count = await readEventCount(V1_ADDRESS, V1_NAME);
  const v2Count = await readEventCount(V2_ADDRESS, V2_NAME);

  console.log(`v1 event count: ${v1Count}`);
  console.log(`v2 event count: ${v2Count}`);

  if (v1Count !== v2Count) {
    console.log(`\nCounter mismatch: v1=${v1Count}, v2=${v2Count}`);
  }

  const checkCount = Math.max(v1Count, v2Count);
  const results: VerificationResult[] = [];

  for (let i = 0; i < checkCount; i++) {
    const v1Raw = await readEvent(V1_ADDRESS, V1_NAME, i);
    const v2Raw = await readEvent(V2_ADDRESS, V2_NAME, i);

    if (!v1Raw && !v2Raw) {
      continue;
    }

    if (!v1Raw) {
      results.push({
        eventId: i,
        status: "missing-v1",
        details: "Event exists on v2 but not v1 (new post-migration event)",
      });
      continue;
    }

    if (!v2Raw) {
      results.push({
        eventId: i,
        status: "missing-v2",
        details: "Event exists on v1 but was not migrated to v2",
      });
      continue;
    }

    const v1 = normalize(v1Raw);
    const v2 = normalize(v2Raw);

    const fields = ["owner", "eventType", "timestamp", "data", "active"];
    const mismatches: string[] = [];

    for (const field of fields) {
      if (v1[field] !== v2[field]) {
        mismatches.push(`${field}: v1=${v1[field]}, v2=${v2[field]}`);
      }
    }

    if (mismatches.length > 0) {
      results.push({
        eventId: i,
        status: "mismatch",
        details: mismatches.join("; "),
      });
    } else {
      results.push({ eventId: i, status: "match" });
    }
  }

  // Report
  const matched = results.filter((r) => r.status === "match").length;
  const mismatched = results.filter((r) => r.status === "mismatch").length;
  const missingV2 = results.filter((r) => r.status === "missing-v2").length;
  const newOnV2 = results.filter((r) => r.status === "missing-v1").length;

  console.log(`\nResults:`);
  console.log(`  Matched:     ${matched}`);
  console.log(`  Mismatched:  ${mismatched}`);
  console.log(`  Missing v2:  ${missingV2}`);
  console.log(`  New on v2:   ${newOnV2}`);

  if (mismatched > 0 || missingV2 > 0) {
    console.log("\nIssues found:");
    for (const r of results.filter(
      (r) => r.status === "mismatch" || r.status === "missing-v2"
    )) {
      console.log(`  Event ${r.eventId}: ${r.status} - ${r.details}`);
    }
    process.exit(1);
  }

  console.log("\nAll events verified successfully.");
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
